// @vitest-environment node
// Check the hook fixture, registered recordings and theme override against the repository.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadDeck } from "@steamfield/decks/node";
import { describe, expect, it } from "vitest";
import { resolveTheme } from "../../packages/kit/src/theme/theme-resolve.ts";
import { runHook } from "../scripts/hook.mjs";
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
import { loadHookDenial } from "./data/fixtures";

const repo = join(process.cwd(), "..");
const read = (path: string) => readFileSync(join(repo, path), "utf8");
describe("the prose-lint hook", () => {
  it("still denies the planted line with the recorded rules and reason", () => {
    expect(runHook()).toEqual(loadHookDenial());
    expect(loadHookDenial().rules).toEqual(["banned-phrase", "ai-vocab"]);
  });
});

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

  it("shows the four React decks with Austin schools as the featured hero", () => {
    expect(EXAMPLE_NAMES).toEqual([
      "aisd-showcase",
      "texas-2026",
      "building-for-agents",
      "opendata-pitch",
    ]);
    expect(ENTRIES[0]?.featured?.label).toBe("Austin schools");
    expect(ENTRIES[0]?.attribution?.label).toContain("AISD");
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
