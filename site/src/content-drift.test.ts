// @vitest-environment node
// Check registered recordings and theme override against the repository.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadDeck } from "@steamfield/decks/node";
import { describe, expect, it } from "vitest";
import { resolveTheme } from "../../packages/kit/src/theme/theme-resolve.ts";
import { site } from "./config";
import { demoPlayer } from "./data/demo-examples";
import {
  deckDir,
  ENTRIES,
  EXAMPLE_NAMES,
  loadExample,
  loadRecording,
  recordingPath,
  startBeatOf,
  startSlideOf,
} from "./data/examples";
import { demoName, guideDemos, guideReels, resolveDemo } from "./data/guide-demos";
import { loadMotionShowcase } from "./data/motion-showcase";

const repo = join(process.cwd(), "..");
const read = (path: string) => readFileSync(join(repo, path), "utf8");
describe("example decks", () => {
  it.each(EXAMPLE_NAMES)("%s is an example deck with a recording from make demo", async (name) => {
    expect(existsSync(join(deckDir(name), "deck.config.ts"))).toBe(true);
    expect(existsSync(recordingPath(name)), `${recordingPath(name)}: run make demo`).toBe(true);
    const recording = loadRecording(name);
    expect(recording?.title).toBe((await loadDeck(deckDir(name))).config.title);
    expect(recording?.slideTitles).toHaveLength(recording?.slides ?? -1);
    expect(recording?.startSlide).toBeGreaterThanOrEqual(1);
    expect(recording?.startSlide).toBeLessThanOrEqual(recording?.slides ?? 0);
    // The poster was shot at the recorded start step: re-run make demo after changing startBeat.
    expect(recording?.startBeat).toBe(startBeatOf(name));
    const startSlide = startSlideOf(name);
    if (startSlide !== undefined) expect(recording?.startSlide).toBe(startSlide);
    expect(
      recording?.states.some(
        (s) => s.slide === recording.startSlide && s.beat === recording.startBeat,
      ),
    ).toBe(true);
    expect(recording?.states.length).toBeGreaterThanOrEqual(recording?.slides ?? 1);
  });

  it.each(EXAMPLE_NAMES)("%s has a poster in both formats and sizes", (name) => {
    for (const file of [
      `${name}-640.avif`,
      `${name}-1280.avif`,
      `${name}-640.webp`,
      `${name}-1280.webp`,
    ]) {
      expect(existsSync(join(process.cwd(), "public/posters", file)), file).toBe(true);
    }
  });

  it.each(ENTRIES)("$name says how it was made", (entry) => {
    const { provenance } = loadExample(entry);
    expect(provenance.label.length).toBeGreaterThan(0);
    if (entry.provenance === "talk") {
      expect(provenance.label).toBe(
        entry.attribution?.label ?? "From the talks Decks was extracted from",
      );
    }
  });
});

describe("the WARM still's theme.json", () => {
  const warm = JSON.parse(readFileSync(join(process.cwd(), "demo/warm-theme.json"), "utf8"));

  it("is a valid override with surfaces and two ramps", () => {
    expect(Object.keys(warm).sort()).toEqual(["ramps", "surfaces"]);
    expect(Object.keys(warm.ramps)).toHaveLength(2);
    expect(() =>
      resolveTheme(JSON.parse(read("packages/kit/src/theme/theme-default.json")), warm),
    ).not.toThrow();
  });

  it("overrides the surfaces and chart ramps while retaining the other theme defaults", () => {
    const defaults = JSON.parse(read("packages/kit/src/theme/theme-default.json"));
    const resolved = resolveTheme(defaults, warm);
    expect(resolved.surfaces).toEqual(warm.surfaces);
    expect(resolved.ramps).toMatchObject(warm.ramps);
    expect(resolved.surfaces.canvas).not.toBe(resolveTheme(defaults).surfaces.canvas);
    expect(resolved.fonts).toEqual(resolveTheme(defaults).fonts);
  });
});

