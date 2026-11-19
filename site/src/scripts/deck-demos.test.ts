import { act, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { DemoPlayer } from "../data/demo-examples";
import { mountDeckDemos } from "./deck-demos";
import { installIntersectionObserver, installMotionPreference } from "./site.test-support";

const player = (name: string): DemoPlayer => ({
  range: { first: 2, last: 2 },
  example: {
    name: "guide-demos",
    title: `${name} demo`,
    href: "/d/guide-demos/",
    slides: 5,
    slideTitles: [],
    startSlide: 2,
    startBeat: 1,
    states: [
      { slide: 2, beat: 0, beats: 1, lead: "", body: "" },
      { slide: 2, beat: 1, beats: 1, lead: "", body: "" },
    ],
    provenance: { kind: "agent", label: "Demo" },
    poster: null,
    loop: null,
    run: null,
    edits: null,
  },
});

/** Server-rendered demo figures as src/lib/markdown.ts writes them. */
function figures(names: string[]) {
  document.body.innerHTML = names
    .map(
      (name) =>
        `<figure data-deck-demo><div data-deck-demo-player='${JSON.stringify(player(name))}'><img alt="${name} poster"></div></figure>`,
    )
    .join("");
  return [...document.querySelectorAll<HTMLElement>("[data-deck-demo-player]")];
}

/** Reports a stage in or out of view, with a matching box (happy-dom has no layout). */
function viewer() {
  const intersect = installIntersectionObserver();
  return (element: Element, inView = true) => {
    element.getBoundingClientRect = () =>
      (inView ? { top: 0, bottom: 300 } : { top: -900, bottom: -600 }) as DOMRect;
    intersect(element, inView);
  };
}

let stop = () => {};
afterEach(() => {
  act(() => stop());
  document.body.innerHTML = "";
});

describe("guide demo players", () => {
  it("replaces a poster with a live player only once it scrolls into view", () => {
    installMotionPreference(true);
    const intersect = viewer();
    const [first, second] = figures(["Stagger", "Draw"]);
    stop = mountDeckDemos();
    expect(screen.getAllByRole("img")).toHaveLength(2);
    act(() => intersect(first as Element));
    expect(screen.getByRole("group", { name: /^Deck player: Stagger demo/ })).toBeInTheDocument();
    expect(within(second as HTMLElement).getByRole("img", { name: "Draw poster" })).toBeVisible();
  });

  it("keeps at most three live, sending the earliest that scrolled away back to its poster", () => {
    installMotionPreference(true);
    const intersect = viewer();
    const stages = figures(["One", "Two", "Three", "Four"]);
    stop = mountDeckDemos();
    for (const stage of stages.slice(0, 3)) act(() => intersect(stage));
    act(() => intersect(stages[0] as Element, false));
    act(() => intersect(stages[1] as Element, false));
    act(() => intersect(stages[3] as Element));
    expect(
      screen
        .getAllByRole("group", { name: /^Deck player:/ })
        .map((g) => g.getAttribute("aria-label")),
    ).toEqual([
      expect.stringMatching(/Two demo/),
      expect.stringMatching(/Three demo/),
      expect.stringMatching(/Four demo/),
    ]);
    expect(screen.getByRole("img", { name: "One poster" })).toBeInTheDocument();
  });

  it("holds a fourth demo on its poster while three live ones are on screen, then mounts it", () => {
    installMotionPreference(true);
    const intersect = viewer();
    const stages = figures(["One", "Two", "Three", "Four"]);
    stop = mountDeckDemos();
    for (const stage of stages) act(() => intersect(stage));
    expect(screen.getAllByRole("group", { name: /^Deck player:/ })).toHaveLength(3);
    expect(screen.getByRole("img", { name: "Four poster" })).toBeInTheDocument();
    act(() => intersect(stages[0] as Element, false));
    expect(screen.getByRole("group", { name: /^Deck player: Four demo/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "One poster" })).toBeInTheDocument();
  });
});
