import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it, onTestFinished } from "vitest";
import { build, loadDeck } from "../index";
import { fixture, repoPath } from "./server.test-support";

it("a built terminal deck ships no xterm code for its recorded panes", async () => {
  const { dir } = await fixture(onTestFinished);
  const outDir = join(dir, "site");
  await build(await loadDeck(repoPath("examples/terminal")), { outDir });
  const files = (await readdir(outDir, { recursive: true })).filter(
    (file) => file.endsWith(".js") || file.endsWith(".css"),
  );
  expect(files.length).toBeGreaterThan(0);
  const code = (await Promise.all(files.map((file) => readFile(join(outDir, file), "utf8")))).join(
    "\n",
  );
  expect(code).not.toMatch(/@xterm|xterm-screen|xterm-viewport|XtermHost/);
}, 120_000);
