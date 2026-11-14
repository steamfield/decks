## Slide 6: Stacks output differs for people and agents.

The three panes were recorded for this deck on 2026-11-13 with the installed `stacks` 0.7.0 (`stacks --version`), in a scratch project made with `stacks new typescript-cli proj --sandbox --no-launch --offline` and never built. `stacks verify` was then run three times there with `DO_NOT_TRACK=1`, stdout and stderr captured separately. The lines shown are in `data/fixtures/06-stacks-verify.json`. Other sources are `~/Projects/stacks/packages/cli` at commit a952e96.

| Figure | Value | Source |
|---|---|---|
| RECORDED, CLI | 2026-11-13, stacks 0.7.0 | the capture date; `stacks --version` |
| PERSON pane | 7 lines of the 192-line report; colour codes become the row's colour | `env -u CLAUDECODE -u AI_AGENT -u CLAUDE_CODE -u CI script -q <file> stacks verify` (a pseudo-terminal) |
| AGENT pane | 2 of 23 stderr lines, 4 of 185 stdout lines; no colour codes in the capture | `CLAUDECODE=1 stacks verify >out 2>err` |
| SCRIPT pane | the first 44 of stdout's 15,886 characters; the first 211 of the 1,148-character envelope that ends stderr's 45 lines | `stacks verify --json >out 2>err` |
| Totals in the panes | 6 passed, 16 failed, 0 skipped | the report's first line in each capture |
| VERIFY_EXIT | 5 | `$?` after each of the three runs |
| How rows are fitted | long lines wrap between words; step rows are cut with `…`; a lone `…` row stands for dropped lines; JSON rows are broken by hand and checked against the capture at build time | `data/06-stacks-output.ts` |
| AUDIENCE_RULE (first card) | human only when stdout is a TTY, no agent is detected and CI is unset; otherwise agent; `--json` wins | `src/services/output.ts` lines 24 to 32 |
| AGENT_MARKERS | CLAUDECODE, CODEX_SANDBOX, OPENCODE, CURSOR_AGENT, AI_AGENT (5 of the 10 markers, one per agent plus the cross-agent one) | `src/config.ts` lines 62 to 73 |
| "prints no colour codes and no live step output" | claim | the AGENT capture: stderr is one `> step` line per step; the terminal capture streams each step's output |
| "The error envelope is the last line of stderr" | claim | the SCRIPT capture; `tests/errors.test.ts` lines 373 to 380 |
| EXIT_CODES | 0, 1, 2, 3, 4, 5, 6, 130 with the opening words of each "Next action" | `docs/reference/output.md` lines 70 to 83 |
| "a published code never changes meaning" (notes) | claim | `docs/reference/output.md` line 72 |
| "`stacks schema` prints the JSON Schema for every shape" (notes) | claim | `docs/reference/output.md` line 60 |
| Exit 6 causes (IF ASKED) | `PermissionDenied`, `UpdateFailed`; `--accept-changes` under an agent | `docs/reference/output.md` line 81; `src/commands/verify.ts` line 155 |

Departures from the outline: the panes are three runs of one command in one project (the totals match; the elapsed time differs by a tenth of a second), recorded in a scratch project and not in tea-dashboard, so that project's run record is untouched. The exit strip shows all eight rows of the table, including 1, which the outline left out. Titles, cards and notes were rewritten to PROSE.md. The second card says "no colour codes and no live step output" where the outline said "drops colour and progress", because the agent rendering still prints one `> step` line per step.
