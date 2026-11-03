// Build-time loader for the example decks. The registry (examples.json) says
// which decks the page shows and how each was made; everything else comes from
// files generated from the decks themselves:
//   fixtures/examples/<name>.json        `make demo`: title, slide titles, every step's caption
//   fixtures/examples/<name>.loop.json   `make demo`: the step the hero loop shows at each time
//   fixtures/examples/<name>.edits.json  scripts/edits.mjs: the hand edit after the agent's draft
//   fixtures/<run>.json                  scripts/excerpt-smoke.mjs: the recorded agent run
//   public/posters/, public/loops/       `make demo`: images and video
// Swapping the hero is adding an entry at the top of examples.json plus its fixtures.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type {
  Edits,
  Example,
  ExampleState,
  Loop,
  LoopMark,
  Provenance,
  ProvenanceKind,
  RunSummary,
} from "../lib/player/example";
import { loadRun, runFigures } from "./fixtures";

export type ExampleEntry = {
  name: string;
  startBeat?: number;
  provenance: ProvenanceKind;
  run?: { fixture: string; setup: "repo" | "init" };
  edits?: { from: string; to: string };
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

/** The 0-based step the poster, the loop and the live deck start on. */
export const startBeatOf = (name: string) => entryFor(name)?.startBeat ?? 0;

/** The deck's headmatter title, used until `make demo` has recorded the deck. */
function headmatterTitle(name: string): string {
  const slides = readFileSync(join(deckDir(name), "slides.md"), "utf8");
  return /^title:\s*["']?(.+?)["']?\s*$/m.exec(slides)?.[1] ?? name;
}

export function provenanceOf(entry: ExampleEntry): Provenance {
  const labels: Record<ProvenanceKind, string> = {
    agent:
      entry.run?.setup === "init"
        ? "Drafted by Claude Code in a fresh project with decks init, then edited by hand"
        : "Drafted by Claude Code with this repository's agent setup, then edited by hand",
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

export function loadEdits(name: string): Edits | null {
  const path = editsPath(name);
  return existsSync(path) ? (readJson(path) as Edits) : null;
}

export function loadExample(entry: ExampleEntry): Example {
  const { name } = entry;
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
    provenance: provenanceOf(entry),
    poster: hasPoster ? { base: `/posters/${name}`, width: 1280, height: 720 } : null,
    loop: entry.loop ? loadLoop(name) : null,
    run: loadRunSummary(entry),
    edits: entry.edits ? loadEdits(name) : null,
  };
}

/** Every example in gallery order; the first is the hero. */
export const loadExamples = (): Example[] => ENTRIES.map(loadExample);
