import { assert, describe, expect, it } from "vitest";
import type { Point } from "./brush";
import { BRUSH_DEFAULTS, brushRibbon } from "./index";

function horizontal(length: number): Point[] {
  return [
    { x: 0, y: 500 },
    { x: length, y: 500 },
  ];
}

/** Vertical extent of one dab. On a horizontal centreline that is its width. */
function thickness(d: string): number {
  const nums = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  const ys: number[] = [];
  for (let i = 1; i < nums.length; i += 2) ys.push(Number(nums[i]));
  return Math.max(...ys) - Math.min(...ys);
}

function vertexCount(d: string): number {
  return (d.match(/-?\d+(?:\.\d+)?/g) ?? []).length / 2;
}

describe("brushRibbon", () => {
  it("emits closed 16 point polygons", () => {
    const dabs = brushRibbon(horizontal(600), { seed: "salary" });
    expect(dabs.length).toBeGreaterThan(0);
    for (const dab of dabs) {
      expect(dab.d.startsWith("M")).toBe(true);
      expect(dab.d.endsWith("Z")).toBe(true);
      expect(vertexCount(dab.d)).toBe(16);
    }
  });

  it("is identical for the same input and seed", () => {
    const a = brushRibbon(horizontal(600), { seed: "salary" });
    const b = brushRibbon(horizontal(600), { seed: "salary" });
    expect(a).toEqual(b);
  });

  it("differs when the seed differs", () => {
    const a = brushRibbon(horizontal(600), { seed: "salary" });
    const b = brushRibbon(horizontal(600), { seed: "enrollment" });
    expect(a).not.toEqual(b);
  });

  it("tapers: both endpoints are narrower than the belly", () => {
    const dabs = brushRibbon(horizontal(1200), { seed: 7, wobble: 0, edge: 0 });
    const midDab = dabs[Math.floor(dabs.length / 2)];
    const first = dabs[0];
    const last = dabs.at(-1);
    assert(midDab && first && last);
    const mid = thickness(midDab.d);
    expect(thickness(first.d)).toBeLessThan(mid);
    expect(thickness(last.d)).toBeLessThan(mid);
    expect(mid).toBeCloseTo(BRUSH_DEFAULTS.width * BRUSH_DEFAULTS.belly, 0);
  });

  it("scales dab count with arc length", () => {
    const short = brushRibbon(horizontal(300), { seed: 1 });
    const long = brushRibbon(horizontal(1200), { seed: 1 });
    expect(long.length).toBeGreaterThan(short.length * 3);
  });

  it("keeps fill opacity inside the ink range", () => {
    for (const dab of brushRibbon(horizontal(1200), { seed: "drift" })) {
      expect(dab.fillOpacity).toBeGreaterThanOrEqual(0.22);
      expect(dab.fillOpacity).toBeLessThan(0.93);
    }
  });

  it("overpaints roughly a third of the dabs", () => {
    const dabs = brushRibbon(horizontal(1800), { seed: "drift" });
    const share = dabs.filter((d) => d.overpaint !== undefined).length / dabs.length;
    expect(share).toBeGreaterThan(0.15);
    expect(share).toBeLessThan(0.45);
    for (const dab of dabs) {
      if (dab.overpaint !== undefined) expect(dab.overpaint).toBeCloseTo(0.3, 5);
    }
  });

  it("returns nothing for a polyline with no length", () => {
    expect(brushRibbon([{ x: 10, y: 10 }], { seed: 1 })).toEqual([]);
  });
});
