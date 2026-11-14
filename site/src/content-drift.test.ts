// @vitest-environment node
// The landing page and docs quote Decks: commands, figures from a recorded run,
// the prose-lint hook's answer, the edits after each agent draft and each example
// deck's own title and recording.
// These checks read the repository around the site, so a renamed command, a
// changed hook or a stale recording fails here instead of shipping.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveTheme } from "../../packages/kit/src/theme-resolve.ts";
import { computeEdits } from "../scripts/edits.mjs";
import { runHook } from "../scripts/hook.mjs";
import {
  deckDir,
  ENTRIES,
  EXAMPLE_NAMES,
  editsPath,
  loadEdits,
  loadExample,
  loadRecording,
  recordingPath,
  startBeatOf,
  startSlideOf,
} from "./data/examples";
import { loadHookDenial, loadRun, runFigures } from "./data/fixtures";
import { subcommands } from "./lib/cli-content.test-support";
import { draftLine, editSize } from "./lib/player/example";

const repo = join(process.cwd(), "..");
const read = (path: string) => readFileSync(join(repo, path), "utf8");
const pkg = JSON.parse(read("packages/decks/package.json"));
const deckInvocation = /^(bunx|npx|pnpm exec)( -p \S+)? (\S+)\s*(.*)$/;
const pinned = " -p slidev-addon-decks";

const hero = ENTRIES.find((entry) => entry.name === "keeling");

