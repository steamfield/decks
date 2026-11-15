import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { expect, it, onTestFinished } from "vitest";
import { fixture } from "../../dev/server.test-support";
import { lintDecks } from "./lint";

function command(cwd: string, args: string[], input = "") {
  const result = spawnSync(
    resolve("node_modules/.bin/tsx"),
    [resolve("packages/node/src/cli/cli.ts"), "lint", ...args],
    { cwd, input, encoding: "utf8" },
  );
  if (result.error) throw result.error;
  return result;
}

it("returns hits and counts across MDX, TSX and COPY modules while excluding data", async () => {
  const { dir } = await fixture(onTestFinished, {
    "slides/02-x.mdx": "An em — dash.\n\n<Notes>At its core, tides.</Notes>",
    "components/nested/Stage.tsx":
      "const COPY = [{body: 'A seamless tide.'}]; export const Stage = () => <p>In other words, tides.</p>;",
    "layers/footer.tsx": "export const Footer = () => <p>Let that sink in.</p>;",
    "components/copy.ts": "const COPY = [{lead: 'At its core, tides.'}];",
    "data/02.ts": "export const COPY = [{lead: 'seamless'}];",
    "node_modules/x/components/X.tsx": "const COPY = [{lead: 'seamless'}];",
  });
  const decks = [{ alias: "test", dir }];
  const result = await lintDecks([...decks, ...decks], { errorsOnly: false });
  expect(result).toMatchObject({ errors: 4, warnings: 2 });
  expect(result.hits).toHaveLength(6);
  expect(
    result.hits.every((hit) => !hit.file.includes("data/") && !hit.file.includes("node_modules")),
  ).toBe(true);
  expect(await lintDecks(decks, { errorsOnly: true })).toMatchObject({
    errors: 4,
    warnings: 0,
    hits: expect.any(Array),
  });
});

it("uses the registry for a bare run and accepts several aliases or a deck directory", async () => {
  const { dir } = await fixture(onTestFinished, {
    "decks.json": JSON.stringify({ a: { dir: "a" }, b: { dir: "b" } }),
    "a/deck.config.ts": 'export default {title: "A"};',
    "a/slides/01-x.mdx": "An em — dash.",
    "b/deck.config.ts": 'export default {title: "B"};',
    "b/slides/01-x.mdx": "At its core, tides.",
    "unregistered/deck.config.ts": 'export default {title: "C"};',
    "unregistered/slides/01-x.mdx": "A seamless tide.",
  });
  for (const args of [[], ["a", "b"]]) {
    const result = command(dir, args);
    expect(result.status, result.stderr).toBe(1);
    expect(result.stdout).toContain("a/slides/01-x.mdx:1:5  error  em-dash");
    expect(result.stdout).toContain("b/slides/01-x.mdx:1:1  error  banned-phrase");
    expect(result.stdout).not.toContain("unregistered");
  }
  expect(command(dir, ["./a"]).stdout).toContain("em-dash");
});

it.each([
  ["Clean.", 0, ""],
  ["In other words, tides.", 0, "warn  colon-reveal"],
  ["It's not just a chart, it's a story.", 1, "stdin:1:1  error  not-just-reveal"],
  ["```\nIt's not just a chart, it's a story.\n```", 0, ""],
])("lints stdin as MDX %j", async (input, status, output) => {
  const { dir } = await fixture(onTestFinished);
  const result = command(dir, ["--stdin"], input);
  expect(result.status, result.stderr).toBe(status);
  expect(result.stdout).toContain(output);
  if (!output) expect(result.stdout).toBe("");
});

it.each([
  [["--bogus"], "Unknown option"],
  [["--stdin", "x"], "--stdin takes no targets"],
  [["missing"], '"missing" is not a registered deck or a directory'],
  [["src"], "no deck.config.ts"],
  [[], "No decks found to lint"],
])("explains invalid lint arguments %j", async (args, message) => {
  const { dir, put } = await fixture(onTestFinished);
  await put("src/x.ts", "");
  const result = command(dir, args);
  expect(result.status).toBe(1);
  expect(result.stderr).toContain(message);
  expect(result.stderr).not.toContain("This is a bug");
});

it.each(["-h", "--help"])("prints lint usage for %s", async (arg) => {
  const { dir } = await fixture(onTestFinished);
  const result = command(dir, [arg]);
  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout).toContain("USAGE decks lint");
});

it("rejects a stale registry entry on a bare lint run", async () => {
  const { dir } = await fixture(onTestFinished, { "decks.json": '{"gone":{"dir":"missing"}}' });
  const result = command(dir, []);
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('entry "gone" points at missing/');
});

it("keeps Unicode patterns intact when stdin exceeds a pipe buffer", async () => {
  const { dir } = await fixture(onTestFinished);
  // Put the multibyte dash across a 64 KiB read, with padding hidden in an MDX comment.
  const result = command(dir, ["--stdin"], `{/*${"x".repeat(65526)}*/}\n\nx—x`);
  expect(result.status, result.stderr).toBe(1);
  expect(result.stdout).toContain("stdin:3:1  error  em-dash");
});

it("uses the deck's configured remark syntax extensions", async () => {
  const { dir } = await fixture(onTestFinished, {
    "deck.config.ts":
      'import math from "remark-math"; export default {title: "Math", mdx: {remarkPlugins: [math]}};',
    "slides/01-first.mdx": "$x^{\\alpha}$\n\nAt its core, tides.",
  });
  const result = command(dir, ["."]);
  expect(result.status, result.stderr).toBe(1);
  expect(result.stdout).toContain("banned-phrase");
  expect(result.stderr).toBe("");
});
