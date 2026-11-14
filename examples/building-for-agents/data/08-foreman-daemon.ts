/**
 * Slide 8: foreman's processes. Sourced in data/sources/08-foreman-daemon.md.
 * Read 2026-11-13 from ~/Projects/claude-codex at commit 9413fa8. Every value
 * below names the file and line it was read from.
 *
 * SRC_LINES:   `find src -name '*.ts' ! -name '*.test.ts' | xargs cat | wc -l`
 * COMMITS:     `git rev-list --count HEAD`; first and last commit dates from
 *              `git log --reverse --format=%cd --date=short | head -1` and
 *              `git log -1 --format=%cd --date=short`.
 * The tree's rows are real paths under src/; the notes paraphrase what each
 * folder holds (`ls src/<folder>`).
 */
import type { TreeNode } from './types'

/** Non-test TypeScript lines under src/. */
export const SRC_LINES = 9189
/** Commits on HEAD, and the dates of the first and the last. */
export const COMMITS = 111
export const FIRST_COMMIT = '2026-11-05'
export const LAST_COMMIT = '2026-11-07'

/** src/daemon/server.ts line 57: `path.join(options.dataDir, "foreman.sock")`. */
export const SOCKET_FILE = 'foreman.sock'
/**
 * The default home: src/config.ts line 88 (`path.join(userHome ?? ".", ".foreman")`),
 * passed as the daemon's dataDir at src/commands/daemon.ts line 145.
 */
export const SOCKET_PATH = `~/.foreman/${SOCKET_FILE}`
/**
 * The frame on the socket. src/schemas/daemon.ts line 321:
 * `DaemonRequest = Schema.Struct({ id: Schema.Int, body: DaemonRequestBody })`;
 * lines 395 and 396: a response is `{ id, result }` or `{ id, error }`. One
 * JSON document per line: src/daemon/protocol.ts line 15 (`Stream.splitLines`)
 * and src/daemon/server.ts line 154 (`writer.write(`${json}\n`)`).
 */
export const REQUEST_FRAME = '{ id, body }'
export const RESPONSE_FRAME = '{ id, result }'
/** src/daemon/server.ts line 194: `options.idleLimitMs ?? 1_800_000`, in minutes. */
export const IDLE_EXIT_MIN = 1_800_000 / 60_000

/**
 * How the daemon starts Codex. src/codex/client.ts line 59:
 * `ChildProcess.make(options.codexBin, ["app-server", "--listen", "stdio://"], …)`.
 */
export const CODEX_COMMAND = 'codex app-server'
export const CODEX_ARGS = '--listen stdio://'
/** src/schemas/codex.ts lines 21, 24 and 25: `threadStart`, `turnStart`, `turnSteer`. */
export const RPC_METHODS = ['thread/start', 'turn/start', 'turn/steer'] as const

/** src/codex/protocol.ts lines 10 to 14, `supportedCodex`. */
export const CODEX_VERSION = '0.166.0'
export const SCHEMA_FILES = 467
/** The first eight characters of `supportedCodex.schemaHash` (SHA-256). */
export const SCHEMA_HASH_SHORT = '1285d9e9'

/** scripts/build.ts line 44: the targets `bun build --compile` is run for. */
export const TARGETS = ['darwin-arm64', 'darwin-x64', 'linux-x64', 'linux-arm64'] as const

/** The stack foreman was scaffolded from: .stacks/manifest.json `stack.id`. */
export const SCAFFOLD_STACK = 'typescript-cli'

export const TREE: readonly TreeNode[] = [
  { id: 'commands', label: 'commands/', depth: 0, note: 'flags and help text' },
  { id: 'core', label: 'core/', depth: 0, note: 'worktrees, digests' },
  { id: 'daemon', label: 'daemon/', depth: 0, note: 'socket, lock, client' },
  { id: 'supervisor', label: 'supervisor/', depth: 0, note: 'runs, turns, questions' },
  { id: 'codex', label: 'codex/', depth: 0, note: 'app-server client, pin' },
  { id: 'guide', label: 'guide/', depth: 0, note: 'contract and skill text' },
  { id: 'schemas', label: 'schemas/', depth: 0, note: 'every wire shape' },
  { id: 'errors', label: 'errors.ts', depth: 0, note: 'every tagged error' },
]
