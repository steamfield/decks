import { expect, it } from "vitest";
import { clamp01, STAGE, stagger, xScale, yScale } from "./index";

it("maps stage domains in both directions with d3 scale semantics", () => {
  const x = xScale([1997, 2025], [200, 1720]);
  expect(x(1997)).toBe(200);
  expect(x(2025)).toBe(1720);
  expect(x.invert(960)).toBe(2011);
  expect(x(2011)).toBe(960);
  expect(x.ticks(2)).toEqual([2000, 2010, 2020]);
  const y = yScale([0, 600], [960, 120]);
  expect(y(0)).toBe(960);
  expect(y(600)).toBe(120);
  expect(y(300)).toBe(540);
  expect(y(900)).toBe(-300);
  expect(STAGE).toEqual({ width: 1920, height: 1080 });
});
it("clamps progress at the boundaries", () => {
  expect([-1, 0, 0.5, 1, 2].map(clamp01)).toEqual([0, 0, 0.5, 1, 1]);
});

it("staggers items across one beat so the last still lands at 1", () => {
  expect(stagger(0, 0, 3, 0.2)).toBe(0);
  expect(stagger(0.3, 0, 3, 0.2)).toBe(0.5);
  expect(stagger(0.3, 1, 3, 0.2)).toBeCloseTo(1 / 6);
  expect(stagger(0.3, 2, 3, 0.2)).toBe(0);
  expect(stagger(1, 2, 3, 0.2)).toBe(1);
});
