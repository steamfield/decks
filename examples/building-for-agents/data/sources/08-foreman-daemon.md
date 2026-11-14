## Slide 8: foreman, the daemon

Read 2026-11-13 from `~/Projects/claude-codex` at commit `9413fa8`. The diagram is a schematic; every label on it is from the file named here.

| Figure | Value | Source |
|---|---|---|
| Socket path | `~/.foreman/foreman.sock` | `src/daemon/server.ts` line 57 (`path.join(options.dataDir, "foreman.sock")`); default home `~/.foreman` at `src/config.ts` line 88, overridable with `FOREMAN_HOME`; passed as `dataDir` at `src/commands/daemon.ts` line 145 |
| Frames | request `{ id, body }`, response `{ id, result }` or `{ id, error }` | `src/schemas/daemon.ts` lines 321, 395, 396 |
| Newline-delimited JSON | one JSON document per line | `src/daemon/protocol.ts` line 15 (`Stream.splitLines`), `src/daemon/server.ts` line 154 (`${json}\n`) |
| The CLI starts the daemon when the socket is missing | claim | `src/daemon/client.ts` lines 120 to 133: `open` fails with ENOENT, ECONNREFUSED or ECONNRESET (`absent`, line 21), then `spawn(options)`, then retry |
| Idle exit | 30 minutes | `src/daemon/server.ts` line 194, `options.idleLimitMs ?? 1_800_000` (`IDLE_EXIT_MIN`) |
| Notes: one daemon per home, exclusive SQLite transaction | claim | `src/daemon/lock.ts` lines 16 and 27 (`daemon.guard.sqlite`, `BEGIN EXCLUSIVE`) |
| Codex command | `codex app-server --listen stdio://` | `src/codex/client.ts` line 59 |
| JSON-RPC methods | `thread/start`, `turn/start`, `turn/steer` | `src/schemas/codex.ts` lines 21, 24, 25 |
| "One Codex process serves every run", "routed by thread id" | claim | `src/supervisor/app-server.ts` (one `AppServer` per generation, line 181); `src/supervisor/index.ts` line 107 (`route` finds the run whose `record.threadId` matches) |
| Pinned Codex version, schema file count | 0.166.0, 467 | `src/codex/protocol.ts` lines 10 to 14 (`supportedCodex`); hash `1285d9e9…` |
| "foreman doctor reports a mismatch" | claim | `src/codex/check.ts` line 37, `src/core/doctor.ts` line 199, `src/commands/doctor.ts` line 38 (`Protocol matches:`) |
| Compiled targets | darwin-arm64, darwin-x64, linux-x64, linux-arm64 | `scripts/build.ts` line 44; `--compile` at line 23 |
| Tree rows | `commands/`, `core/`, `daemon/`, `supervisor/`, `codex/`, `guide/`, `schemas/`, `errors.ts` | `ls src` |
| Lines of TypeScript in the tree's root label and the notes | 9,189 | `find src -name '*.ts' ! -name '*.test.ts' \| xargs cat \| wc -l` |
| Notes: commits and dates | 111, 2026-11-05 to 2026-11-07 | `git rev-list --count HEAD`; first and last commit dates from `git log` |
| Notes: scaffolded from the Stacks typescript-cli stack | `typescript-cli` | `.stacks/manifest.json` `stack.id` |
| Notes: no SDK | claim | `package.json` has no `dependencies`; the client in `src/codex/client.ts` speaks JSON-RPC itself |

Not used: the outline's "44 test files". `find src tests -name '*.test.ts' \| wc -l` gives 40; 44 counts every `*.test.ts` outside `site/` and `node_modules/`. Neither is on the slide or in the notes.
