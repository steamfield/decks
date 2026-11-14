import { describe, expect, it } from "vitest";
import { assertManifest, type DeckManifest } from "./manifest";

function manifest(): DeckManifest {
  return {
    name: "tides",
    title: "Tides",
    canvas: { width: 1920, height: 1080 },
    slides: [
      { no: 1, id: "intro", file: "slides/intro.mdx", title: "Intro", clicks: 0 },
      { no: 2, id: "outcome", file: "slides/outcome.mdx", title: "Outcome", clicks: 3 },
    ],
  };
}

describe("assertManifest", () => {
  it("returns the same manifest when it is valid", () => {
    const input = manifest();
    expect(assertManifest(input)).toBe(input);
  });

  it("rejects a manifest with zero slides", () => {
    expect(() => assertManifest({ ...manifest(), slides: [] })).toThrow(/0 slides/);
  });

  it.each([0, -1, 1.5, 2, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects a slide number of %s instead of its 1-based position",
    (no) => {
      const input = manifest();
      expect(() =>
        assertManifest({ ...input, slides: input.slides.map((slide) => ({ ...slide, no })) }),
      ).toThrow(`Slide no ${no}`);
    },
  );

  it("rejects slide numbers that contain a gap or are out of order", () => {
    const input = manifest();
    for (const numbers of [
      [1, 3],
      [2, 1],
    ]) {
      expect(() =>
        assertManifest({
          ...input,
          slides: input.slides.map((slide, index) => ({ ...slide, no: numbers[index] ?? 0 })),
        }),
      ).toThrow(/Slide no/);
    }
  });

  it("rejects duplicate slide ids", () => {
    const input = manifest();
    expect(() =>
      assertManifest({
        ...input,
        slides: input.slides.map((slide) => ({ ...slide, id: "duplicate" })),
      }),
    ).toThrow("Duplicate slide id: duplicate");
  });

  it.each([-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "rejects a click count of %s",
    (clicks) => {
      const input = manifest();
      expect(() =>
        assertManifest({ ...input, slides: input.slides.map((slide) => ({ ...slide, clicks })) }),
      ).toThrow(`invalid clicks: ${clicks}`);
    },
  );

  it.each(["width", "height"] as const)("rejects a non-positive or non-finite canvas %s", (key) => {
    for (const value of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect(() =>
        assertManifest({ ...manifest(), canvas: { width: 1920, height: 1080, [key]: value } }),
      ).toThrow(`Canvas ${key} must be positive and finite: ${value}`);
    }
  });

  it("accepts fractional canvas dimensions and empty descriptive strings", () => {
    const input: DeckManifest = {
      name: "",
      title: "",
      canvas: { width: 1.5, height: 0.5 },
      slides: [{ no: 1, id: "", title: "", file: "", clicks: 0 }],
    };
    expect(assertManifest(input)).toBe(input);
  });
});
