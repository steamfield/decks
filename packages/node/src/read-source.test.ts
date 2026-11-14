import { execFile } from "node:child_process";
import { open, rename, rm } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { expect, it, onTestFinished } from "vitest";
import { fixture } from "./deck.test-support";
import { readSource } from "./read-source";

it("reads an empty source once when no change event preceded the read", async () => {
  const { dir, put } = await fixture(onTestFinished);
  const file = join(dir, "slides/01-first.mdx");
  await rm(file);
  await put("saved-source.mdx", "---\nclicks: 2\n---\n# Saved");
  await promisify(execFile)("mkfifo", [file]);
  const source = readSource(file);
  const writer = await open(file, "w");
  await rename(join(dir, "saved-source.mdx"), file);
  await writer.close();
  expect(await source).toBe("");
});
