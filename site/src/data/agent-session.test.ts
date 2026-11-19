// @vitest-environment node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateScript } from "@steamfield/ui/script";
import { describe, expect, it } from "vitest";
import { subcommands, toolFlags } from "../lib/cli-content.test-support";
import { agentSession, phoneScript, turns } from "./agent-session";
import { loadRecording } from "./examples";

const repo = join(process.cwd(), "..");
const deck = join(repo, "examples/agent-hero");
const read = (path: string) => readFileSync(join(repo, path), "utf8");

const slideFiles = readdirSync(join(deck, "slides"))
  .filter((file) => /^\d+-.+\.mdx$/.test(file))
  .sort();
const slideSource = (slide: number) =>
  readFileSync(join(deck, "slides", slideFiles[slide - 1] ?? ""), "utf8");
const rangeSource = ({ first, last }: { first: number; last: number }) =>
  Array.from({ length: last - first + 1 }, (_, i) => slideSource(first + i)).join("\n");

/** The clicks a slide takes, as the built deck reported them to `make demo`. */
const recorded = loadRecording("agent-hero");
const slideClicks = (slide: number) =>
  recorded?.states.find((state) => state.slide === slide)?.beats ?? Number.NaN;

const csvRows = (file: string) =>
  readFileSync(join(deck, "data", file), "utf8")
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => line.split(",").map(Number));

const steps = agentSession.steps;
const users = steps.flatMap((step) => (step.kind === "user" ? [step] : []));
const leads = steps.flatMap((step) => (step.kind === "agent-text" && step.lead ? [step] : []));
const calls = steps.flatMap((step) => (step.kind === "tool-call" ? [step] : []));
const lineText = (line: string | { text: string }) => (typeof line === "string" ? line : line.text);
const outputs = calls.flatMap((call) => (call.output ?? []).map(lineText));
const bash = calls.filter((call) => call.name === "Bash").map((call) => call.args ?? "");

describe("the scripted session's shape", () => {
  it("is a valid script with five prompts and five lead lines, one pair per turn in order", () => {
    expect(() => validateScript(agentSession)).not.toThrow();
    expect(users).toHaveLength(5);
    expect(leads).toHaveLength(5);
    expect(turns.map((turn) => turn.label)).toEqual(["Draft", "Reel", "Chart", "Check", "Ship"]);
    const order = steps.filter((step) => step.kind === "user" || step.kind === "agent-text");
    expect(order.map((step) => step.kind)).toEqual(Array(5).fill(["user", "agent-text"]).flat());
  });

  it("keeps the phone script to the same steps minus the tool calls", () => {
    expect(() => validateScript(phoneScript)).not.toThrow();
    expect(phoneScript.steps.some((step) => step.kind === "tool-call")).toBe(false);
    expect(phoneScript.steps).toEqual(steps.filter((step) => step.kind !== "tool-call"));
    expect(phoneScript.id).toBe(agentSession.id);
  });
});

