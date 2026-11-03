// Build-time loader for the example decks. The registry (examples.json) says
// which decks the page shows and how each was made; everything else comes from
// files generated from the decks themselves:
//   fixtures/examples/<name>.json        `make demo`: title, slide titles, every step's caption
//   fixtures/examples/<name>.loop.json   `make demo`: the step the hero loop shows at each time
//   fixtures/examples/<name>.edits.json  scripts/edits.mjs: the edit after the agent's draft
//   fixtures/<run>.json                  scripts/excerpt-run.mjs: the recorded agent run
//   public/posters/, public/loops/       `make demo`: images and video
// Swapping the hero is adding an entry at the top of examples.json plus its fixtures.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  type Editor,
  type Edits,
  type Example,
  type ExampleState,
  editedBy,
  editSize,
  type Loop,
  type LoopMark,
  type Provenance,
  type ProvenanceKind,
  type RunSummary,
} from "../lib/player/example";
import { loadRun, runFigures } from "./fixtures";

export type ExampleEntry = {
  name: string;
  startSlide?: number;
  startBeat?: number;
  provenance: ProvenanceKind;
  run?: { fixture: string; setup: "repo" | "init" };
  edits?: { from: string; to: string; by: Editor };
  loop?: boolean;
};

// Read rather than imported, so Node scripts and Playwright load this module as Vite does.
const registry = JSON.parse(
  readFileSync(join(process.cwd(), "src/data/examples.json"), "utf8"),
) as { examples: ExampleEntry[] };

export const ENTRIES = registry.examples;
export const EXAMPLE_NAMES = ENTRIES.map((entry) => entry.name);

/** What `make demo` writes per deck. */
export type Recording = {
  title: string;
  slides: number;
  slideTitles: string[];
  startSlide: number;
  startBeat: number;
  states: ExampleState[];
};

// Builds and tests run from site/.
const site = process.cwd();
const repo = join(site, "..");
const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));

export const deckDir = (name: string) => join(repo, "examples", name);
export const recordingPath = (name: string) => join(site, "fixtures/examples", `${name}.json`);
export const loopPath = (name: string) => join(site, "fixtures/examples", `${name}.loop.json`);
export const editsPath = (name: string) => join(site, "fixtures/examples", `${name}.edits.json`);

export const entryFor = (name: string) => ENTRIES.find((entry) => entry.name === name);

/** The 1-based slide the poster, the loop and the live deck start on; the first story slide when unset. */
export const startSlideOf = (name: string) => entryFor(name)?.startSlide;

/** The 0-based step on the start slide the poster, the loop and the live deck start on. */
export const startBeatOf = (name: string) => entryFor(name)?.startBeat ?? 0;

/** The deck's headmatter title, used until `make demo` has recorded the deck. */
function headmatterTitle(name: string): string {
  const slides = readFileSync(join(deckDir(name), "slides.md"), "utf8");
  return /^title:\s*["']?(.+?)["']?\s*$/m.exec(slides)?.[1] ?? name;
}

/** How the deck was made; an agent deck's label ends with the edit's size from git. */
export function provenanceOf(entry: ExampleEntry, edits: Edits | null = null): Provenance {
  const where =
    entry.run?.setup === "init"
      ? "in a fresh project with decks init"
      : "with this repository's agent setup";
  const size = edits ? ` (${editSize(edits)})` : "";
  const labels: Record<ProvenanceKind, string> = {
    agent: `Drafted by Claude Code ${where}, then ${editedBy(entry.edits?.by ?? "hand")}${size}`,
    talk: "From the talks Decks was extracted from",
    template: "Template deck",
    hand: "Built by hand",
  };
  return { kind: entry.provenance, label: labels[entry.provenance] };
}

export function loadRecording(name: string): Recording | null {
  const path = recordingPath(name);
  return existsSync(path) ? (readJson(path) as Recording) : null;
}

function loadLoop(name: string): Loop | null {
  const files = ["webm", "mp4"].map((ext) => join(site, "public/loops", `${name}.${ext}`));
  if (!existsSync(loopPath(name)) || !files.every((file) => existsSync(file))) return null;
  const { width, height, marks } = readJson(loopPath(name)) as {
    width: number;
    height: number;
    marks: LoopMark[];
  };
  return { base: `/loops/${name}`, width, height, marks };
}

function loadRunSummary(entry: ExampleEntry): RunSummary | null {
  if (!entry.run) return null;
  const run = loadRun(entry.run.fixture);
  return { prompt: run.prompt, setup: entry.run.setup, ...runFigures(run) };
}

/** The edits fixture as scripts/edits.mjs wrote it (without `by`, which the registry holds). */
export function loadEdits(name: string): Omit<Edits, "by"> | null {
  const path = editsPath(name);
  return existsSync(path) ? (readJson(path) as Omit<Edits, "by">) : null;
}

export function loadExample(entry: ExampleEntry): Example {
  const { name } = entry;
  const recording = loadRecording(name);
  const hasPoster = existsSync(join(site, "public/posters", `${name}-1280.avif`));
  const fixture = entry.edits ? loadEdits(name) : null;
  const edits = fixture && entry.edits ? { ...fixture, by: entry.edits.by } : null;
  return {
    name,
    title: recording?.title || headmatterTitle(name),
    href: `/demo/${name}/`,
    slides: recording?.slides ?? 0,
    slideTitles: recording?.slideTitles ?? [],
    startSlide: recording?.startSlide ?? 1,
    startBeat: recording?.startBeat ?? 0,
    states: recording?.states ?? [],
    provenance: provenanceOf(entry, edits),
    poster: hasPoster ? { base: `/posters/${name}`, width: 1280, height: 720 } : null,
    loop: entry.loop ? loadLoop(name) : null,
    run: loadRunSummary(entry),
    edits,
  };
}

/** Every example in gallery order; the first is the hero. */
export const loadExamples = (): Example[] => ENTRIES.map(loadExample);
