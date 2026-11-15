import { expect, it } from "vitest";
import { inkStyle, polylinePath, STORY_STYLE, STROKE } from "../index";

it("reads a deck's mutable ink style at call time", () => {
  expect(inkStyle()).toBe("clean");
  try {
    STORY_STYLE.ink = "marker";
    expect(inkStyle()).toBe("marker");
  } finally {
    STORY_STYLE.ink = "clean";
  }
  expect(STROKE).toEqual({ line: 3.5, rule: 1.5, tick: 4, faint: 2 });
});

it("draws a polyline rounded to centipixels", () => {
  expect(polylinePath([])).toBe("");
  expect(
    polylinePath([
      { x: 1.234, y: 2.345 },
      { x: -4.567, y: 0 },
    ]),
  ).toBe("M1.23 2.35L-4.57 0");
});
