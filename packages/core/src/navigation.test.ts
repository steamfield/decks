import { describe, expect, it } from "vitest";
import type { DeckManifest } from "./manifest";
import { clampNav, type NavAction, navDirection, navigate } from "./navigation";

function manifest(): DeckManifest {
  return {
    name: "navigation",
    title: "Navigation",
    canvas: { width: 1920, height: 1080 },
    slides: [
      { no: 1, id: "intro", file: "intro.mdx", title: "Intro", clicks: 0 },
      { no: 2, id: "steps", file: "steps.mdx", title: "Steps", clicks: 3 },
      { no: 3, id: "end", file: "end.mdx", title: "End", clicks: 1 },
    ],
  };
}

describe("clampNav", () => {
  it.each([
    { name: "below-range slide", state: { slide: -2, click: 2 }, expected: { slide: 1, click: 0 } },
    { name: "above-range slide", state: { slide: 8, click: 3 }, expected: { slide: 3, click: 1 } },
    { name: "fractional slide", state: { slide: 2.9, click: 2 }, expected: { slide: 2, click: 2 } },
    { name: "NaN slide", state: { slide: NaN, click: 2 }, expected: { slide: 1, click: 0 } },
    { name: "below-range click", state: { slide: 2, click: -1 }, expected: { slide: 2, click: 0 } },
    { name: "above-range click", state: { slide: 2, click: 9 }, expected: { slide: 2, click: 3 } },
    { name: "fractional click", state: { slide: 2, click: 1.9 }, expected: { slide: 2, click: 1 } },
    { name: "NaN click", state: { slide: 2, click: NaN }, expected: { slide: 2, click: 0 } },
    {
      name: "positive infinite slide",
      state: { slide: Infinity, click: 0 },
      expected: { slide: 3, click: 0 },
    },
    {
      name: "negative infinite slide",
      state: { slide: -Infinity, click: 0 },
      expected: { slide: 1, click: 0 },
    },
    {
      name: "positive infinite click",
      state: { slide: 2, click: Infinity },
      expected: { slide: 2, click: 3 },
    },
    {
      name: "negative infinite click",
      state: { slide: 2, click: -Infinity },
      expected: { slide: 2, click: 0 },
    },
  ])("clamps a $name", ({ state, expected }) => {
    expect(clampNav(state, manifest())).toEqual(expected);
  });

  it("returns the input object itself when it is already in range", () => {
    for (const state of [
      { slide: 1, click: 0 },
      { slide: 2, click: 0 },
      { slide: 2, click: 3 },
      { slide: 3, click: 1 },
    ]) {
      expect(clampNav(state, manifest())).toBe(state);
    }
  });

  it("does not mutate an invalid input while clamping it", () => {
    const state = Object.freeze({ slide: 2.8, click: 9 });
    expect(clampNav(state, manifest())).toEqual({ slide: 2, click: 3 });
    expect(state).toEqual({ slide: 2.8, click: 9 });
  });
});

