import { createMemoryHub } from "@react-decks/core";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, onTestFinished } from "vitest";
import { makeSource } from "../deck.test-support";
import { createDeckStore, Deck, type DeckSource, Link } from "../index";

function setup(hash = "#/1", to = 2) {
  window.history.replaceState(null, "", `/${hash}`);
  const base = makeSource();
  const source: DeckSource = {
    ...base,
    layers: { credit: false },
    slides: {
      ...Object.fromEntries(
        base.manifest.slides.map(({ id, no }) => [
          id,
          async () => ({ default: () => <p>Slide {no}</p> }),
        ]),
      ),
      "slide-1": async () => ({ default: () => <Link to={to}>Jump to steps</Link> }),
      "slide-2": async () => ({ default: () => <Link to={1}>Back to start</Link> }),
    },
  };
  const store = createDeckStore(source.manifest, { transport: createMemoryHub().connect() });
  const result = render(<Deck source={source} store={store} />);
  onTestFinished(() => {
    result.unmount();
    store.destroy();
    window.history.replaceState(null, "", "/");
  });
  return userEvent.setup();
}

it("a slide link has a formatted hash and navigates to click zero", async () => {
  const user = setup();
  const link = await screen.findByRole("link", { name: "Jump to steps" });
  expect(link).toHaveAttribute("href", "#/2");
  await user.click(link);
  expect(window.location.hash).toBe("#/2");
  expect(await screen.findByRole("link", { name: "Back to start" })).toBeVisible();
});

it("a presenter link preserves the presenter view", async () => {
  const user = setup("#/presenter/1");
  const current = within(screen.getByRole("region", { name: "Current slide" }));
  const link = await current.findByRole("link", { name: "Jump to steps" });
  expect(link).toHaveAttribute("href", "#/presenter/2");
  await user.click(link);
  expect(window.location.hash).toBe("#/presenter/2");
  expect(await current.findByRole("link", { name: "Back to start" })).toBeVisible();
});

it.each(["#/overview/1", "#/print"])("a link in %s is a span", async (hash) => {
  setup(hash);
  expect((await screen.findAllByText("Jump to steps"))[0]?.tagName).toBe("SPAN");
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});

it("a link in the presenter's Next preview is a span", async () => {
  setup("#/presenter/1");
  const next = within(screen.getByRole("region", { name: "Next" }));
  expect((await next.findByText("Back to start")).tagName).toBe("SPAN");
  expect(next.queryByRole("link")).not.toBeInTheDocument();
});

it("Enter on the focused link navigates", async () => {
  const user = setup();
  (await screen.findByRole("link", { name: "Jump to steps" })).focus();
  await user.keyboard("{Enter}");
  expect(window.location.hash).toBe("#/2");
  expect(await screen.findByRole("link", { name: "Back to start" })).toBeVisible();
});

/** Clicks the link and says whether the link cancelled the browser's own handling of it. */
function clickCancelled(link: HTMLElement, init?: MouseEventInit): boolean {
  const seen: boolean[] = [];
  const record = (event: Event) => {
    seen.push(event.defaultPrevented);
    // Stop jsdom following the href itself, which would move the hash under later tests.
    event.preventDefault();
  };
  document.addEventListener("click", record);
  fireEvent.click(link, init);
  document.removeEventListener("click", record);
  return seen[0] ?? false;
}

// The browser opens these in a new tab or window, so the link must not cancel them.
it.each([
  ["Ctrl-click", { ctrlKey: true }],
  ["Cmd-click", { metaKey: true }],
  ["Shift-click", { shiftKey: true }],
  ["Alt-click", { altKey: true }],
  ["middle-click", { button: 1 }],
])("a %s is left to the browser", async (_name, init) => {
  setup();
  const link = await screen.findByRole("link", { name: "Jump to steps" });
  expect(clickCancelled(link, init)).toBe(false);
});

it("a plain click is taken over so the browser does not reload the page", async () => {
  setup();
  const link = await screen.findByRole("link", { name: "Jump to steps" });
  expect(clickCancelled(link)).toBe(true);
});

it.each([0, 6, 1.5])("an invalid target %s throws with the target and deck count", async (to) => {
  setup("#/1", to);
  expect(
    await screen.findByText(
      `Slide slide-1 (slides/1.mdx) failed to render: Invalid slide ${to} in a deck with 5 slides`,
    ),
  ).toBeVisible();
});
