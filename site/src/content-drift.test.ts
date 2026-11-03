// @vitest-environment node
// The landing page and docs quote Decks: commands, figures from a recorded run,
// the prose-lint hook's answer and each example deck's own title and colors.
// These checks read the repository around the site, so a renamed command, a
// changed hook or a stale recording fails here instead of shipping.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveTheme } from "../../packages/decks/theme/resolve.ts";
import { computeEdits } from "../scripts/edits.mjs";
import { runHook } from "../scripts/hook.mjs";
import { site } from "./config";
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
import { loadProjectFiles } from "./data/project";
import { draftLine } from "./lib/player/example";

const repo = join(process.cwd(), "..");
const read = (path: string) => readFileSync(join(repo, path), "utf8");
const readme = read("README.md");
const runner = read("packages/decks/scripts/deck.mjs");
const pkg = JSON.parse(read("packages/decks/package.json")) as {
  name: string;
  version: string;
  bin: Record<string, string>;
};
const subcommands = new Set([...runner.matchAll(/case '([\w-]+)':/g)].map((match) => match[1]));
/** Every --flag deck.mjs reads or prints in a usage string. */
const runnerFlags = new Set(runner.match(/--[a-z][\w-]*/g));

/** "a && b" and multi-line commands become one entry per command. */
const splitCommands = (text: string) =>
  text
    .split(/\n|&&/)
    .map((line) => line.trim())
    .filter(Boolean);