it("counts the motion section's slides, source lines and available motion templates from the repository", () => {
  const name = site.motionShowcase.example;
  const show = loadMotionShowcase(name);
  const dir = deckDir(name);
  const lineCount = (file: string) =>
    readFileSync(file, "utf8").match(/[^\n]*\n|[^\n]+$/g)?.length ?? 0;
  expect(show.slides).toHaveLength(loadRecording(name)?.slides ?? -1);
  expect(show.slides[1]?.components).toContainEqual(
    expect.objectContaining({ names: "LogoSting", file: "LogoSting.tsx" }),
  );
  const fileLines = show.slides.map((slide) => {
    for (const component of slide.components) {
      expect(component.lines).toBe(lineCount(join(dir, "components", component.file)));
    }
    expect(slide.source).toBe(readFileSync(join(dir, slide.file), "utf8").replace(/\r?\n$/, ""));
    const count = lineCount(join(dir, slide.file));
    expect(slide.lines).toBe(count);
    return count;
  });
  expect(show.longest).toBe(Math.max(...fileLines));
  const props = read("packages/kit/src/motion-templates/motion-template-props.ts");
  expect(show.templates).toBe([...props.matchAll(/readonly template: "/g)].length);
});

describe("live demos in the package guide", () => {
  const lines = (text: string) =>
    text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.trim() !== "");
  // The fence is the slides' code in order; it may leave out frontmatter and imports.
  const contains = (slides: string[], fence: string) => {
    const source = lines(slides.join("\n"));
    let at = 0;
    return lines(fence).every((line) => {
      while (at < source.length && source[at] !== line) at += 1;
      return at++ < source.length;
    });
  };

  it("has demos", () => {
    expect(guideDemos().length).toBeGreaterThan(0);
  });

  it.each(guideDemos().map((demo) => ({ ...demo, name: `${demo.page} ${demoName(demo)}` })))(
    "$name plays slides that contain its code, from a recorded replay and a poster",
    (demo) => {
      const { slides } = resolveDemo(demo);
      expect(
        contains(
          slides.map((slide) => slide.source),
          demo.code,
        ),
      ).toBe(true);
      const player = demoPlayer(demo);
      const { example } = player;
      const steps = example.states.filter(
        (state) => state.slide >= player.range.first && state.slide <= player.range.last,
      );
      // A replay starts at the range's first step; it has to have somewhere to go.
      expect(steps.length).toBeGreaterThan(1);
      for (const ext of ["avif", "webp"])
        for (const width of [640, 1280, 1920])
          expect(
            existsSync(join(process.cwd(), `public${example.poster?.base}-${width}.${ext}`)),
          ).toBe(true);
    },
  );

  it.each(guideReels())("$page reel $deck is a registered deck with its gallery poster", (reel) => {
    const { example } = demoPlayer(reel);
    expect(example.states.length).toBeGreaterThan(1);
    for (const ext of ["avif", "webp"])
      expect(existsSync(join(process.cwd(), `public${example.poster?.base}-1280.${ext}`))).toBe(
        true,
      );
  });
});

it("keeps the live-terminal demo's hand-typed recording equal to what `decks new --story` writes", () => {
  const template = join(repo, "packages/node/templates/story");
  const files = (dir: string): string[] =>
    readdirSync(join(template, dir), { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)],
    );
  const written = files("").sort();
  const source = read("examples/guide-demos/components/term-demo.tsx");
  const wrote = [...source.matchAll(/["']Wrote decks\/talk\/([^"']+)["']/g)].map((m) => m[1]);
  expect(wrote).toEqual(written);
  const listed = source.match(/output: \[((?:"[\w-]+\.mdx",?\s*)+)\]/)?.[1];
  const slides = [...(listed ?? "").matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  expect(slides).toEqual(
    files("slides")
      .map((file) => file.replace(/^slides\//, ""))
      .sort(),
  );
});
