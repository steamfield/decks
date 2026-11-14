import { describe, expect, it } from "vitest";
import { fitCanvas } from "./canvas";

describe("fitCanvas", () => {
  it.each([
    { container: [1920, 1080], scale: 1, width: 1920, height: 1080 },
    { container: [960, 540], scale: 0.5, width: 1920, height: 1080 },
    { container: [1600, 1200], scale: 1600 / 1920, width: 1920, height: 1440 },
    { container: [2560, 1080], scale: 1, width: 2560, height: 1080 },
    { container: [0, 0], scale: 1, width: 1920, height: 1080 },
  ])("fits container $container to the documented frame", ({ container, scale, width, height }) => {
    const result = fitCanvas(container[0] ?? 0, container[1] ?? 0, 1920, 1080);
    expect(result.scale).toBeCloseTo(scale, 10);
    expect(result.width).toBeCloseTo(width, 10);
    expect(result.height).toBeCloseTo(height, 10);
  });

  it("keeps the design area inside a frame that fills every container in a size sweep", () => {
    for (const containerWidth of [0.5, 1, 320, 960, 1600, 1920, 2560, 10000]) {
      for (const containerHeight of [0.5, 1, 240, 540, 1080, 1200, 2160, 10000]) {
        const { scale, width, height } = fitCanvas(containerWidth, containerHeight, 1920, 1080);
        expect(width).toBeGreaterThanOrEqual(1920 - 1e-9);
        expect(height).toBeGreaterThanOrEqual(1080 - 1e-9);
        expect(Math.min(Math.abs(width - 1920), Math.abs(height - 1080))).toBeLessThan(1e-9);
        expect(width * scale).toBeCloseTo(containerWidth, 9);
        expect(height * scale).toBeCloseTo(containerHeight, 9);
      }
    }
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "uses the unscaled design when either container dimension is %s",
    (value) => {
      const fallback = { scale: 1, width: 1920, height: 1080 };
      expect(fitCanvas(value, 1080, 1920, 1080)).toEqual(fallback);
      expect(fitCanvas(1920, value, 1920, 1080)).toEqual(fallback);
    },
  );

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "rejects a design dimension of %s even when the container is invalid",
    (value) => {
      expect(() => fitCanvas(1920, 1080, value, 1080)).toThrow(
        `width must be positive and finite: ${value}`,
      );
      expect(() => fitCanvas(1920, 1080, 1920, value)).toThrow(
        `height must be positive and finite: ${value}`,
      );
      expect(() => fitCanvas(0, 0, value, 1080)).toThrow(
        `width must be positive and finite: ${value}`,
      );
      expect(() => fitCanvas(0, 0, 1920, value)).toThrow(
        `height must be positive and finite: ${value}`,
      );
    },
  );

  it("accepts positive fractional design sizes", () => {
    expect(fitCanvas(3, 2, 1.5, 0.5)).toEqual({ scale: 2, width: 1.5, height: 1 });
  });
});
