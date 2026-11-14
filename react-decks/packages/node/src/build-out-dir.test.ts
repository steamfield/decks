import { chmod, readFile, symlink } from "node:fs/promises";
import { join } from "node:path";
import { expect, it, onTestFinished } from "vitest";
import { cli, fixture } from "./deck.test-support";

it.each(["talk", ".", "..", "alias"])(
  "refuses protected output %s before touching the deck",
  async (out) => {
    const { dir, put } = await fixture(onTestFinished);
    await put("talk/deck.config.ts", 'export default {title:"Keep me"}');
    await put("talk/slides/01.mdx", "# Keep me");
    await put("keep.txt", "Must survive");
    if (out === "alias") await symlink(join(dir, "talk"), join(dir, "alias"));
    const process = cli(dir, ["build", "talk", "--out", out]);
    expect((await process.exit)[0]).toBe(1);
    expect(process.output().stderr).toBe(
      `decks build: --out ${out} is the deck directory (or contains it). build empties --out first, which would delete the deck. Choose another directory.\n`,
    );
    expect(await readFile(join(dir, "talk/slides/01.mdx"), "utf8")).toBe("# Keep me");
    expect(await readFile(join(dir, "keep.txt"), "utf8")).toBe("Must survive");
  },
);

it("preserves an unrelated file in a nonempty output directory", async () => {
  const { dir, put } = await fixture(onTestFinished);
  await put("site/keep.txt", "Unrelated work");
  const process = cli(dir, ["build", ".", "--out", "site"]);
  expect((await process.exit)[0]).toBe(1);
  expect(process.output().stderr).toBe(
    "decks build: site is not empty and was not written by decks build. Empty it yourself or choose another --out.\n",
  );
  expect(await readFile(join(dir, "site/keep.txt"), "utf8")).toBe("Unrelated work");
});

it("refuses an output file without deleting it", async () => {
  const { dir, put } = await fixture(onTestFinished);
  await put("site", "Keep this file");
  const process = cli(dir, ["build", ".", "--out", "site"]);
  expect((await process.exit)[0]).toBe(1);
  expect(process.output().stderr).toBe("decks build: --out site is a file. Choose a directory.\n");
  expect(await readFile(join(dir, "site"), "utf8")).toBe("Keep this file");
});

it("explains an unwritable output directory", async () => {
  const { dir, put } = await fixture(onTestFinished);
  await put("locked/keep.txt", "Must survive");
  await chmod(join(dir, "locked"), 0o555);
  onTestFinished(() => chmod(join(dir, "locked"), 0o755));
  const process = cli(dir, ["build", ".", "--out", "locked/site"]);
  expect((await process.exit)[0]).toBe(1);
  expect(process.output().stderr).toBe(
    "decks build: cannot write to locked/site (permission denied).\n",
  );
  expect(await readFile(join(dir, "locked/keep.txt"), "utf8")).toBe("Must survive");
});

it("replaces a previous decks build and permits an empty output directory", async () => {
  const { dir, put } = await fixture(onTestFinished);
  await put("site/index.html", '<meta name="decks:name" content="old">');
  await put("site/old.txt", "Old build");
  const process = cli(dir, ["build", ".", "--out", "site"]);
  expect((await process.exit)[0], process.output().stderr).toBe(0);
  expect(await readFile(join(dir, "site/index.html"), "utf8")).toContain('name="decks:name"');
  await expect(readFile(join(dir, "site/old.txt"))).rejects.toMatchObject({ code: "ENOENT" });
});
