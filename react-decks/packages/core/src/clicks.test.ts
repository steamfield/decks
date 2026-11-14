import { describe, expect, it } from "vitest";
import { clicksForSlide, stepState } from "./clicks";
import type { DeckManifest } from "./manifest";

function manifest(): DeckManifest {
  return {
    name: "clicks",
    title: "Clicks",
    canvas: { width: 1920, height: 1080 },
    slides: [
      { no: 1, id: "intro", file: "intro.mdx", title: "Intro", clicks: 0 },
      { no: 2, id: "steps", file: "steps.mdx", title: "Steps", clicks: 3 },
      { no: 3, id: "end", file: "end.mdx", title: "End", clicks: 1 },
    ],
  };
}

describe("clicksForSlide", () => {
  it("the current slide gets nav.click", () => {
    expect(clicksForSlide(2, { slide: 2, click: 1 }, manifest())).toBe(1);
  });

  it("an earlier slide gets its own clicks total", () => {
    expect(clicksForSlide(2, { slide: 3, click: 0 }, manifest())).toBe(3);
  });

  it("a later slide gets 0", () => {
    expect(clicksForSlide(2, { slide: 1, click: 0 }, manifest())).toBe(0);
  });

  it.each([0, -1, 4, 2.5, NaN])("an unknown slide number %s gets 0", (slideNo) => {
    const deck = manifest();
    expect(clicksForSlide(slideNo, { slide: 2, click: 1 }, deck)).toBe(0);
    expect(clicksForSlide(slideNo, { slide: slideNo, click: 1 }, deck)).toBe(0);
  });

  it("does not clamp the current slide's supplied click", () => {
    expect(clicksForSlide(2, { slide: 2, click: 9 }, manifest())).toBe(9);
  });
});

describe("stepState", () => {
  it("before when clicks < at", () => {
    expect(stepState(1, 2)).toBe("before");
    expect(stepState(1, 2, 4)).toBe("before");
  });

  it("current when clicks === at", () => {
    expect(stepState(2, 2)).toBe("current");
    expect(stepState(2, 2, 4)).toBe("current");
    expect(stepState(0, 0)).toBe("current");
  });

  it("after when clicks > at and until is undefined or clicks < until", () => {
    expect(stepState(3, 2)).toBe("after");
    expect(stepState(3, 2, 4)).toBe("after");
  });

  it("gone when until is defined and clicks >= until", () => {
    expect(stepState(4, 2, 4)).toBe("gone");
    expect(stepState(5, 2, 4)).toBe("gone");
  });

  it.each([2, 1, 0, -1])("throws an Error naming until %s when until <= at", (until) => {
    for (const clicks of [0, 2, 5]) {
      expect(() => stepState(clicks, 2, until)).toThrow(Error);
      expect(() => stepState(clicks, 2, until)).toThrow(String(until));
    }
  });
});
