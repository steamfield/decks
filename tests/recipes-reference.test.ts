import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, onTestFinished, test } from "vitest";
import { cliProcess } from "../packages/node/src/cli/cli-process.test-support";

async function decks(...args: string[]) {
  const command = cliProcess("bun", ["--silent", "run", "decks", ...args], {});
  onTestFinished(() => command.close());
  const [code] = await command.exit;
  return { code, ...command.output() };
}

test("every recipe slide file appears in recipes.md with identical MDX", async () => {
  const directory = "examples/recipes/slides";
  const names = (await readdir(directory)).filter((name) => name.endsWith(".mdx")).sort();
  expect(names).toHaveLength(8);
  const slides = await Promise.all(names.map((name) => readFile(join(directory, name), "utf8")));
  const reference = await readFile(
    "plugins/decks/skills/building-a-deck/references/recipes.md",
    "utf8",
  );
  const snippets = [...reference.matchAll(/^~~~~mdx\n([\s\S]*?)^~~~~$/gm)].map((match) => match[1]);
  expect(snippets).toEqual(slides);
});

test("bun run decks check passes for the recipes deck", async () => {
  expect(await decks("check")).toEqual({
    code: 0,
    stdout: "All decks check out.\n",
    stderr: "",
  });
});

test("bun run decks lint recipes passes", async () => {
  expect(await decks("lint", "recipes")).toEqual({ code: 0, stdout: "", stderr: "" });
});

test("bun run decks inspect recipes reports no findings", async () => {
  expect(await decks("inspect", "recipes")).toEqual({
    code: 0,
    stdout: "no layout findings in 8 slides\n",
    stderr: "",
  });
});
