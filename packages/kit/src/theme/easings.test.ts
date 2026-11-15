import { ease } from "@react-decks/motion";
import { describe, expect, it } from "vitest";
import {
  DRAW,
  DRAW_CSS,
  DUR,
  easedStagger,
  gsap,
  SETTLE,
  SETTLE_CSS,
  TRACE,
  TRACE_CSS,
} from "../index";

const SAMPLES = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1];

describe("easings", () => {
  it("exposes every duration as a positive number of seconds", () => {
    for (const [name, seconds] of Object.entries(DUR)) {
      expect(seconds, name).toBeGreaterThan(0);
      expect(seconds, `${name} looks like milliseconds`).toBeLessThan(10);
    }
  });

  it.each([
    ["settle", SETTLE, SETTLE_CSS],
    ["draw", DRAW, DRAW_CSS],
    ["trace", TRACE, TRACE_CSS],
  ])("registers the %s ease and its CSS twin on the same curve", (_, name, css) => {
    // gsap's CustomEase takes the bezier's four numbers, not the CSS function around them.
    const twin = gsap.parseEase(css.replace(/^cubic-bezier\(|\)$/g, ""));
    for (const t of SAMPLES) {
      expect(gsap.parseEase(name)(t)).toBeCloseTo(twin(t), 2);
    }
  });

  it("reuses motion's settle and draw curves under the kit names", () => {
    for (const { kit, motion } of [
      { kit: SETTLE, motion: ease.settle },
      { kit: DRAW, motion: ease.draw },
    ]) {
      for (const progress of [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1]) {
        expect(gsap.parseEase(kit)(progress)).toBe(gsap.parseEase(motion)(progress));
      }
    }
  });

  it("maps the unit interval onto itself", () => {
    for (const name of [SETTLE, DRAW, TRACE]) {
      const ease = gsap.parseEase(name);
      expect(ease(0)).toBeCloseTo(0, 3);
      expect(ease(1)).toBeCloseTo(1, 3);
    }
  });

  it("spreads a stagger on an ease-in-out curve, not even steps", () => {
    const offsets = Array.from({ length: 11 }, (_, i) => easedStagger(i, 11, 1));
    expect(offsets[0]).toBe(0);
    expect(offsets[10]).toBeCloseTo(1, 5);
    expect(offsets[5]).toBeCloseTo(0.5, 5);
    const gaps = offsets.slice(1).map((o, i) => o - (offsets[i] ?? 0));
    expect(gaps[0]).toBeLessThan(gaps[4] ?? 0);
    expect(gaps[9]).toBeLessThan(gaps[5] ?? 0);
    expect(easedStagger(0, 1, 1)).toBe(0);
    expect(easedStagger(3, 5, 0)).toBe(0);
  });
});
