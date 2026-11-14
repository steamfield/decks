import { act, renderHook, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { AutoFromProps, makeSource, Status, setup } from "./deck.test-support";
import { Notes, SlideHost, useDeck, useSlide, useSlideScale } from "./index";

function Preview() {
  const slide = useSlide();
  if (slide.renderContext !== "slide") return <Status />;
  const { preview } = slide.frontmatter;
  if (
    preview !== "presenter" &&
    preview !== "preview" &&
    preview !== "overview" &&
    preview !== "print"
  )
    throw new Error(`Invalid preview ${preview}`);
  return <SlideHost no={slide.no} context={preview} clicks={2} />;
}

function WithNotes() {
  return (
    <>
      <h1>Audience content</h1>
      <Notes>Secret speaker notes</Notes>
    </>
  );
}

it("useDeck reports the manifest and navigation state and each action changes the deck", async () => {
  const user = userEvent.setup();
  setup("#/2?clicks=1");
  expect(
    await screen.findByRole("status", { name: "Deck 2/5 click 1/3 view play print false" }),
  ).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Next click" }));
  expect(window.location.hash).toBe("#/2?clicks=2");
  await user.click(screen.getByRole("button", { name: "Previous click" }));
  expect(window.location.hash).toBe("#/2?clicks=1");
  await user.click(screen.getByRole("button", { name: "Next slide" }));
  expect(window.location.hash).toBe("#/3");
  await user.click(await screen.findByRole("button", { name: "Previous slide" }));
  expect(window.location.hash).toBe("#/2");
  await user.click(await screen.findByRole("button", { name: "Go to fourth click one" }));
  expect(window.location.hash).toBe("#/4?clicks=1");
  await user.click(await screen.findByRole("button", { name: "Go to second" }));
  expect(window.location.hash).toBe("#/2");
});

it("useSlide reports current, fully revealed previous and unrevealed next instances", async () => {
  const { container } = setup("#/3");
  await screen.findByRole("heading", { name: "Title 3" });
  for (const [no, clicks, total, active] of [
    [2, 3, 3, false],
    [3, 0, 0, true],
    [4, 0, 1, false],
  ]) {
    const root = container.querySelector(`[data-deck-slide="${no}"]`);
    if (!(root instanceof HTMLElement)) throw new Error(`Missing slide ${no}`);
    expect(
      await within(root).findByText(
        `Slide ${no} id slide-${no} click ${clicks}/${total} active ${active} context slide custom slide-${no}`,
      ),
    ).toBeInTheDocument();
  }
});

it("useSlide tracks the current slide's click", async () => {
  const user = userEvent.setup();
  setup("#/2");
  await user.click(await screen.findByRole("button", { name: "Next click" }));
  expect(
    screen.getByText("Slide 2 id slide-2 click 1/3 active true context slide custom slide-2"),
  ).toBeVisible();
});

it.each(["presenter", "preview", "overview", "print"] as const)(
  "SlideHost renders explicit clicks in %s context without changing the URL",
  async (context) => {
    const source = makeSource();
    const { container } = setup("#/2", {
      ...source,
      frontmatter: { ...source.frontmatter, "slide-2": { custom: "slide-2", preview: context } },
      slides: { ...source.slides, "slide-2": async () => ({ default: Preview }) },
    });
    expect(
      await screen.findByText(
        `Slide 2 id slide-2 click 2/3 active false context ${context} custom slide-2`,
      ),
    ).toBeVisible();
    const root = container.querySelector(`[data-deck-context="${context}"]`);
    expect(root).not.toHaveAttribute("data-deck-active");
    expect(root).not.toHaveAttribute("hidden");
    expect(window.location.hash).toBe("#/2");
  },
);

it.each(["play", "presenter", "overview", "print"] as const)(
  "Deck sets html attributes and renders PlayView for %s",
  async (view) => {
    setup(view === "play" ? "#/1" : view === "presenter" ? "#/presenter/1" : `#/${view}`);
    expect(
      await screen.findByRole("status", {
        name: `Deck 1/5 click 0/0 view ${view} print ${view === "print"}`,
      }),
    ).toBeVisible();
    expect(document.documentElement).toHaveAttribute("data-deck-view", view);
    expect(document.documentElement).toHaveAttribute("data-deck-motion", "live");
  },
);

it("a URL view change updates useDeck and the html attribute", async () => {
  setup();
  await act(async () => {
    window.location.hash = "#/print";
  });
  await waitFor(() => expect(document.documentElement).toHaveAttribute("data-deck-view", "print"));
  expect(
    await screen.findByRole("status", { name: "Deck 1/5 click 0/0 view print print true" }),
  ).toBeVisible();
});

it("a slide receives the deck's components without importing them", async () => {
  const source = makeSource();
  setup("#/1", {
    ...source,
    slides: { ...source.slides, "slide-1": async () => ({ default: AutoFromProps }) },
  });
  expect(await screen.findByText("Automatically provided")).toBeVisible();
});

it("Notes renders nothing", async () => {
  const source = makeSource();
  setup("#/1", {
    ...source,
    slides: { ...source.slides, "slide-1": async () => ({ default: WithNotes }) },
  });
  expect(await screen.findByRole("heading", { name: "Audience content" })).toBeVisible();
  expect(screen.queryByText("Secret speaker notes")).not.toBeInTheDocument();
});

it("useDeck names the missing Deck provider", () => {
  expect(() => renderHook(useDeck)).toThrow("Deck provider");
});

it("useSlide names the missing SlideHost provider", () => {
  expect(() => renderHook(useSlide)).toThrow("SlideHost provider");
});

it("useSlideScale is one outside a frame", () => {
  expect(renderHook(useSlideScale).result.current).toBe(1);
});
