import { createMemoryHub } from "@react-decks/core";
import { render, screen, within } from "@testing-library/react";
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

it.each(["#/overview/1", "#/print", "#/presenter/1"])(
  "a link in the noninteractive rendering of %s is a span",
  async (hash) => {
    setup(hash);
    const area =
      hash === "#/presenter/1" ? within(screen.getByRole("region", { name: "Next" })) : screen;
    if (hash === "#/presenter/1") {
      expect((await area.findByText("Back to start")).tagName).toBe("SPAN");
      expect(area.queryByRole("link")).not.toBeInTheDocument();
      return;
    }
    expect((await area.findByText("Jump to steps")).tagName).toBe("SPAN");
    expect(area.queryByRole("link")).not.toBeInTheDocument();
  },
);

it.each([0, 6, 1.5])("an invalid target %s throws with the target and deck count", async (to) => {
  setup("#/1", to);
  expect(
    await screen.findByText(
      `Slide slide-1 (slides/1.mdx) failed to render: Invalid slide ${to} in a deck with 5 slides`,
    ),
  ).toBeVisible();
});
