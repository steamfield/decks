// A user's project, as `decks init` and `decks new my-talk --story` leave it,
// made in a temporary directory with the package's own CLI. The landing page's
// file tree lists it and the hook panel's test write goes through its hooks, so
// both show what a user gets rather than what this repository has.
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// Run from site/ (builds, tests and the generators all do); once bundled into
// dist/, import.meta paths no longer point here.
const PACKAGE = resolve(process.cwd(), "../packages/decks");
export const CLI = join(PACKAGE, "scripts/deck.mjs");
/** What init and new are called with, in order. */
const SETUP_ARGS = [["init"], ["new", "my-talk", "--story"]];
/** The same commands as the page prints them: pinned, since the bare `decks` on npm is another package. */
export const SETUP_COMMANDS = SETUP_ARGS.map(
  (args) => `bunx -p slidev-addon-decks decks ${args.join(" ")}`,
);

function decks(cwd, args) {
  const result = spawnSync("node", [CLI, ...args], { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(
      `decks ${args.join(" ")} exited ${result.status}: ${result.stdout}${result.stderr}`,
    );
  }
  return result.stdout;
}

/**
 * Runs `fn(dir)` in a fresh project after init and new, then deletes the project.
 * The package is linked into node_modules/ the way `bun add` installs it, so
 * init finds it and writes the hooks.
 */
export function withScratchProject(fn) {
  const dir = mkdtempSync(join(tmpdir(), "decks-site-project-"));
  try {
    mkdirSync(join(dir, "node_modules"));
    symlinkSync(PACKAGE, join(dir, "node_modules/slidev-addon-decks"), "dir");
    for (const args of SETUP_ARGS) decks(dir, args);
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Every file init and new wrote, relative to the project, sorted; node_modules/ left out. */
export function projectFiles(dir) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name).slice(dir.length + 1))
    .filter((path) => !path.startsWith("node_modules"))
    .sort();
}
