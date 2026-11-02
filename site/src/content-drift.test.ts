// @vitest-environment node
// The landing page and docs quote Decks: commands, figures from a recorded run,
// the prose-lint hook's answer and each example deck's own title and colors.
// These checks read the repository around the site, so a renamed command, a
// changed hook or a stale recording fails here instead of shipping.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveTheme } from "../../packages/decks/theme/resolve.ts";
import { runHook } from "../scripts/hook.mjs";
import { site } from "./config";
import { loadHookDenial, loadSmokeRun, runFigures } from "./data/fixtures";
import {
  deckDir,
  loadRecording,
  loadTape,
  recordingPath,
  START_BEATS,
  TAPE_NAMES,
} from "./data/tapes";
import { contrast } from "./lib/contrast";

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
const deckInvocation = /^(bunx|npx|pnpm exec) (\S+)\s*(.*)$/;

const shown = [
  ...site.quickstart.map((line) => ({ file: "config: hero", line })),
  ...site.install.flatMap((option) =>
    splitCommands(option.command).map((line) => ({ file: `config: ${option.label}`, line })),
  ),
  ...site.afterInstall.map((line) => ({ file: "config: after install", line })),
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
    const [, , bin = "", rest = ""] = deckInvocation.exec(line) ?? [];
    expect(Object.keys(pkg.bin), "the package's bin").toContain(bin);
    const [subcommand] = rest.split(/\s+/);
    expect(subcommands, "a deck.mjs case").toContain(subcommand);
    for (const flag of rest.match(/--[a-z][\w-]*/g) ?? []) {
      expect(runnerFlags, `${flag} in deck.mjs`).toContain(flag);
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
    for (const line of site.quickstart) expect(readme).toContain(line.split(" --story")[0]);
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
    expect(site.requirements.join(" ")).toMatch(node);
    expect(site.fit.yes.join(" ")).toMatch(node);
    expect(readme).toMatch(/Bun is optional/);
  });

  it("names OpenChart at the version the package depends on", () => {
    const version = JSON.parse(read("packages/decks/package.json")).dependencies[
      "@opendata-ai/openchart-core"
    ];
    expect(site.fit.no.join(" ")).toContain(`OpenChart is at ${version}`);
  });
});

describe("the recorded agent run", () => {
  const run = loadSmokeRun();

  it("is a successful run of the tides prompt", () => {
    expect(run.steps.length).toBeGreaterThan(5);
    expect(run.steps.at(-1)?.output).toMatch(/built in/);
    expect(run.steps.find((step) => step.calls[0] === "Bash(bun run check)")?.output).toBe(
      "All page files match their manifests.",
    );
  });

  it("gives the figures the page and caption quote", () => {
    const figures = runFigures(run);
    expect(figures).toEqual({ turns: 87, minutes: "8.3", cost: "$3.17" });
    const player = readFileSync(
      join(process.cwd(), "src/components/landing/DeckPlayer.tsx"),
      "utf8",
    );
    expect(player).toContain(`${Math.floor(Number(figures.minutes))}-minute run`);
  });
});

describe("the prose-lint hook", () => {
  it("still denies the planted line with the recorded rules and reason", () => {
    expect(runHook()).toEqual(loadHookDenial());
    expect(loadHookDenial().rules).toEqual(["banned-phrase", "ai-vocab"]);
  });
});

describe("example decks", () => {
  it.each(TAPE_NAMES)("%s is an example deck with a recording from make demo", (name) => {
    expect(existsSync(join(deckDir(name), "slides.md"))).toBe(true);
    expect(existsSync(recordingPath(name)), `${recordingPath(name)}: run make demo`).toBe(true);
    const recording = loadRecording(name);
    const headmatter = /^title:\s*["']?(.+?)["']?\s*$/m.exec(read(`examples/${name}/slides.md`));
    expect(recording?.title).toBe(headmatter?.[1]);
    expect(recording?.slideTitles).toHaveLength(recording?.slides ?? -1);
    expect(recording?.startSlide).toBeGreaterThanOrEqual(1);
    expect(recording?.startSlide).toBeLessThanOrEqual(recording?.slides ?? 0);
    // The poster was shot at the recorded start step: re-run make demo after changing START_BEATS.
    expect(recording?.startBeat).toBe(START_BEATS[name] ?? 0);
    expect(
      recording?.states.some(
        (s) => s.slide === recording.startSlide && s.beat === recording.startBeat,
      ),
    ).toBe(true);
    expect(recording?.states.length).toBeGreaterThanOrEqual(recording?.slides ?? 1);
  });

  it.each(TAPE_NAMES)("%s has a poster in both formats and sizes", (name) => {
    for (const file of [
      `${name}-640.avif`,
      `${name}-1280.avif`,
      `${name}-640.webp`,
      `${name}-1280.webp`,
    ]) {
      expect(existsSync(join(process.cwd(), "public/posters", file)), file).toBe(true);
    }
  });

  it.each(TAPE_NAMES)("%s's cassette label is readable in its own colors", (name) => {
    const { theme } = loadTape(name);
    expect(contrast(theme.paper, theme.ink)).toBeGreaterThanOrEqual(4.5);
  });

  it("colors od-templates' cassette from its own warm theme", () => {
    expect(loadTape("od-templates").theme.ink).toBe("#15110e");
    expect(loadTape("tides").theme.ink).toBe("#09090b");
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
