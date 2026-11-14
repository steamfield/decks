## Slide 14: StatGlass, the agent CLI

Read 2026-11-13 from `~/Projects/statglass` at commit `5db8622a`. The session on the slide is illustrative and tagged so; its parts are sourced below.

| Figure | Value | Source |
|---|---|---|
| SUBCOMMANDS | guide, hosts, now, metrics, history, events, top, doctor, schema, skill (10) | the `Command` enum in `crates/statglass-cli/src/cli.rs` |
| NOW_COMMAND, HISTORY_COMMAND, EVENTS_COMMAND | | flags from the same enum (`now --all`, `history <series> --host --since`, `events --host --since`, global `--json`); `--since 3h` is the help text's own example |
| HISTORY_TEXT | three lines, including `gap 14:31 to 14:37: host offline` | exact stdout asserted by `history_agent_text_matches_the_rfc_shape`, `crates/statglass-cli/tests/cli.rs` lines 321 to 349. The test passes `--from 13:00 --to 16:00`; the slide's command uses `--since 3h`. |
| NOW_ANSWER | made-up values (41.2 and 6.3 percent, ages, the id `2a7e`) | shape from `NowAnswer`, `NowHost`, `HostRef`, `Freshness`, `Reading` in `crates/statglass-query/src/answer.rs` lines 97 to 153; the id `8c1f` and the timestamp format from `crates/statglass-query/src/tests.rs` lines 16 to 21 and 88. Printed as one line by the CLI (`crates/statglass-cli/src/main.rs` line 39); wrapped at 100 columns on the slide. |
| BUSY_ENVELOPE | `{"error":{"tag":"Busy","message":"StatGlass is busy; retry shortly.","retryable":true,"next":"retry in a second"}}` | the value asserted by `cli_envelope_shape`, `crates/statglass-query/src/tests.rs` lines 383 to 399 |
| "StatGlass stores gaps explicitly" (notes) | | `AGENTS.md` line 54: "Gaps are explicit; never interpolate." |
| "over a local socket" (notes) | | `plan/rfc-agent-cli.md` lines 96 to 103 and 172 (`cli/query.sock`) |
| RFC_SIZES.compiledTsBinaryMb | 55 to 60 MB per architecture, an estimate ("about") | `plan/rfc-agent-cli.md` lines 106 to 109, quoted on the slide through `data/code/14-glass-cli.ts` (drift test) |
| RFC_SIZES.appMb | 36 MB | same lines |
| RFC_SIZES.helperBinaryKb | 550 KB, the helper binary beside the CLI | same lines. It appears only inside the quote and in IF ASKED. |
| "The RFC defers an MCP server and says it could be a TypeScript package" (notes) | | `plan/rfc-agent-cli.md` lines 365 to 375 |
| "The Stacks CLI's errors have the same tag, retryable and next fields" (notes) | | this deck's `data/code/05-stacks.ts`, `LAYER_TEST` (`packages/cli/tests/update.test.ts` in stacks) |

Banned on this slide (checked): any size for the CLI's own binary (the RFC gives none and none was measured); "a compiled TypeScript binary came to about 55 MB" (the RFC's figure is an estimate of 55 to 60).
