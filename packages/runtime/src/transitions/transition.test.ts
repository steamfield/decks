import { expect, it } from "vitest";
import { makeSource } from "../deck.test-support";
import type { DeckState } from "../store/store";
import { transitionName } from "./transition";

const state = (slide: number, click = 0): DeckState => ({
  nav: { slide, click },
  view: "play",
  embedded: false,
  bridge: false,
});

it.each([
  [1, 2, "push"],
  [2, 1, "push"],
  [2, 3, "zoom"],
  [3, 2, "zoom"],
  [1, 4, "zoom"],
  [4, 1, "zoom"],
])("the boundary from %i to %i uses %s", (from, to, name) => {
  const source = makeSource();
  const manifest = {
    ...source.manifest,
    transition: "zoom",
    slides: source.manifest.slides.map((slide) => ({
      ...slide,
      ...(slide.no === 1 ? { transition: "push" } : {}),
    })),
  };
  expect(transitionName(manifest, state(from), state(to))).toBe(name);
});

it("a boundary and a jump without overrides default to fade", () => {
  const { manifest } = makeSource();
  expect(transitionName(manifest, state(1), state(2))).toBe("fade");
  expect(transitionName(manifest, state(4), state(1))).toBe("fade");
});

it("only a changed click with morphSteps uses step", () => {
  const { manifest } = makeSource();
  const morph = {
    ...manifest,
    slides: manifest.slides.map((slide) => ({ ...slide, morphSteps: true })),
  };
  expect(transitionName(manifest, state(2), state(2, 1))).toBeUndefined();
  expect(transitionName(morph, state(2), state(2, 1))).toBe("step");
  expect(transitionName(morph, state(2, 1), state(2))).toBe("step");
  expect(transitionName(morph, state(2), state(2))).toBeUndefined();
});
