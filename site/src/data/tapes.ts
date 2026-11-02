// Build-time loader for the cassette rack. Each tape is one example deck in the
// parent repository. Its colors come from the deck's theme.json merged over
// packages/decks/theme/default.json with the package's own resolver; its title,
// slide titles and beat text come from fixtures/tapes/<name>.json, which
// `make demo` records by driving the built deck through the embed contract.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveTheme } from "../../../packages/decks/theme/resolve.ts";
import type { Shell, Tape, TapeState, TapeTheme } from "../lib/player/tape";

/** Rack order. tides is loaded by default. */
export const TAPE_NAMES = [
  "tides",
  "opendata-pitch",
  "agent-experience",
  "od-story-templates",
  "od-templates",
] as const;

export type TapeName = (typeof TAPE_NAMES)[number];

/**
 * Where the poster is taken and PLAY starts, as a step on the start slide
 * (0-based; 0 when a deck is not listed). These stages draw their line on the
 * way from step 1 to step 2, so step 1 is an empty axis; the player and the
 * poster start on step 2, where the chart is drawn. `make demo` records the
 * value into the fixture and shoots the poster there.
 */
export const START_BEATS: Partial<Record<TapeName, number>> = {
  tides: 1,
  "od-story-templates": 1,
  "od-templates": 1,
};

type Hue = "cyan" | "amber" | "rose" | "emerald" | "violet" | "slate";
/**
 * Shell plastic per tape, like a 90s shelf: one clear, one smoke, three tinted.
 * A tint is step 2 of that ramp in the deck's own resolved theme.
 */
const SHELLS: Record<TapeName, { kind: "clear" | "smoke" } | { kind: "tint"; hue: Hue }> = {
  tides: { kind: "clear" },
  "opendata-pitch": { kind: "smoke" },
  "agent-experience": { kind: "tint", hue: "cyan" },
  "od-story-templates": { kind: "tint", hue: "violet" },
  "od-templates": { kind: "tint", hue: "amber" },
};

/** What `make demo` writes per deck. */
export type TapeRecording = {
  title: string;
  slides: number;
  slideTitles: string[];
  startSlide: number;
  startBeat: number;
  states: TapeState[];
};

// Builds and tests run from site/.
const site = process.cwd();
const repo = join(site, "..");
const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));

export const deckDir = (name: string) => join(repo, "examples", name);
export const recordingPath = (name: string) => join(site, "fixtures/tapes", `${name}.json`);

/** The deck's headmatter title, used until `make demo` has recorded the deck. */
function headmatterTitle(name: string): string {
  const slides = readFileSync(join(deckDir(name), "slides.md"), "utf8");
  return /^title:\s*["']?(.+?)["']?\s*$/m.exec(slides)?.[1] ?? name;
}

export function tapeTheme(name: TapeName): TapeTheme {
  const defaults = readJson(join(repo, "packages/decks/theme/default.json"));
  const overridePath = join(deckDir(name), "theme.json");
  const theme = resolveTheme(
    defaults,
    existsSync(overridePath) ? readJson(overridePath) : undefined,
  );
  return {
    ink: theme.surfaces.canvas,
    paper: theme.text.primary,
    stripes: [theme.ramps.cyan[1], theme.ramps.amber[1], theme.ramps.rose[1]],
    brand: theme.brand.name,
    shell: shellFor(SHELLS[name], theme.ramps),
  };
}

function shellFor(
  spec: (typeof SHELLS)[TapeName],
  ramps: Record<Hue, readonly [string, string, string, string]>,
): Shell {
  return spec.kind === "tint" ? { kind: "tint", color: ramps[spec.hue][1] } : spec;
}

export function loadRecording(name: string): TapeRecording | null {
  const path = recordingPath(name);
  return existsSync(path) ? (readJson(path) as TapeRecording) : null;
}

export function loadTape(name: TapeName): Tape {
  const recording = loadRecording(name);
  const hasPoster = existsSync(join(site, "public/posters", `${name}-1280.avif`));
  return {
    name,
    title: recording?.title || headmatterTitle(name),
    href: `/demo/${name}/`,
    slides: recording?.slides ?? 0,
    slideTitles: recording?.slideTitles ?? [],
    startSlide: recording?.startSlide ?? 1,
    startBeat: recording?.startBeat ?? 0,
    states: recording?.states ?? [],
    theme: tapeTheme(name),
    poster: hasPoster ? { base: `/posters/${name}`, width: 1280, height: 720 } : null,
  };
}

export const loadTapes = (): Tape[] => TAPE_NAMES.map(loadTape);
