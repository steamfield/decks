// Build-time loader for the cassette rack. Each tape is one example deck in the
// parent repository. Its colors come from the deck's theme.json merged over
// packages/decks/theme/default.json with the package's own resolver; its title,
// slide titles and beat text come from fixtures/tapes/<name>.json, which
// `make demo` records by driving the built deck through the embed contract.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveTheme } from "../../../packages/decks/theme/resolve.ts";
import type { Tape, TapeState, TapeTheme } from "../lib/player/tape";

/** Rack order. tides is loaded by default. */
export const TAPE_NAMES = [
  "tides",
  "opendata-pitch",
  "agent-experience",
  "od-story-templates",
  "od-templates",
] as const;

export type TapeName = (typeof TAPE_NAMES)[number];

/** What `make demo` writes per deck. */
export type TapeRecording = {
  title: string;
  slides: number;
  slideTitles: string[];
  startSlide: number;
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

export function tapeTheme(name: string): TapeTheme {
  const defaults = readJson(join(repo, "packages/decks/theme/default.json"));
  const overridePath = join(deckDir(name), "theme.json");
  const theme = resolveTheme(
    defaults,
    existsSync(overridePath) ? readJson(overridePath) : undefined,
  );
  return {
    shell: theme.surfaces["surface-raised"],
    ink: theme.surfaces.canvas,
    paper: theme.text.primary,
    stripes: [theme.ramps.cyan[1], theme.ramps.amber[1], theme.ramps.rose[1]],
    brand: theme.brand.name,
  };
}

export function loadRecording(name: string): TapeRecording | null {
  const path = recordingPath(name);
  return existsSync(path) ? (readJson(path) as TapeRecording) : null;
}

export function loadTape(name: string): Tape {
  const recording = loadRecording(name);
  const hasPoster = existsSync(join(site, "public/posters", `${name}-1280.avif`));
  return {
    name,
    title: recording?.title || headmatterTitle(name),
    href: `/demo/${name}/`,
    slides: recording?.slides ?? 0,
    slideTitles: recording?.slideTitles ?? [],
    startSlide: recording?.startSlide ?? 1,
    states: recording?.states ?? [],
    theme: tapeTheme(name),
    poster: hasPoster ? { base: `/posters/${name}`, width: 1280, height: 720 } : null,
  };
}

export const loadTapes = (): Tape[] => TAPE_NAMES.map(loadTape);
