import { expect, it } from "vitest";
import { CANVAS, ink, installTheme, resolveTheme } from "../index";
import { HUE_NAMES } from "./theme-resolve";

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => {
    const c = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const [r = 0, g = 0, b = 0] = channels;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

it("has a four step ramp for every hue", () => {
  const value = resolveTheme();
  expect(HUE_NAMES).toHaveLength(6);
  for (const hue of HUE_NAMES) {
    expect(value.ramps[hue]).toHaveLength(4);
    for (const color of value.ramps[hue]) expect(color).toMatch(/^#[0-9a-f]{6}$/);
  }
});

it("clears 3:1 against the canvas at ink step 1", () => {
  installTheme(resolveTheme());
  for (const hue of HUE_NAMES) {
    expect((luminance(ink(hue, 1)) + 0.05) / (luminance(CANVAS) + 0.05)).toBeGreaterThanOrEqual(3);
  }
});

it("gets lighter with every step", () => {
  for (const ramp of Object.values(resolveTheme().ramps)) {
    let previous = -1;
    for (const color of ramp) {
      const next = luminance(color);
      expect(next).toBeGreaterThan(previous);
      previous = next;
    }
  }
});
