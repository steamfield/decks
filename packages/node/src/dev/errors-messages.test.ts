import { rm } from "node:fs/promises";
import { join } from "node:path";
import { expect, it, onTestFinished } from "vitest";
import { cli, fixture } from "./server.test-support";

type Expected = string | { start: string; end: string };

/** A string is pinned exactly; a pair pins this code's own start and end around library wording. */
function expectReport(stderr: string, expected: Expected) {
  if (typeof expected === "string") return expect(stderr).toBe(`decks build: ${expected}\n`);
  expect(stderr.startsWith(`decks build: ${expected.start}`)).toBe(true);
  expect(stderr.endsWith(`${expected.end}\n`)).toBe(true);
  expect(stderr.trimEnd().split("\n")).toHaveLength(expected.start.split("\n").length);
}

it.each<[string, string, Expected]>([
  ["missing title", "export default {}", "deck.config.ts: title is required (a string)."],
  ["wrong config export", "export default 42", "deck.config.ts: config must be an object, got 42."],
  [
    "empty transition",
    'export default {title:"Deck",transition:""}',
    'deck.config.ts: transition must not be empty, got "".',
  ],
  [
    "unknown config key",
    'export default {titel:"Deck"}',
    // The list of known keys follows the schema, so only the part this code writes is pinned.
    {
      start:
        'deck.config.ts: title is required (a string).\ndeck.config.ts: unknown key "titel". Known keys: ',
      end: ".",
    },
  ],
  [
    "wrong type",
    'export default {title:"Deck",canvas:{width:"1920",height:1080}}',
    'deck.config.ts: canvas.width must be a number, got "1920".',
  ],
  [
    "no default export",
    "export const title = 'Deck'",
    'deck.config.ts has no default export. Write: export default defineDeck({ title: "..." })',
  ],
  [
    "empty config",
    "",
    'deck.config.ts has no default export. Write: export default defineDeck({ title: "..." })',
  ],
])("reports %s in plain sentences once", async (_name, source, message) => {
  const { dir } = await fixture(onTestFinished, { "deck.config.ts": source });
  const process = cli(dir, ["build", "."]);
  expect((await process.exit)[0]).toBe(1);
  expectReport(process.output().stderr, message);
  expect(process.output().stdout).toBe("");
});

it.each<[string, string, Expected]>([
  [
    "frontmatter",
    '---\nclicks: "two"\n---\n# Slide',
    'slides/01-first.mdx: frontmatter clicks must be a whole number 0 or greater, got "two".',
  ],
  [
    "step attribute",
    "# Slide\n\n<Step at={n} />",
    "slides/01-first.mdx:3:1: <Step at={n}>: at must be a literal whole number (at={2}). To compute it, set clicks: in the frontmatter.",
  ],
  [
    "step position after frontmatter",
    "---\ntitle: Sample\n---\n\n# Slide\n\n<Step at={n} />",
    "slides/01-first.mdx:7:1: <Step at={n}>: at must be a literal whole number (at={2}). To compute it, set clicks: in the frontmatter.",
  ],
  [
    "YAML position",
    "---\ntitle: [\n---\n# Slide",
    // The reason in between is the YAML parser's wording; position and remedy are this code's.
    { start: "slides/01-first.mdx:3:1: invalid YAML: ", end: " Check the frontmatter syntax." },
  ],
  [
    "MDX position",
    "# Slide\n\n<div",
    { start: "slides/01-first.mdx:3:5: ", end: " Check the slide and its MDX plugins." },
  ],
  [
    "step inside an expression",
    "{true && <Step at={1} />}",
    "slides/01-first.mdx:1:10: <Step> inside a JavaScript expression cannot be counted. To compute it, set clicks: in the frontmatter.",
  ],
  [
    "undefined component",
    "# Slide\n\n<Nonexistent />",
    "slides/01-first.mdx:3:1: <Nonexistent> is not defined. Export it from a file in components/ or import it in the slide.",
  ],
  [
    "duplicate notes",
    "<Notes>One</Notes>\n\n<Notes>Two</Notes>",
    "slides/01-first.mdx: more than one <Notes> block. Keep one <Notes> block per slide.",
  ],
])("reports %s from a build once without a stack or JSON", async (_name, source, message) => {
  const { dir } = await fixture(onTestFinished, { "slides/01-first.mdx": source });
  const process = cli(dir, ["build", "."]);
  expect((await process.exit)[0]).toBe(1);
  expectReport(process.output().stderr, message);
  expect(process.output().stdout).toBe("");
});

it("explains a missing deck config", async () => {
  const { dir, put } = await fixture(onTestFinished);
  await put("empty/keep.txt", "Keep");
  const process = cli(dir, ["build", "empty"]);
  expect((await process.exit)[0]).toBe(1);
  expect(process.output().stderr).toBe(
    "decks build: no deck.config.ts in empty. A deck directory holds deck.config.ts and slides/.\n",
  );
});

it("lists registered decks for an unknown deck", async () => {
  const { dir, put } = await fixture(onTestFinished);
  await put("decks.json", JSON.stringify({ basic: { dir: "." }, motion: { dir: "." } }));
  const process = cli(dir, ["build", "aa"]);
  expect((await process.exit)[0]).toBe(1);
  expect(process.output().stderr).toBe(
    'decks build: "aa" is not a registered deck or a directory. Registered in decks.json: basic, motion.\n',
  );
});

it("names a registry entry pointing nowhere", async () => {
  const { dir, put } = await fixture(onTestFinished);
  await put("decks.json", '{"a":{"dir":"nope"}}');
  const process = cli(dir, ["build", "a"]);
  expect((await process.exit)[0]).toBe(1);
  expect(process.output().stderr).toBe(
    'decks build: decks.json entry "a" points at nope/, which does not exist.\n',
  );
});

it.each([true, false])("explains an empty visible deck (hidden=%s)", async (hidden) => {
  const { dir, put } = await fixture(onTestFinished);
  if (hidden) await put("slides/01-first.mdx", "---\nhide: true\n---\n# Hidden");
  else await rm(join(dir, "slides/01-first.mdx"));
  const process = cli(dir, ["build", "."]);
  expect((await process.exit)[0]).toBe(1);
  expect(process.output().stderr).toBe(
    hidden
      ? "decks build: every slide in ./slides has hide: true.\n"
      : "decks build: no slides/*.mdx files in the current directory.\n",
  );
});

it("gives a component syntax error's position and a remedy", async () => {
  const { dir } = await fixture(onTestFinished, {
    "components/X.tsx": "export default function X() {\n  return null;\n",
  });
  const process = cli(dir, ["build", "."]);
  expect((await process.exit)[0]).toBe(1);
  expectReport(process.output().stderr, {
    start: "components/X.tsx:3:1: ",
    end: " Check the component syntax.",
  });
});