const docsDir = join(process.cwd(), "src/content/docs");
/** Command lines in the docs that call the decks bin, from fenced bash blocks. */
const docsCommands = readdirSync(docsDir, { recursive: true, encoding: "utf8" })
  .filter((file) => file.endsWith(".md"))
  .flatMap((file) => {
    const text = readFileSync(join(docsDir, file), "utf8");
    return [...text.matchAll(/```bash[^\n]*\n([\s\S]*?)```/g)].flatMap((match) =>
      splitCommands(match[1] ?? "").map((line) => ({ file, line: line.replace(/\s+#.*$/, "") })),
    );
  });
/** `bunx -p slidev-addon-decks decks new ...`; the `-p` group is empty for the bare form. */
const deckInvocation = /^(bunx|npx|pnpm exec)( -p \S+)? (\S+)\s*(.*)$/;
/** The bare `decks` name on npm is an unrelated package: docs must pin the package with -p. */
const pinned = " -p slidev-addon-decks";

const shown = [
  ...site.quickstart.map((line) => ({ file: "config: hero", line })),
  ...site.install.flatMap((option) =>
    splitCommands(option.command).map((line) => ({ file: `config: ${option.label}`, line })),
  ),
  { file: "config: what you get", line: site.devCommand },
  ...docsCommands.filter(
    ({ line }) => deckInvocation.test(line) || /^(bun add|npm i|pnpm add) /.test(line),
  ),
];

describe("every shown command matches the CLI", () => {
  it("shows commands from the hero, every install tab and the CLI reference", () => {
    const files = new Set(shown.map((command) => command.file));
    for (const label of ["config: hero", "config: bun", "config: npm", "config: pnpm"]) {
      expect(files, label).toContain(label);
    }
    expect(files).toContain("reference/cli.md");
  });

  it.each(shown.filter(({ line }) => deckInvocation.test(line)))("$file: $line", ({ line }) => {
    const [, , , bin = "", rest = ""] = deckInvocation.exec(line) ?? [];
    expect(Object.keys(pkg.bin), "the package's bin").toContain(bin);
    const [subcommand] = rest.split(/\s+/);
    expect(subcommands, "a deck.mjs case").toContain(subcommand);
    for (const flag of rest.match(/--[a-z][\w-]*/g) ?? []) {
      expect(runnerFlags, `${flag} in deck.mjs`).toContain(flag);
    }
  });

  it.each(shown.filter(({ line }) => deckInvocation.test(line)))(
    "$file: $line pins the package with -p slidev-addon-decks",
    ({ line }) => {
      expect(deckInvocation.exec(line)?.[2]).toBe(pinned);
    },
  );

  it("pins the package in every docs page's inline decks commands", () => {
    for (const file of readdirSync(docsDir, { recursive: true, encoding: "utf8" })) {
      if (!file.endsWith(".md")) continue;
      const text = readFileSync(join(docsDir, file), "utf8");
      expect(text, file).not.toMatch(/\b(bunx|npx) decks\b/);
    }
  });

  it.each(shown.filter(({ line }) => /^(bun add|npm i|pnpm add) /.test(line)))(
    "$file: $line installs the package and the README's peers",
    ({ line }) => {
      const packages = line.split(/\s+/).slice(2);
      expect(packages).toContain(pkg.name);
      for (const name of packages) expect(readme, name).toContain(name);
    },
  );

  it("installs the same packages from every tab", () => {
    const installs = site.install.map((option) =>
      splitCommands(option.command)[0]?.split(/\s+/).slice(2),
    );
    for (const packages of installs) expect(packages).toEqual(installs[0]);
  });

  it("quotes the README's quickstart", () => {
    for (const line of site.quickstart) expect(readme).toContain(line);
    expect(readme).toContain(site.devCommand);
  });
});

describe("copy matches the repository", () => {
  it("shows the package's version and name", () => {
    expect(site.version).toBe(pkg.version);
    expect(site.packageName).toBe(pkg.name);
  });

  it("states the README's runtime requirements", () => {
    const node = /Node 20\.19\+ or 22\.12\+/;
    expect(readme).toMatch(node);
    expect(site.requirements.map((row) => row.text).join(" ")).toMatch(node);
    expect(readme).toMatch(/Bun is optional/);
  });

  it("names OpenChart at the version the package depends on", () => {
    const version = JSON.parse(read("packages/decks/package.json")).dependencies[
      "@opendata-ai/openchart-core"
    ];
    expect(site.requirements.map((row) => row.text).join(" ")).toContain(`OpenChart ${version}`);
  });

  it("notes only files decks init and decks new really write", () => {
    const files = loadProjectFiles();
    for (const path of Object.keys(site.files)) expect(files, path).toContain(path);
  });
});

const hero = ENTRIES[0];

describe("the hero's recorded agent run", () => {
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
    const line = draftLine(example.run, example.edits);
    expect(line).toContain(`Drafted in ${Math.round(Number(runFigures(run).minutes))} minutes`);
  });

  // A run in a decks init project calls the package's CLI; the placeholder hero
  // (tides) was drafted inside this repository, where the same subcommands run
  // through the root package.json scripts. Either way every command must exist.
  if (setup === "init") {
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
      if (edits)
        expect(label).toContain(
          `(+${edits.insertions}/−${edits.deletions} in ${edits.files} files)`,
        );
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

  it("has the hand edit's diff and caption pairs as git computes them", () => {
    if (!hero.edits) return;
    expect(existsSync(editsPath(hero.name)), "run node scripts/edits.mjs").toBe(true);
    expect(loadEdits(hero.name)).toEqual(computeEdits(hero.name, hero.edits));
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
      expect(provenance.label).toBe("From the talks Decks was extracted from");
    }
  });

  it("puts a deck with a recorded run first, as the hero", () => {
    expect(ENTRIES[0]?.provenance).toBe("agent");
  });
});

describe("the WARM still's theme.json", () => {
  const warm = JSON.parse(readFileSync(join(process.cwd(), "demo/warm-theme.json"), "utf8"));
  const templates = JSON.parse(read("examples/od-templates/theme.json"));

  it("is a valid override with surfaces and two ramps", () => {
    expect(Object.keys(warm).sort()).toEqual(["ramps", "surfaces"]);
    expect(Object.keys(warm.ramps)).toHaveLength(2);
    expect(() =>
      resolveTheme(JSON.parse(read("packages/decks/theme/default.json")), warm),
    ).not.toThrow();
  });

  it("takes its values from the od-templates palette", () => {
    expect(warm.surfaces).toEqual(templates.surfaces);
    for (const [hue, ramp] of Object.entries(warm.ramps))
      expect(ramp).toEqual(templates.ramps[hue]);
  });
});
