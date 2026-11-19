import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { duration, ease, gsap, stagger } from "../packages/motion/src/tokens";

describe("motion tokens", () => {
  it("agrees with the CSS durations, stagger and four CustomEase curves", () => {
    const css = readFileSync(new URL("../packages/motion/src/motion.css", import.meta.url), "utf8");
    const root = css.slice(css.indexOf(":root"), css.indexOf("html[data-deck-motion"));
    for (const [name, seconds] of Object.entries(duration)) {
      expect(root).toMatch(new RegExp(`--deck-dur-${name}: ${seconds * 1000}ms`));
    }
    expect(root).toContain(`--deck-stagger: ${stagger * 1000}ms`);
    // The role curves (snap, punch, leave, slam) are JavaScript-only: three are multi-segment
    // curves CSS cannot express. packages/motion/src/tokens.test.ts checks them.
    for (const name of ["enter", "exit", "settle", "draw"] as const) {
      const registered = ease[name];
      const curve = root.match(new RegExp(`--deck-ease-${name}: cubic-bezier\\(([^)]+)\\)`))?.[1];
      if (!curve) throw new Error(`Missing CSS curve ${name}`);
      const expected = gsap.parseEase(curve);
      for (const t of [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1]) {
        expect(gsap.parseEase(registered)(t)).toBeCloseTo(expected(t), 6);
      }
    }
    const instant = css.slice(
      css.indexOf('html[data-deck-motion="instant"]'),
      css.indexOf("[data-step-state]"),
    );
    for (const name of ["dur-quick", "dur-base", "dur-slow", "stagger"])
      expect(instant).toContain(`--deck-${name}: 0ms`);
    expect(gsap.defaults().ease).toBe(gsap.parseEase(ease.settle));
  });
});
