import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, stat, symlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { expect, inject, it, onTestFinished } from "vitest";
import { loadDeck } from "../config";
import { build } from "../server";

it("typechecks the conventional and story templates", async () => {
  await promisify(execFile)(resolve("node_modules/.bin/tsc"), [
    "--noEmit",
    "--ignoreConfig",
    "--strict",
    "--skipLibCheck",
    "--module",
    "esnext",
    "--moduleResolution",
    "bundler",
    "--target",
    "esnext",
    "--jsx",
    "react-jsx",
    "--resolveJsonModule",
    "--customConditions",
    "@steamfield/decks/source",
    // Source resolution compiles the kit, whose CSS properties need this augmentation.
    "packages/kit/src/style.d.ts",
    "packages/node/templates/conventional/deck.config.ts",
    "packages/node/templates/conventional/setup.ts",
    "packages/node/templates/story/deck.config.ts",
    "packages/node/templates/story/setup.ts",
    "packages/node/templates/story/components/FirstStage.tsx",
    "packages/node/templates/story/data/01-first.ts",
  ]);
});

it.each([
  { alias: "conventional", flags: [] },
  { alias: "story", flags: ["--story", "--url", "example.com"] },
])("ships and builds the $alias scaffold with the real Vite pipeline", async ({ alias, flags }) => {
  await mkdir(resolve(".tmp"), { recursive: true });
  const dir = await mkdtemp(resolve(".tmp/new-template-"));
  onTestFinished(() => rm(dir, { recursive: true, force: true }));
  const packageDir = inject("builtPackage");
  const dist = join(packageDir, "dist");
  expect((await stat(join(dist, "templates"))).isDirectory()).toBe(true);
  await mkdir(join(dir, "node_modules/@steamfield"), { recursive: true });
  await symlink(packageDir, join(dir, "node_modules/@steamfield/decks"), "dir");
  const result = await promisify(execFile)("node", [join(dist, "cli.js"), "new", alias, ...flags], {
    cwd: dir,
  });
  expect(result.stdout).toContain(`decks dev ${alias}`);
  const deck = await loadDeck(join(dir, "decks", alias), alias);
  const outDir = join(dir, "site");
  await build(deck, { outDir });
  expect(await readFile(join(outDir, "index.html"), "utf8")).toContain(
    `<title>${deck.config.title}</title>`,
  );
});
