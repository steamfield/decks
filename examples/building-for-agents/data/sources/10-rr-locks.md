## Slide 10: rr runs each agent's tests on its own machine.

The diagram is a schematic; the result strip is a recording. rr was read at commit 536948d (2026-11-13); the fixtures were last changed in rr commit 9a0dab1 (2026-11-02). Latest rr tag: v0.29.4.

| Figure | Value | Source |
|---|---|---|
| The simulation (`simulate`, `sceneAt`, `flowSteps`, `waitSpans`) | ported unchanged | `~/Projects/rr/site/src/lib/flow.ts`; `data/10-rr-locks.test.ts` compares segments, steps and scenes with the source when `~/Projects/rr` is present |
| Diagram layout | laptop, four agent rows, waiting column, three hosts | wide geometry of `~/Projects/rr/site/src/components/landing/FlowDiagram.tsx`, re-proportioned for the stage |
| FLOW_RUNS, FLOW_HOSTS | four agents; `m4-mini`, `m1-linux`, `m1-mini`; commands, subtask names, "3/3 passed", "86 passed", pids, test percentages | `flow.ts`. Made up by rr's site; covered by the `Schematic` tag |
| STILLS | 0, 3,600, 8,900 and 17,000 ms of simulation time | derived in `data/10-rr-locks.ts` from `flowSteps` and the segments; `data/10-rr-locks.test.ts` asserts what each frame shows |
| POLL_MS (card 2: "every 2 seconds") | 2,000 ms | `~/Projects/rr/internal/cli/loadbalance.go` line 477, `time.NewTimer(2 * time.Second)` |
| "Each rr call is a separate process", "rr has no server", lock on each host | claim | `~/Projects/rr/README.md` line 353: the lock is a directory created atomically under `/tmp` on the remote |
| "A parallel task locks every host" | claim | `flow.ts` header (one worker per host, each holding its lock until the task ends, `internal/parallel`) |
| "tasks the config lists under parallel" | claim | `~/Projects/rr/README.md` lines 234 and 264 to 271: subtasks are named tasks listed under `parallel:` |
| "rsync copies the files and SSH runs the command" | claim | `~/Projects/rr/README.md` line 24 |
| First host it can lock, in config order | claim | `~/Projects/rr/internal/cli/loadbalance.go` (`roundRobinWait`, line 385) and README line 353; `~/Projects/opendata/.rr.yaml` comment: "rr takes the first unlocked host in this order" |
| WAITING_EVENT | `"status":"waiting"` and `"command":"rr test"` | event shape from `loadbalance.go` lines 398 to 407 (`details.holders[].command`) and `~/Projects/rr/plugins/rr/skills/rr/reference/machine-interface.md` line 35; the holder's command is the simulation's, so the label is schematic |
| "Each git worktree syncs to its own remote directory unless the config turns that off" | claim | `~/Projects/rr/README.md` line 330 (`sync.worktree_isolation: false` turns it off); default on in `internal/config/expand.go` line 168 |
| Result event | line 4 of `run.jsonl` | `data/fixtures/10-rr-result.json`, a byte copy of line 4 of `~/Projects/rr/site/fixtures/run.jsonl`; the test checks both the copy and that every quoted line is a substring |
| RUN.recorded | 2026-11-02 | the event's `ts` |
| RUN.shards, passed, failed (notes: eight tasks, five passed, three failed) | 8, 5, 3 | the event's `details.total`, `details.passed`, `details.failed` |
| FAILURE_AT | `src/data/articles/charts-json.test.ts:74` | the event's `details.failures[0].tests[2].file` |
| PARSERS | pytest, Go test, Jest, Vitest | `~/Projects/rr/internal/output/formatters/`: `pytest.go`, `gotest.go`, `jest.go`; `jest.go` line 31 "JestFormatter parses Jest/Vitest test output". The README omits Vitest |
| Notes: OpenData's hosts and `worktree_isolation: false` | mbp, m4-mini, m1-mini | `~/Projects/opendata/.rr.yaml` `hosts:` list and line 67 |
| Notes: "one job per host at a time" | claim | `~/Projects/rr/README.md` line 125 |
| Notes: "two to four agents running at once" | 2 to 4 | `FLAG: author-reported` (Riley). No repo records it |

Not stated, by decision: any rr speedup; "load balanced"; automatic sharding.