describe("the retained Keeling example's recorded agent run", () => {
  if (!hero?.run) throw new Error("the hero example in examples.json names no run fixture");
  const setup = hero.run.setup;
  const run = loadRun(hero.run.fixture);
  const bash = run.steps.flatMap((step) => step.calls).filter((call) => call.startsWith("Bash("));

  it("is a successful run that ends with a build", () => {
    expect(run.steps.length).toBeGreaterThan(5);
    expect(run.steps.at(-1)?.output).toMatch(/built in/);
  });

  it("gives the title bar, the draft line and the cost line their figures", () => {
    const example = loadExample(hero);
    expect(example.run).toEqual({ prompt: run.prompt, setup, ...runFigures(run) });
    if (!example.run) throw new Error("the hero example loaded without its run");
    // Written out from fixtures/keeling-1.json (durationMs 1009889, costUsd 2.6054928):
    // a new hero run changes these on purpose.
    expect(runFigures(run)).toEqual({ turns: 47, minutes: "16.8", cost: "$2.61" });
    expect(draftLine(example.run, example.edits)).toContain(
      "Drafted in 17 minutes from this prompt in a fresh project set up with decks init",
    );
  });

  // A run in a decks init project calls the package's CLI; the placeholder hero
  // (tides) was drafted inside this repository, where the same subcommands run
  // through the root package.json scripts. Either way every command must exist.
  if (setup === "init") {
    it("calls nothing that only exists in this repository", () => {
      expect(bash.filter((call) => /\bbun run\b|\bexamples\/|beats\.test/.test(call))).toEqual([]);
    });

    it.each(bash.map((call) => call.slice(5, -1)).filter((line) => / decks /.test(line)))(
      "the transcript's %s is the pinned package command",
      (line) => {
        const [, , pin, bin = "", rest = ""] = deckInvocation.exec(line) ?? [];
        expect(pin).toBe(pinned);
        expect(Object.keys(pkg.bin)).toContain(bin);
        expect(subcommands).toContain(rest.split(/\s+/)[0]);
      },
    );

    it("is labelled as a decks init run, with who edited it and how much", () => {
      const { label } = loadExample(hero).provenance;
      expect(label).toContain("in a fresh project with decks init");
      if (hero.edits?.by === "claude") expect(label).toContain("in a second Claude Code session");
      const edits = hero.edits && computeEdits(hero.name, hero.edits);
      if (edits) expect(label).toContain(`(${editSize(edits)})`);
    });
  } else {
    const scripts = (JSON.parse(read("package.json")) as { scripts: Record<string, string> })
      .scripts;
    it.each(bash.map((call) => /^Bash\(bun run ([\w:-]+)/.exec(call)?.[1]).filter(Boolean))(
      "the transcript's bun run %s is a repository script",
      (name) => {
        const script = scripts[name as string] ?? "";
        expect(script, `package.json scripts.${name}`).not.toBe("");
        const sub = /deck\.mjs (\S+)/.exec(script)?.[1];
        if (sub) expect(subcommands).toContain(sub);
      },
    );

    it("is labelled as a run in this repository, not a decks init project", () => {
      expect(loadExample(hero).provenance.label).toContain("this repository's agent setup");
    });
  }
});

describe("the edits after each agent draft", () => {
  const edited = ENTRIES.filter((entry) => entry.edits);

  it("covers the retained agent example", () => {
    expect(edited.map((entry) => entry.name)).toContain(hero?.name);
  });

  it.each(edited)("$name has the edit's diff and caption pairs as git computes them", (entry) => {
    if (!entry.edits) throw new Error(`${entry.name} has no edits`);
    expect(existsSync(editsPath(entry.name)), "run node scripts/edits.mjs").toBe(true);
    expect(loadEdits(entry.name)).toEqual(computeEdits(entry.name, entry.edits));
    const edits = loadExample(entry).edits;
    if (!edits) throw new Error(`${entry.name} loaded without its edits`);
    expect(loadExample(entry).provenance.label).toContain(`(${editSize(edits)})`);
  });
});

describe("the prose-lint hook", () => {
  it("still denies the planted line with the recorded rules and reason", () => {
    expect(runHook()).toEqual(loadHookDenial());
    expect(loadHookDenial().rules).toEqual(["banned-phrase", "ai-vocab"]);
  });
});

describe("example decks", () => {
  it.each(EXAMPLE_NAMES)("%s is an example deck with a recording from make demo", (name) => {
    expect(existsSync(join(deckDir(name), "slides.md"))).toBe(true);
    expect(existsSync(recordingPath(name)), `${recordingPath(name)}: run make demo`).toBe(true);
    const recording = loadRecording(name);
    const headmatter = /^title:\s*["']?(.+?)["']?\s*$/m.exec(read(`examples/${name}/slides.md`));
    expect(recording?.title).toBe(headmatter?.[1]);
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

  it("features the OpenData and Austin schools excerpts before the retained examples", () => {
    expect(ENTRIES.slice(0, 2).map((entry) => entry.name)).toEqual([
      "opendata-showcase",
      "aisd-showcase",
    ]);
    expect(ENTRIES.slice(0, 2).every((entry) => entry.featured && entry.attribution)).toBe(true);
    expect(ENTRIES.map((entry) => entry.name)).toEqual(
      expect.arrayContaining([
        "keeling",
        "tides",
        "opendata-pitch",
        "agent-experience",
        "od-story-templates",
        "od-templates",
      ]),
    );
  });
});

describe("the WARM still's theme.json", () => {
  const warm = JSON.parse(readFileSync(join(process.cwd(), "demo/warm-theme.json"), "utf8"));

  it("is a valid override with surfaces and two ramps", () => {
    expect(Object.keys(warm).sort()).toEqual(["ramps", "surfaces"]);
    expect(Object.keys(warm.ramps)).toHaveLength(2);
    expect(() =>
      resolveTheme(JSON.parse(read("packages/kit/src/theme-default.json")), warm),
    ).not.toThrow();
  });

  it("takes its values from the od-templates palette", () => {
    const templates = JSON.parse(read("examples/od-templates/theme.json"));
    expect(warm.surfaces).toEqual(templates.surfaces);
    for (const [hue, ramp] of Object.entries(warm.ramps))
      expect(ramp).toEqual(templates.ramps[hue]);
  });
});
