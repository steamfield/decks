/**
 * Slide 8: the Stacks repo tour. Sourced in data-sources.md under "Slide 8".
 * Counts reread 2026-11-18 from ~/Projects/stacks/packages/cli at commit
 * 6525ecbd (main, after the CLI structure refactor), as are the code excerpts
 * in data/code/08-stacks.ts; tree reread at 87de4915; first read at a952e96.
 *
 * SRC_FILES:  `find src -name '*.ts' | wc -l`
 * SRC_LINES:  `find src -name '*.ts' | xargs cat | wc -l`
 * TEST_FILES: `find tests -name '*.test.ts' | wc -l`
 * The tree's rows are real paths under packages/cli; the notes paraphrase
 * AGENTS.md's architecture map and each file's own header comment.
 */
import type { TreeNode } from "./types";

export const SRC_FILES = 231;
export const SRC_LINES = 29424;
export const TEST_FILES = 223;

export const TREE: readonly TreeNode[] = [
  {
    id: "bin",
    label: "bin.ts",
    depth: 0,
    path: "packages/cli/src/bin.ts",
    note: "the only file that imports Node",
  },
  {
    id: "main",
    label: "main.ts",
    depth: 0,
    path: "packages/cli/src/main.ts",
    note: "one run: errors become exit codes",
  },
  {
    id: "cli",
    label: "cli.ts",
    depth: 0,
    path: "packages/cli/src/cli.ts",
    note: "the effect/cli command tree",
  },
  {
    id: "runtime",
    label: "runtime.ts",
    depth: 0,
    path: "packages/cli/src/runtime.ts",
    note: "AppLayer",
  },
  {
    id: "errors",
    label: "errors.ts",
    depth: 0,
    path: "packages/cli/src/errors.ts",
    note: "every tagged error, one table",
  },
  {
    id: "commands",
    label: "commands/",
    depth: 0,
    path: "packages/cli/src/commands/",
    note: "one file per command",
  },
  {
    id: "services",
    label: "services/",
    depth: 0,
    path: "packages/cli/src/services/",
    note: "Output, Host, Processes, Tcp",
  },
  {
    id: "platform",
    label: "platform/",
    depth: 0,
    path: "packages/cli/src/platform/",
    note: "Node-only adapters",
  },
  {
    id: "schemas",
    label: "schemas/",
    depth: 0,
    path: "packages/cli/src/schemas/",
    note: "one Schema per --json result",
  },
  {
    id: "core",
    label: "core/",
    depth: 0,
    path: "packages/cli/src/core/",
    note: "platform-free domain logic",
  },
  {
    id: "tests",
    label: "../tests/",
    depth: 0,
    path: "packages/cli/tests/",
    note: "real command tree, fake layers",
  },
];
