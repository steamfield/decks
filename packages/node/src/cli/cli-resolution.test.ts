import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it, onTestFinished } from "vitest";
import { cli, fixture } from "../dev/server.test-support";

it.each([
  { args: [], expected: "/talks/x/" },
  { args: ["--base", "/"], expected: "/" },
])("build uses base $expected with arguments $args", async ({ args, expected }) => {
  const { dir, put } = await fixture(onTestFinished, {
    "deck.config.ts": 'export default { title: "Talk", vite: { base: "/talks/x/" } };',
  });
  await put("decks.json", JSON.stringify({ _config: { base: "/registry/" }, talk: { dir: "." } }));
  const process = cli(dir, ["build", "talk", "--out", "site", ...args]);
  expect((await process.exit)[0], process.output().stderr).toBe(0);
  expect(await readFile(join(dir, "site/index.html"), "utf8")).toContain(`src="${expected}assets/`);
});

it.each([false, true])(
  "resolves a bare deck name under decksDir with existing file %s",
  async (existingFile) => {
    const { dir } = await fixture(onTestFinished, {
      ...(existingFile ? { demo: "A file is not a deck directory" } : {}),
      "decks.json": JSON.stringify({ _config: { decksDir: "talks" } }),
      "talks/demo/deck.config.ts": 'export default { title: "Nested talk" };',
      "talks/demo/slides/01-first.mdx": "# Nested slide",
    });
    const process = cli(dir, ["build", "demo", "--out", "site"]);
    expect((await process.exit)[0], process.output().stderr).toBe(0);
    expect(await readFile(join(dir, "site/index.html"), "utf8")).toContain("Nested talk");
  },
);
