## Slide 2: My tools have two users: me and a coding agent.

All from rr's site fixtures, `~/Projects/rr/site/fixtures/` (rr commit 536948d, read 2026-11-13). They were recorded on 2026-11-02 by `site/scripts/capture-demo.sh`, which runs `rr test` in the OpenData monorepo twice, back to back: once plain (stderr saved as `run.jsonl`), then with `--pretty` (saved as `raw/run.pretty.ansi`, scrubbed to `run.pretty.txt`). The shown lines are copied into `data/fixtures/02-rr-run.json` with their line numbers.

| Figure | Value | Source |
|---|---|---|
| RECORDED | 2026-11-02 | `run.pretty.txt` line 36 (`Logs: ~/.rr/logs/test-20261102-111320`); every event's `ts` in `run.jsonl` |
| Left pane, "What I see" | 10 of the file's 43 lines, in order, with a `…` row where non-blank lines were dropped | `run.pretty.txt` lines 6, 18 to 21, 29 to 32 and 34 |
| Right pane, bytes | 8 consecutive lines, every byte, the escape byte written as `\e`, long lines wrapped at 70 columns | `raw/run.pretty.ansi` lines 6 to 13. `raw/` is gitignored in rr; the eight lines hold no local paths |
| Right pane, JSON events | all 4 lines; the three phase events cut at 70 columns with `…`, the result event wrapped and cut after 7 rows | `run.jsonl` lines 1 to 4 (155 to 2,286 characters each) |
| The command lines | `rr --pretty test`, `rr test` | `site/scripts/capture-demo.sh` lines 60 and 76, with the default task `test` |
| PRETTY_TOTALS (notes) | 6 passed, 2 failed, 8 total, 3 hosts | `run.pretty.txt` lines 34 and 35 |
| EVENT_TOTALS (notes, IF ASKED) | 5 passed, 3 failed, 8 total | `run.jsonl` line 4, `details` |
| MINUTES_APART (notes, IF ASKED: "about half an hour") | 32 | log directories `test-20261102-104112` (JSON run) and `test-20261102-111320` (pretty run) |
| "Without the flag, rr prints JSON events" | claim | `~/Projects/rr/README.md` line 104; `capture-demo.sh` line 60 passes no format flag |
| "The last event lists each failing test" | claim | `run.jsonl` line 4, `details.failures[].tests` (file, name, message) |
| "wrapped in two escape sequences" (notes) | `\e[36m` or `\e[35m` before each key and value, `\e[0m` after | `raw/run.pretty.ansi` lines 9 to 11 |

Departure from the outline, recorded so it is not undone: the outline calls the two files "the same run". They are the same command on the same tree, run twice, and their totals differ (2 failed against 3). The slide's tags name each command, and the notes say why the totals differ. The outline's first card said "spinners and a progress line redrawn on every tick"; the capture was taken through a pipe and holds no redraws, only colour codes (12 escape sequences in 43 lines), so the cards talk about colour codes.
