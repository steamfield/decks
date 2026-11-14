/**
 * Slide 5: the Stacks repo tour. Sourced in data-sources.md under "Slide 5".
 * Read 2026-11-13 from ~/Projects/stacks/packages/cli at commit a952e96.
 *
 * SRC_FILES:  `find src -name '*.ts' | wc -l`
 * SRC_LINES:  `find src -name '*.ts' | xargs cat | wc -l`
 * TEST_FILES: `find tests -name '*.test.ts' | wc -l`
 * The tree's rows are real paths under packages/cli; the notes paraphrase
 * AGENTS.md's architecture map and each file's own header comment.
 */
import type { TreeNode } from './types'

export const SRC_FILES = 203
export const SRC_LINES = 24386
export const TEST_FILES = 209

export const TREE: readonly TreeNode[] = [
  { id: 'bin', label: 'bin.ts', depth: 0, note: 'the only file that imports Node' },
  { id: 'main', label: 'main.ts', depth: 0, note: 'one run: errors become exit codes' },
  { id: 'cli', label: 'cli.ts', depth: 0, note: 'the effect/cli command tree' },
  { id: 'runtime', label: 'runtime.ts', depth: 0, note: 'AppLayer' },
  { id: 'errors', label: 'errors.ts', depth: 0, note: 'every tagged error, one table' },
  { id: 'commands', label: 'commands/', depth: 0, note: 'one file per command' },
  { id: 'services', label: 'services/', depth: 0, note: 'Output, Host, Processes, Tcp' },
  { id: 'platform', label: 'platform/', depth: 0, note: 'Node-only adapters' },
  { id: 'schemas', label: 'schemas/', depth: 0, note: 'one Schema per --json result' },
  { id: 'core', label: 'core/', depth: 0, note: 'platform-free domain logic' },
  { id: 'tests', label: '../tests/', depth: 0, note: 'real command tree, fake layers' },
]