describe("navigate", () => {
  it("next, clicks remain on the slide: advances the click", () => {
    expect(navigate({ slide: 2, click: 1 }, { type: "next" }, manifest())).toEqual({
      slide: 2,
      click: 2,
    });
  });

  it("next, on the slide's last click, a later slide exists: enters it at click 0", () => {
    expect(navigate({ slide: 2, click: 3 }, { type: "next" }, manifest())).toEqual({
      slide: 3,
      click: 0,
    });
  });

  it("next, last click of the last slide: stays unchanged", () => {
    const state = { slide: 3, click: 1 };
    expect(navigate(state, { type: "next" }, manifest())).toBe(state);
  });

  it("prev, click > 0: decrements the click", () => {
    expect(navigate({ slide: 2, click: 2 }, { type: "prev" }, manifest())).toEqual({
      slide: 2,
      click: 1,
    });
  });

  it("prev, click === 0, an earlier slide exists: enters its last click", () => {
    expect(navigate({ slide: 3, click: 0 }, { type: "prev" }, manifest())).toEqual({
      slide: 2,
      click: 3,
    });
  });

  it("prev, slide 1 click 0: stays unchanged", () => {
    const state = { slide: 1, click: 0 };
    expect(navigate(state, { type: "prev" }, manifest())).toBe(state);
  });

  it("nextSlide: enters the next slide at click 0 and stays unchanged on the last slide", () => {
    expect(navigate({ slide: 2, click: 2 }, { type: "nextSlide" }, manifest())).toEqual({
      slide: 3,
      click: 0,
    });
    const state = { slide: 3, click: 1 };
    expect(navigate(state, { type: "nextSlide" }, manifest())).toBe(state);
  });

  it("prevSlide: enters the previous slide at click 0 and stays unchanged on slide 1", () => {
    expect(navigate({ slide: 3, click: 1 }, { type: "prevSlide" }, manifest())).toEqual({
      slide: 2,
      click: 0,
    });
    const state = { slide: 1, click: 0 };
    expect(navigate(state, { type: "prevSlide" }, manifest())).toBe(state);
  });

  it("go: enters that slide at click ?? 0, then clamps", () => {
    const deck = manifest();
    expect(navigate({ slide: 1, click: 0 }, { type: "go", slide: 2, click: 2 }, deck)).toEqual({
      slide: 2,
      click: 2,
    });
    expect(navigate({ slide: 2, click: 2 }, { type: "go", slide: 2 }, deck)).toEqual({
      slide: 2,
      click: 0,
    });
    expect(navigate({ slide: 1, click: 0 }, { type: "go", slide: 9, click: 9 }, deck)).toEqual({
      slide: 3,
      click: 1,
    });
  });

  it("next leaves a slide with no clicks and prev returns to it at click 0", () => {
    const deck = manifest();
    expect(navigate({ slide: 1, click: 0 }, { type: "next" }, deck)).toEqual({
      slide: 2,
      click: 0,
    });
    expect(navigate({ slide: 2, click: 0 }, { type: "prev" }, deck)).toEqual({
      slide: 1,
      click: 0,
    });
  });

  it("go returns the input object itself when the target clamps to the input", () => {
    const state = { slide: 3, click: 1 };
    expect(navigate(state, { type: "go", slide: 9, click: 9 }, manifest())).toBe(state);
  });

  it("go returns the input object itself when its target is already current", () => {
    const state = { slide: 2, click: 2 };
    expect(navigate(state, { type: "go", slide: 2, click: 2 }, manifest())).toBe(state);
  });

  it.each([
    { type: "next" },
    { type: "prev" },
    { type: "nextSlide" },
    { type: "prevSlide" },
    { type: "go", slide: 1 },
  ] satisfies NavAction[])("$type leaves a single-slide deck unchanged", (action) => {
    const deck = manifest();
    const state = { slide: 1, click: 0 };
    expect(navigate(state, action, { ...deck, slides: deck.slides.slice(0, 1) })).toBe(state);
  });

  it("clamps a bad input state before next advances it", () => {
    expect(navigate({ slide: NaN, click: NaN }, { type: "next" }, manifest())).toEqual({
      slide: 2,
      click: 0,
    });
  });

  it("clamps a bad input state before prev decrements it", () => {
    expect(navigate({ slide: 99, click: 99 }, { type: "prev" }, manifest())).toEqual({
      slide: 3,
      click: 0,
    });
  });

  it("clamps a bad input state even when the action cannot move further", () => {
    expect(navigate({ slide: -1, click: -1 }, { type: "prevSlide" }, manifest())).toEqual({
      slide: 1,
      click: 0,
    });
  });

  it.each([
    { slide: -1, click: -1, expected: { slide: 1, click: 0 } },
    { slide: NaN, click: NaN, expected: { slide: 1, click: 0 } },
    { slide: 2.9, click: 1.9, expected: { slide: 2, click: 1 } },
  ])("clamps a go result with slide $slide and click $click", ({ slide, click, expected }) => {
    expect(navigate({ slide: 3, click: 1 }, { type: "go", slide, click }, manifest())).toEqual(
      expected,
    );
  });

  it("does not mutate its input state or action", () => {
    const state = Object.freeze({ slide: 2, click: 1 });
    const action: NavAction = Object.freeze({ type: "next" });
    expect(navigate(state, action, manifest())).toEqual({ slide: 2, click: 2 });
    expect(state).toEqual({ slide: 2, click: 1 });
    expect(action).toEqual({ type: "next" });
  });
});

describe("navDirection", () => {
  it("compares slide before click when moving forward", () => {
    expect(navDirection({ slide: 2, click: 3 }, { slide: 3, click: 0 })).toBe("forward");
  });

  it("compares slide before click when moving backward", () => {
    expect(navDirection({ slide: 3, click: 0 }, { slide: 2, click: 3 })).toBe("backward");
  });

  it("compares clicks forward on the same slide", () => {
    expect(navDirection({ slide: 2, click: 1 }, { slide: 2, click: 2 })).toBe("forward");
  });

  it("compares clicks backward on the same slide", () => {
    expect(navDirection({ slide: 2, click: 2 }, { slide: 2, click: 1 })).toBe("backward");
  });

  it("returns none for equal values even in different objects", () => {
    expect(navDirection({ slide: 2, click: 2 }, { slide: 2, click: 2 })).toBe("none");
  });
});
