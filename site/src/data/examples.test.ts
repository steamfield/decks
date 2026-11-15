// @vitest-environment node
import { join } from "node:path";
import sharp from "sharp";
import { expect, it } from "vitest";
import { loadExamples } from "./examples";

const examples = loadExamples();

it("gives the hero, the first example, a recorded loop", () => {
  expect(examples[0]?.loop).not.toBeNull();
});

it.each(examples)("$name provides every recorded step and a responsive poster", async (example) => {
  expect(example.title).not.toBe(example.name);
  expect(example.slideTitles).toHaveLength(example.slides);
  expect(example.states).toContainEqual(
    expect.objectContaining({ slide: example.startSlide, beat: example.startBeat }),
  );
  for (let slide = 1; slide <= example.slides; slide++) {
    const states = example.states.filter((state) => state.slide === slide);
    expect(states.length, `${example.name} slide ${slide}`).toBeGreaterThan(0);
    expect(states.map(({ beat }) => beat)).toEqual(
      Array.from({ length: (states[0]?.beats ?? 0) + 1 }, (_, beat) => beat),
    );
  }
  expect(example.poster?.base).toBe(`/posters/${example.name}`);
  for (const width of [640, 1280, 1920]) {
    for (const ext of ["avif", "webp"]) {
      const image = await sharp(
        join(process.cwd(), "public/posters", `${example.name}-${width}.${ext}`),
      ).metadata();
      expect([image.width, image.height]).toEqual([width, (width * 9) / 16]);
    }
  }
});

it("provides two AISD theme stills of the same size with different palettes", async () => {
  const normal = await sharp("public/stills/aisd-showcase-normal-640.webp")
    .raw()
    .toBuffer({ resolveWithObject: true });
  const warm = await sharp("public/stills/aisd-showcase-warm-640.webp")
    .raw()
    .toBuffer({ resolveWithObject: true });
  expect(normal.info).toEqual(warm.info);
  expect(normal.data.equals(warm.data)).toBe(false);
});