describe("what the session names exists", () => {
  it("names only real decks commands, with flags that command takes", () => {
    const used = bash.map((args) => /^decks (\w+)/.exec(args)?.[1] ?? "");
    expect(used).toEqual(["check", "check", "check", "inspect", "shot", "lint", "build", "export"]);
    for (const [index, args] of bash.entries()) {
      const command = used[index] ?? "";
      expect(subcommands, args).toContain(command);
      for (const flag of args.match(/--[\w-]+/g) ?? [])
        expect(toolFlags(command), `${args}: ${flag}`).toContain(flag);
    }
    expect(bash.join(" ")).toContain("--final");
  });

  it("passes every positional argument each command requires", () => {
    for (const args of bash) {
      const command = /^decks (\w+)/.exec(args)?.[1] ?? "";
      const file = `packages/node/src/cli/commands/${command}.ts`;
      if (!existsSync(join(repo, file))) continue; // dev and build live in the dev server
      const required = read(file).match(/type: "positional", required: true/g)?.length ?? 0;
      const given = args
        .split(/\s+/)
        .slice(2)
        .filter((word) => !word.startsWith("-")).length;
      expect(given, args).toBeGreaterThanOrEqual(required);
    }
  });

  it("loads only skills the plugin ships", () => {
    const skills = calls
      .filter((call) => call.name === "Skill")
      .flatMap((call) => (call.args ?? "").split(/,\s*/));
    expect(skills).toEqual(["building-a-deck", "deck-data"]);
    for (const skill of skills)
      expect(existsSync(join(repo, "plugins/decks/skills", skill, "SKILL.md")), skill).toBe(true);
  });

  it("names only motion templates the framework has", () => {
    const names = [
      ...read("packages/core/src/motion-template-beats.ts").matchAll(/^\s+"?([\w-]+)"?: \{ kind/gm),
    ].map((match) => match[1]);
    const used = turns.flatMap((turn) => turn.uses.map((use) => use.template));
    expect(used).toEqual(["word-swap", "bar-board"]);
    for (const template of used) expect(names).toContain(template);
  });

  it("reads, writes and edits only files that exist in the deck", () => {
    const paths = calls
      .filter((call) => ["Read", "Write", "Edit"].includes(call.name))
      .flatMap((call) => call.args?.match(/[\w./-]+\.(?:mdx|md|csv)/g) ?? []);
    expect(paths).toEqual([
      "data/build-times.csv",
      "data-sources.md",
      "slides/02-cover.mdx",
      "06-close.mdx",
      "slides/07-reel.mdx",
      "data/changes.csv",
      "slides/08-saved.mdx",
      "slides/06-close.mdx",
    ]);
    for (const path of paths) {
      // A bare name after an ellipsis is a slide in the same directory.
      const file = path.includes("/") || !path.endsWith(".mdx") ? path : `slides/${path}`;
      expect(existsSync(join(deck, file)), file).toBe(true);
    }
  });

  it("names the PDF and the build folder that decks writes by default", () => {
    const outDir = JSON.parse(read("decks.json"))._config.outDir as string;
    expect(outDir).toBe("dist/{name}");
    // export.ts: join(dirname(outDir), `${name}.pdf`)
    expect(outputs).toContain("dist/agent-hero.pdf");
    expect(outputs).toContain("dist/agent-hero/");
  });
});

describe("the session says what the deck shows", () => {
  it("quotes each prompt's words verbatim from a slide in the result", () => {
    for (const [index, turn] of turns.entries()) {
      const prompt = users[index]?.text ?? "";
      const source = rangeSource(turn.result);
      for (const quote of turn.quotes) {
        expect(prompt, `turn ${index + 1} prompt`).toContain(quote);
        expect(source, `turn ${index + 1} result`).toContain(quote);
      }
    }
    expect(turns.flatMap((turn) => turn.quotes)).toHaveLength(4);
  });

  it("lands each named style on the template the result slide uses", () => {
    for (const [index, turn] of turns.entries()) {
      const prompt = users[index]?.text ?? "";
      for (const { phrase, template } of turn.uses) {
        expect(prompt).toContain(phrase);
        expect(rangeSource(turn.result)).toContain(`template="${template}"`);
      }
    }
  });

  it("states only figures that come from the two CSV files", () => {
    const [first, ...rest] = csvRows("build-times.csv");
    const last = rest.at(-1) ?? [];
    const saved = csvRows("changes.csv").map((row) => row[2] ?? 0);
    const draft = turns[0]?.result;
    const allowed = new Set([
      Math.round(first?.[1] ?? Number.NaN),
      Math.round(last[1] ?? Number.NaN),
      Math.max(...saved),
      saved.reduce((sum, value) => sum + value, 0),
      (draft?.last ?? 0) - (draft?.first ?? 0) + 1,
    ]);
    expect([...allowed].sort((a, b) => a - b)).toEqual([4, 5, 10, 14]);
    const figures = [
      ...users.map((step) => step.text),
      ...leads.map((step) => `${step.lead ?? ""} ${step.text}`),
      ...outputs,
    ]
      // A slide number is checked against the deck by the overflow test.
      .map((line) => line.replace(/\bslide \d+/g, ""))
      .flatMap((line) => line.match(/\d+/g) ?? [])
      .map(Number);
    expect(figures.toSorted((a, b) => a - b)).toEqual([4, 5, 5, 10, 14]);
    for (const figure of figures) expect(allowed, `${figure}`).toContain(figure);
  });

  it("reports the overflow on the slide that is built to overflow", () => {
    expect(slideFiles[5]).toBe("06-close.mdx");
    const inspect = calls.find((call) => call.args?.startsWith("decks inspect"));
    expect(inspect?.output?.map(lineText)).toEqual(["slide 6: clipped at the bottom"]);
    expect(turns[3]?.hold.slide).toBe(6);
  });
});

describe("where the player holds and lands", () => {
  const stage = (slide: number) => slideFiles[slide - 1]?.replace(/\.mdx$/, "");

  it("holds on a real step of a real slide", () => {
    expect(recorded?.slides).toBe(9);
    for (const turn of turns) {
      expect(turn.hold.beat).toBeGreaterThanOrEqual(0);
      expect(turn.hold.beat, `slide ${turn.hold.slide}`).toBeLessThanOrEqual(
        slideClicks(turn.hold.slide),
      );
    }
  });

  it("holds each turn on the state its request starts from", () => {
    expect(slideFiles).toHaveLength(9);
    expect(turns.map((turn) => stage(turn.hold.slide))).toEqual([
      "01-blank",
      "02-cover",
      "04-stat",
      "06-close",
      "09-close-fitted",
    ]);
    // A new slide starts from something already on screen; a refine from the slide it replaces.
    for (const turn of turns.filter((t) => t.kind === "new"))
      expect(turn.hold.slide).toBeLessThan(turn.result.first);
    expect(stage(turns[2]?.result.first ?? 0)).toBe("08-saved");
    expect(stage(turns[3]?.result.first ?? 0)).toBe("09-close-fitted");
    // The revisit holds where the session last landed.
    expect(turns[4]?.hold.slide).toBe(turns[3]?.result.last);
  });

  it("plays results inside the deck, stepping only slides in the range that have steps", () => {
    for (const { result } of turns) {
      expect(result.first).toBeGreaterThanOrEqual(1);
      expect(result.last).toBeLessThanOrEqual(slideFiles.length);
      expect(result.first).toBeLessThanOrEqual(result.last);
      for (const slide of result.stepBeatsOn) {
        expect(slide).toBeGreaterThanOrEqual(result.first);
        expect(slide).toBeLessThanOrEqual(result.last);
        expect(slideClicks(slide), `slide ${slide} has steps`).toBeGreaterThan(0);
      }
    }
  });
});
