# building-for-agents: data provenance

Every number, chart and status claim on a slide maps to a real artifact: a repo file, a
recorded run, a published article or a named document. This is the fact-check input.

One section per visible slide, in manifest order. A figure with no source yet carries
`FLAG:` and the sentence that says what to confirm before presenting.

Sibling repos are read from `~/Projects/<repo>`. Sections for slides 2, 3 and 5 to 19 are also kept one per file under `data/sources/`,
where each stage's author wrote them; this file is the merged copy the fact-check reads.

---

## Every slide: product chips

| Figure | Value | Source |
|---|---|---|
| Product order and verbs | Start, Delegate, Test, Watch, Ask, Chart, Present | `OUTLINE.md` section 3 (Riley's decision, 2026-11-13) |
| Stacks language chip | TypeScript · Effect 4 | `~/Projects/stacks/package.json` catalog `"effect": "^4.0.6"`; `bun.lock` pins `effect@4.0.6` |
| foreman language chip | TypeScript · Effect 4 | `~/Projects/claude-codex/package.json` `"effect": "^4.1.2"` |
| rr language chip | Go | `~/Projects/rr/go.mod` |
| StatGlass language chip | Rust + TypeScript | `~/Projects/statglass`: `find crates src-tauri -name '*.rs' \| xargs cat \| wc -l` against `find src \( -name '*.ts' -o -name '*.tsx' \) \| xargs cat \| wc -l` |
| OpenData language chip | TypeScript · Python engine | `~/Projects/opendata/mcp/package.json` (the MCP server) and `opendata/pyproject.toml` (the engine) |
| OpenChart language chip | TypeScript | `~/Projects/openchart/packages/*/package.json` |
| Decks language chip | TypeScript · Vue | this repo, `packages/decks/` |
| Pixel icons | 12x12, one per product | `~/Projects/steamfield/src/data/pixel-icons.ts` (steamfield commit 53a1a06), copied into `data/products.ts` |

## Slide 1: Cover

| Figure | Value | Source |
|---|---|---|
| RIDGE (the cyan line) | 182 daily values, seven-day trailing mean, scaled to its peak | `data/commits.json`, copied 2026-11-13 from `~/Projects/steamfield/src/data/commits.json` (generated 2026-11-01 by `node scripts/data/commits.mjs` in the steamfield repo); smoothing in `data/01-cover.ts` |
| RIDGE_WINDOW in the figure tag | 2026-05-04 to 2026-11-01, and the repo count | `data/commits.json` fields `start`, `end`, `series` |
| Mark geometry | the Steamfield mark | `~/Projects/steamfield/src/components/brand/paths.ts`, copied into `data/brand.ts` |
| Peak in the figure caption | 133 commits a day, the busiest seven-day mean | `RIDGE_WINDOW.peakPerDay` in `data/01-cover.ts`, computed from `data/commits.json` (the site's own caption says 133) |
| Repositories in the caption | 5 | `Object.keys(series).length` in `data/commits.json` |
| Byline | Riley Hilliard · Steamfield · Austin JS · November 2026 | `FLAG: author-reported` (Riley, 2026-11-13) |

Refresh before the talk: rerun `node scripts/data/commits.mjs` in steamfield and copy the file again, so the ridge ends in the talk's own month.

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

## Slide 3: I ship a change with seven tools I built.

Station order, verbs, names, icons and language chips are `data/products.ts` (see "Every slide: product chips").

| Figure | Value | Source |
|---|---|---|
| OPENDATA_TESTS | "about 14,000" | Published figure: `~/Projects/rr/README.md` line 58 ("around 14,000 tests", rr commit 536948d) and `~/Projects/steamfield/src/content/blog/why-steamfield.mdx` line 26 ("about 14,000 tests", steamfield commit 1b001f9). `FLAG:` replace with a collected count before the talk (`pytest --collect-only -q` in `opendata/` and `backend/`, `vitest list` in the TypeScript packages, or the totals of one `rr test` run); the outline's static count on 2026-11-13 was higher |
| "Most started inside OpenData" | claim | `FLAG: author-reported` |
| "Six of the seven use TypeScript" | 6 of the 7 language chips name TypeScript | `TYPESCRIPT_PRODUCTS` in `data/03-thread.ts`, computed from `data/products.ts` |
| "rr is Go" | claim | `~/Projects/rr/go.mod` |
| "StatGlass samples the system in Rust" | claim | `~/Projects/statglass/crates/statglass-collect/src/` (Rust sources, statglass commit 5db8622a) |
| FEATURED | Stacks, foreman, StatGlass | `OUTLINE.md` section 3 (Riley's decision, 2026-11-13) |
| BRIEF_SECONDS (notes: "about ninety seconds each") | 90 | `FLAG: author-reported` (`OUTLINE.md` section 10) |
| "OpenData's engine is Python" | claim | `~/Projects/opendata/pyproject.toml` (see "Every slide: product chips") |
| "Six of the seven are open source; OpenData is open core" (IF ASKED) | claim | `license` fields in `~/Projects/steamfield/src/data/projects.ts` (line 41 for OpenData) |

## Slide 4: Stacks briefs the agent and checks its work.

All from one project, `~/Projects/stacks-tests/tea-dashboard` (not a git repository; read 2026-11-13).

| Figure | Value | Source |
|---|---|---|
| COMMAND | `stacks new sveltekit tea-dashboard` | `.stacks/manifest.json`: `stack.id` is `sveltekit`, `mode` is `new`; the directory name is the project's. `FLAG:` the exact command line typed is not recorded; this is the command that produces this manifest |
| FILES | AGENTS.md, .claude/, .stacks/BRIEF.md, .stacks/manifest.json | `ls -a` in the project |
| BRIEF_WORDS | 4,481 | `wc -w .stacks/BRIEF.md` |
| HANDOFF_PROMPT | "Read .stacks/BRIEF.md and carry it out. It's your full task for this project; you're done when stacks verify passes." | `~/Projects/stacks/packages/cli/src/core/handoff.ts` line 114 (stacks commit a952e96) |
| STEPS | 15 verify steps | `.stacks/manifest.json` `verify[].name`; order from the run records |
| RUNS | failed at 393 s, green at 501 s, green at 623 s | `.stacks/state/runs.jsonl`: `secondsSinceCreated` and `outcome` of each line; all three have `agent: "claude"`, `scope: "full"` |
| First run's failed steps | lint, readme-filled, agents-md-filled, claude-readme-filled, harness-doc-filled (5 of 15) | `.stacks/state/runs.jsonl` line 1, `steps[].status` |
| CLI, RECORDED | stacks 0.5.0, 2026-10-29 | `.stacks/manifest.json` `cli`, `createdAt` |
| "Stacks keeps a hash of the steps outside the project" | claim | `~/Projects/stacks/packages/cli/src/core/verify/tamper.ts`: the manifest's `verifyDigest` plus a state record under the user state dir, keyed by `projectId` |
| "refuses to run if one was edited" | claim | `VerifyChanged` in `~/Projects/stacks/packages/cli/src/errors.ts` (exit 5); `commands/verify.ts` lines 151 to 157 for the refused `--accept-changes` |
| "Stacks makes no model calls and runs nothing from the recipe" (notes) | claim | `~/Projects/stacks/README.md` lines 5 to 17 |
| "Each product started as a tool I needed" (slide 1 notes) | claim | `~/Projects/steamfield/src/content/blog/why-steamfield.mdx`, first paragraph |
| "coding agents run some of them more often than I do" (slide 1 notes) | claim | `~/Projects/steamfield/src/content/blog/design-cli-for-ai-agents.mdx`: "two CLIs that agents call more than people do" (rr and Stacks) |
| Notes: "six thousand for a composed brief" | 6,000 words | `~/Projects/stacks/AGENTS.md` line 126 |

## Slide 5: The Stacks CLI is written with Effect.

All from `~/Projects/stacks/packages/cli` at commit a952e96, read 2026-11-13.

| Figure | Value | Source |
|---|---|---|
| SRC_FILES | 203 | `find src -name '*.ts' \| wc -l` |
| SRC_LINES | 24,386 | `find src -name '*.ts' \| xargs cat \| wc -l` |
| TEST_FILES (notes) | 209 | `find tests -name '*.test.ts' \| wc -l` |
| Tree rows | bin.ts, main.ts, cli.ts, runtime.ts, errors.ts, commands/, services/, platform/, schemas/, core/, tests/ | `ls src` and `ls`; the notes paraphrase `~/Projects/stacks/AGENTS.md`'s architecture map |
| RUNS_COMMAND | `src/commands/runs.ts` lines 8 to 25 | `data/code/05-stacks.ts`, checked by `data/code/excerpts.test.ts` |
| HOST_SERVICE | `src/services/host.ts` lines 29 to 49 | same |
| APP_LAYER | `src/runtime.ts` lines 11 to 19 | same |
| ERROR_TABLE | `src/errors.ts` lines 425 to 443 | same |
| LAYER_TEST | `tests/update.test.ts` lines 250 to 279 | same |
| "bin.ts is the only file allowed to touch Node, and a lint rule enforces that" (notes) | claim | `biome-plugins/boundaries.grit` lines 1 to 40 |
| "There are no module mocks" (notes) | claim | `~/Projects/stacks/AGENTS.md` line 174 |
| "Effect 4, with the CLI module that ships inside the effect package" (notes) | claim | root `package.json` catalog `"effect": "^4.0.6"`; `bun.lock` pins `effect@4.0.6`; imports from `"effect/cli"` in `src/` |
| "runs on Node 22 or newer; Bun builds and bundles it" (notes) | claim | `package.json` `engines`; `scripts/build.ts` lines 34 to 49; `dist/stacks` refuses Bun |

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

## Slide 7: foreman, the session

Read 2026-11-13 from `~/Projects/claude-codex` at commit `9413fa8`. One batch of runs is used for the whole slide: three of the `site-*` runs in `site/fixtures/runs/` (`site-console`, `site-commands`, `site-e2e`), the same three `site/src/pages/index.astro` line 134 passes to `buildSession`. No figure comes from the `fix-*` batch.

| Figure | Value | Source |
|---|---|---|
| The session model (`sceneAt`, `stepAt`, timing constants) | ported | `site/src/data/session.ts`, into `data/07-foreman-session.ts`. Geometry follows `site/src/components/landing/session/SessionCanvas.tsx` |
| Session data (delegates, activity, packets, question) | `data/fixtures/07-foreman-session.json` | written by `bun examples/building-for-agents/data/fixtures/07-foreman-session.gen.mjs <out>`, which calls the site's own `buildSession` over the three run fixtures and `site/fixtures/cli/answer.json` |
| Recorded date in the monitor's tag | 2026-11-06 | `createdAt` of all three runs (`RECORDED`) |
| "timeline shortened" | the 54-second timeline, start order, steer and follow-up are scripted by the site's model | `site/src/data/session.ts` (`activityFor` compresses each recording); in the recordings `site-e2e` was created at 09:47:40 UTC, 23 minutes after `site-console` (09:24:19) and `site-commands` (09:24:25) |
| Delegates | 3 | `DELEGATES`, the three lanes |
| Models on the cards | gpt-astra, gpt-sol, gpt-terra | each run fixture's `model` |
| Command and file counters, latest command | per frame | each run fixture's `events` of kind `command` (under 90 characters) and `files` inside the lane's scope, in recorded order |
| `- May change:` line on each contract | first line of each run's `- May change:` entry, cut to fit | each run fixture's `contract` |
| The held question | q1 of `site-commands`, word for word, cut to four lines | `site/fixtures/runs/site-commands.json` `questions[0].question` |
| Answer delay in the card and the board | 18 seconds | `ANSWER_DELAY_S`: `questions[].t` 31,410 ms (asked) and 49,673 ms (answered) in `site-commands.json`, rounded from 18.263 |
| Worktree path and branch | `.claude/worktrees/<name>`, `foreman/<name>` | `src/core/managed-worktree.ts` lines 117 and 118; each run fixture's `branch` agrees |
| "The one line foreman parses is May change" | claim | `src/core/runs/worktree.ts` line 62 (`line.startsWith("- May change:")`); the contract template in `src/guide/contract.ts` line 39 |
| "foreman never commits" | claim | every recorded contract opens "Leave changes uncommitted and do not push"; the orchestrator commits |
| "Its digest lists any file outside May change" | claim | `src/schemas/daemon.ts` line 256 (`outsideMayChange`); `src/core/runs/digest.ts` line 194 |
| Notes: no API key, Codex login | claim | `README.md` line 5 |
| Notes: the test-writing run asked no question | `site-e2e` has `questions: []` | `site/fixtures/runs/site-e2e.json` |

Departures recorded here: the packet from the daemon to Claude is labelled "wait returns: …" (the site labels it "question q1" and "done"), because foreman sends Claude nothing; the Claude status line is rewritten without the site's arrow glyph. The ambient "events" dots are the model's own and are frozen in a still.

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

## Slide 9: foreman, the held question

Read 2026-11-13 from `~/Projects/claude-codex` at commit `9413fa8`. The sequence diagram is a schematic. The code is quoted through `data/code/09-foreman-question.ts` and checked by `data/code/excerpts.test.ts`.

| Figure | Value | Source |
|---|---|---|
| Storing the call and setting the run waiting | excerpt `HOLD_QUESTION` | `src/supervisor/questions.ts` lines 103 to 146 (shown: 103, 139 to 146) |
| The wake | excerpt `WAKE` | `src/supervisor/registry.ts` lines 114 to 119; awaited by `foreman wait` through `change` (line 545) in `src/supervisor/wait.ts` line 272 |
| The response | excerpt `RESPOND` | `src/supervisor/questions.ts` lines 82 to 97 (shown: 82 to 87, 96, 97) |
| The timeout test | excerpt `TIMEOUT_TEST` | `tests/supervisor-integration.test.ts` lines 6317 to 6333, the test named "defers on the question timeout through TestClock" |
| Method and tool name on the first arrow | `item/tool/call`, `ask_orchestrator` | `src/schemas/codex.ts` lines 36 and 312; `src/supervisor/questions.ts` line 109; registered at `src/supervisor/turns.ts` line 335 |
| Question timeout | 15 minutes | `src/supervisor/turns.ts` line 304, `body.questionTimeoutMs ?? 900_000` (`QUESTION_TIMEOUT_MIN`) |
| "the daemon replies itself: carry on without it" | paraphrase of `deferral` | `src/supervisor/prompts.ts` line 7; sent at `src/supervisor/questions.ts` line 151 |
| Fake app-server | 117 lines | `wc -l tests/fixtures/fake-app-server/main.mjs` |
| The two terminal lines | `question  unit-a q2 (blocked): …`, `next: foreman answer unit-a q2 "<answer>"` | the example in `docs/rfcs/0001-foreman.md` lines 281 to 285, first line cut short. No recorded wait that returned a question is in `site/fixtures/cli/` |
| "Claude wakes when a process exits" | claim | `docs/rfcs/0001-foreman.md`, section "`wait` and how Claude is woken": Claude runs `wait` as a background Bash task and reads its output |
| Notes: a late answer arrives as a steer | claim | `src/supervisor/index.ts` line 266 (`delivery: "steer"`); the deferral text ends "The answer will arrive as a message later." |

Wording: nothing on the slide or in the notes says foreman pushes to or notifies Claude.

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

## Slide 11: StatGlass started as the rr monitor command.

Beats 0 and 1 are a recording; beat 2's cards are illustrative. rr read at commit 536948d, statglass at 5db8622a (both 2026-11-13).

| Figure | Value | Source |
|---|---|---|
| The origin claim (title, notes) | StatGlass came from keeping `rr monitor` open | `FLAG: author-reported` (Riley). Nothing in either repo records it |
| Notes: "a debugging aid", "always open", "why the fans were going at three" | Riley's account | `FLAG: author-reported`, from `OUTLINE.md` section 10, slide 11 |
| Monitor recording | 193 snapshots, 2026-11-02 16:41:08Z to 16:48:56Z, hosts m1-mini, m4-mini, mbp | `data/fixtures/11-monitor.json`: the lines of `~/Projects/rr/site/fixtures/monitor.jsonl` (rr commit 9a0dab1) as one JSON array; the test compares them |
| RECORDED | 2026-11-02 | first snapshot's `timestamp` |
| BUSIEST | frame 111, 281 s into the recording, all three hosts holding a lock | `busiestFrame`, ported from `~/Projects/rr/site/src/lib/monitor/timeline.ts`; the test compares the port's timeline and frame with the source |
| Card readings (CPU, 1m load, RAM, latency, lock command, held time, alias) | per host at frame 111 | the fixture, through `buildTimeline` |
| CPU sparkline dots | 40 characters by 2 braille rows | `sparkline`, ported from `~/Projects/rr/site/src/lib/monitor/render.ts`; drawn as dots like `site/src/components/landing/monitor/Dots.tsx`; the test compares the lit dots with the source |
| Reading colors (cyan, violet, pink at 70 and 90 percent) | thresholds 70 / 90 | `THRESHOLDS` and `severity` in `render.ts` (rr monitor's defaults) |
| "CPU, memory, latency and the command holding the host's lock, read over SSH" | claim | `~/Projects/rr/site/src/components/landing/monitor/MonitorCard.tsx` (ports `internal/monitor/card.go`) |
| HISTORY_SAMPLES | 600 | `~/Projects/rr/internal/monitor/history.go` line 7, `const DefaultHistorySize = 600` |
| HISTORY_MINUTES | 10 | 600 samples at the default interval of 1 s: `~/Projects/rr/internal/config/types.go` line 629 (`Interval: "1s"`) and the comment on `history.go` line 6 |
| "held in memory until rr monitor exits" | claim | `history.go`: `History` is ring buffers behind a mutex, with no persistence |
| RETENTION, AXIS_TICKS | 10 s buckets for 24 h, 1 min through 7 d, 15 min through 30 d | `~/Projects/statglass/README.md` lines 213 to 222. The "1 h" tick is only an axis mark |
| RETENTION_DAYS ("up to 30 days") | 30 | same paragraph, which adds "30 days is not guaranteed"; hence "up to" |
| "a menu bar app for Apple Silicon Macs" | claim | `~/Projects/statglass/README.md` lines 3 and 15 |
| "stores each host's history in SQLite" | claim | `~/Projects/statglass/AGENTS.md` line 34 and `crates/statglass-store/Cargo.toml` |
| Notes: monitors other Macs over SSH | claim | `~/Projects/statglass/README.md` lines 128 to 129 |
| Notes: "It used to be called Kelvo" | claim | `~/Projects/statglass/README.md` line 26 |
| Notes: reads rr's lock file and shows the job | claim | `~/Projects/statglass/crates/statglass-remote/src/rr.rs` (`LOCK_DIR = "/tmp/rr.lock"`, `RrJob`) |
| Notes: size limit, oldest per-process detail removed first | claim | `~/Projects/statglass/README.md` lines 213 to 222 |
| StatGlass cards and menu bar item on beat 2 | the recording's CPU, RAM and GPU histories, in StatGlass's metric colors | Illustrative. Colors follow `~/Projects/steamfield/src/components/home/StatGlassDemo.tsx` (CPU cyan, memory violet, GPU pink). StatGlass did not record these readings |

## Slide 12: StatGlass, the boundary

Read 2026-11-13 from `~/Projects/statglass` at commit `5db8622a` (version 0.12.0, `package.json`).

| Figure | Value | Source |
|---|---|---|
| RUST_LINES | 153,401 | `find crates src-tauri -name '*.rs' -print0 \| xargs -0 cat \| wc -l`. Inline tests included. |
| TS_LINES | 111,644 | `find src \( -name '*.ts' -o -name '*.tsx' \) -print0 \| xargs -0 cat \| wc -l`. Tests and `src/core/generated` included. |
| RUST_PERCENT, TS_PERCENT | 58, 42 | `RUST_LINES / (RUST_LINES + TS_LINES)`, rounded, in `data/12-glass-boundary.ts`. The outline said "about 60". |
| COMMANDS | 92 | `grep -o '__TAURI_INVOKE[<(]' src/core/generated/bindings.ts \| wc -l`; the `collect_commands!` block in `src-tauri/src/lib.rs` (from line 79) lists the same 92. The outline said 81, which is `grep -c '__TAURI_INVOKE("'` and misses the 11 calls written `__TAURI_INVOKE<T>(`. `grep -c __TAURI_INVOKE` prints 93 because it counts the import line. |
| EVENTS | 10 | the `collect_events!` block, `src-tauri/src/lib.rs` lines 143 to 154 |
| "A pre-push hook fails if the file is stale" | | `Makefile` lines 235 to 250 (`bindings`, `bindings-check`) and its help text for `make check` |
| IDLE.cpuPercent | 0.67 (recorded as 0.672) | `plan/competitor-benchmarks.md` line 17; `README.md` line 190. One run, 120 s after a 30 s warm-up, menu bar only with shipped defaults, M3 Max, macOS 27, on AC, 2026-10-07, load average 4.8 to 7.8, before remote monitoring existed, Docker monitoring off. The file's own caveat: "One run each." The app's own target for this state is 0.5 (`AGENTS.md` line 55), which the run misses. |
| IDLE.memoryMb (notes only) | 104.9, said as "about 105" | same row of `plan/competitor-benchmarks.md` |
| IDLE.backgroundTickS (notes only) | 2 s | `README.md` line 184; decision D-094 in `plan/decisions.md` line 3111 |
| Box names and notes | crate and directory names | `AGENTS.md` lines 26 to 40; "one-hour ring" from `crates/statglass-engine/src/lib.rs` line 3; the tray from `src-tauri/src/tray/mod.rs` lines 1 to 19 |
| FRAME_MESSAGE | `{ kind: "frame", values: [ … ], … }` | abridged from the `frame` variant of `LiveMsg`, `src/core/generated/bindings.ts` line 1951; the layout message it depends on is documented at lines 1917 to 1921 |
| Code: `subscribe_live` | lines 75 to 85 | `src-tauri/src/commands.rs`, through `data/code/12-glass-boundary.ts` (drift test) |
| Code: `subscribeLive` | line 150 | `src/core/generated/bindings.ts`, same module |
| Code: `el.animate` | lines 33 to 36 | `src/app/widgets/lib/use-tick-scroll.ts`, same module |
| "d3 computes the path and React renders it as SVG" | | `src/app/widgets` imports `area` and `line` from `d3-shape`; `use-tick-scroll.ts` header comment |
| "A test counts renders" (notes) | | `src/app/stores/live-selectors.test.tsx` lines 7 to 32 |
| "Rust decides what a value means" (notes) | | `.claude/rules/data-boundary.md` line 10, "Rust Owns Meaning, the Client Presents" |
| "Rust stops sending frames with no window visible" (notes) | | `src-tauri/src/live.rs` lines 6 to 9 |
| The widget chart | illustrative | `cpuAt` in `data/12-glass-boundary.ts`, ported from `~/Projects/steamfield/src/lib/statglass-demo.ts` (steamfield commit 1b001f9). Tagged Illustrative on the slide. |

Banned on this slide (checked): "about 60 percent Rust" (it is 58); "81 commands" (it is 92); the idle figure without "one run" beside it; any ratio against Stats (one run each, different modules enabled).

## Slide 13: StatGlass in a browser tab

Read 2026-11-13 from `~/Projects/statglass` at commit `5db8622a`.

| Figure | Value | Source |
|---|---|---|
| DEMO_URL | `https://statglass.steamfield.io/demo/index.html?window=dashboard&scenario=multi-host` | `docs-site/src/lib/demo.ts`: `dashboardDemoUrl` (lines 44 to 56) and `KNOWN_SCENARIOS` (line 38); origin from `docs-site/astro.config.mjs` line 11. Fetched 2026-11-13: 308 to `/demo/?window=dashboard&scenario=multi-host`, then 200, with no frame-blocking header. |
| DEMO_LAYOUT_WIDTH | 1200 CSS px | a deck choice; the dashboard's minimum width is 1024 (`docs-site/src/lib/demo.ts` line 18) |
| "React code calls a Transport interface" with two implementations | | `src/core/transport/contracts.ts` lines 1 to 9; `src/core/transport/native.ts`; `createMockTransport` in `src/core/mock-transport.ts` line 99 |
| "A lint rule bans Tauri imports under src/app" | enforced | `biome.json`: `noRestrictedImports` overrides for `src/app/**`, `src/app/widgets/**` and the `src/app` tests each restrict the group `@tauri-apps/**`. `AGENTS.md` lines 49 to 53 state the rule and say a write hook enforces it too. |
| "Vitest, Playwright, the browser dev server and the docs site demo all use it" | | `src/core/transport/contracts.ts` lines 4 to 5 (dev server, Vitest, Playwright); `docs-site/src/lib/demo.ts` lines 1 to 6 and `docs-site/scripts/build-demo.mjs` (the demo is the app built on its mock transport) |
| Code: the `Transport` interface | lines 121 to 471, trimmed | `src/core/transport/contracts.ts`, through `data/code/13-glass-browser.ts` (drift test) |
| "I can change a screen in a browser without starting the native shell" (notes) | | follows from the dev server using the mock. The outline's stronger "I do most UI work in a browser" is `FLAG: author-reported` and is not in the notes. |

Open decision for Riley: the frame loads the hosted demo, so the beat needs venue network. No copy of the demo build is checked in.

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

## Slide 15: One OpenData result has text and a chart.

The session is the first turn of steamfield.io's scripted OpenData session, copied 2026-11-13 from `~/Projects/steamfield` (commit 1b001f9). The server figures were read 2026-11-13 from `~/Projects/opendata/mcp` (commit d9b5ee7c4).

| Figure | Value | Source |
|---|---|---|
| RECORDED | 2026-11-04 | `steamfield/src/data/opendata-demo.ts` `checked`; the file's header says its figures are "from live queries through the OpenData connector on 2026-11-04" |
| QUESTION | "Are AI data centers driving up electricity bills?" | `steamfield/src/lib/opendata-demo.ts` `QUESTIONS[0]` |
| SEARCH_TERMS, SEARCH_MATCHES | 3 terms, 3 datasets found | `opendata-demo.ts` `searchTerms`, `searchMatches` |
| QUERY_ROWS, QUERY_MS, QUERY_COLUMNS | 51 rows, 11 ms, five columns | `opendata-demo.ts` `pricesQuery.rows.length`, `.ms`, `.columns` |
| PJM_ROWS (two shown in the transcript, eight in the chart) | D.C. 70.3, Maryland 55.2, New Jersey 40.9, Ohio 32.3, Pennsylvania 30.2, Delaware 30.1, Virginia 24.2, West Virginia 17 | `opendata-demo.ts` `pricesQuery.rows` where `grid` is `PJM-core`, in returned order |
| CHART_TITLE | "Bills rose fastest on the PJM grid" | `steamfield/src/lib/figures.ts` line 352 |
| The chart on beat 3 | eight bars, percent change since 2022 | drawn by this deck's `<OpenChart>` from PJM_ROWS. The session's own chart adds a ninth bar, the mean of the other 43 states, which this slide leaves out |
| TOOLS_REGISTERED | 14 | `opendata/mcp/src/tools/index.ts` lines 23 to 36: fourteen register calls, quoted on the slide; each tool file has exactly one `registerAppTool(` call |
| TOOLS_APP_ONLY, TOOLS_FOR_MODEL | 3 and 11 | `grep -l 'visibility: \["app"\]' mcp/src/tools/*.ts`: save-chart-draft, fetch-query-result, publish-figure |
| "on Bun and Hono" | claim | `opendata/mcp/package.json`: `"start": "bun run src/index.ts"`, `"hono": "^4.12.18"` |
| "a Python and DuckDB engine" | claim | `opendata/pyproject.toml` (the engine); `mcp/src/server.ts` line 57, "DuckDB SQL" |
| WORKFLOW instruction line | quoted from its start to "enum values", then cut with … | `opendata/mcp/src/server.ts` line 54, inside `SERVER_INSTRUCTIONS` (lines 52 to 62). The cut drops the rest of the line, which contains a dash (Riley, 2026-11-13) |
| MODEL_ROW_BUDGET (notes) | 60 rows | `opendata/mcp/src/core/constants.ts` line 4; applied in `tools/query-sql.ts` lines 116 to 120 |
| CHART_SAMPLE_ROWS | 120 rows in `_meta` | `opendata/mcp/src/tools/openchart.ts` line 29; sent at lines 417 and 435 to 437 under the key `opendata/chartRows` |
| CHART_MODEL_SAMPLE_ROWS | 24 rows in structuredContent | `openchart.ts` line 32; line 418 |
| "which the host shows only to the interface" | claim | `openchart.ts` lines 26 to 28 and `core/view-data.ts` lines 387 to 392: hosts hand `_meta` to the App and keep it out of model context. The 24-row sample in structuredContent is one "hosts may show the model", so the notes say so |
| CHART_RESOURCE | `ui://opendata/chart` | `openchart.ts`, the tool's `_meta.ui.resourceUri`; listed in `server.ts` line 13 |
| "A React app" | claim | `opendata/mcp/src/mcp-app/main.tsx` imports React; `mcp/package.json` `"react": "19.2.8"` |
| "The host loads it in an iframe" | claim | the MCP Apps host model (`@modelcontextprotocol/ext-apps` 1.7.5 in `mcp/package.json`); `mcp/src/mcp-app/index.html` is the page served for the `ui://` resources |
| Notes: "a few providers are not government agencies" | claim | `FLAG:` from `OUTLINE.md` section 10, slide 15; not re-derived here |
| Notes: "I tune these instructions from transcripts" | claim | `FLAG: author-reported` (`OUTLINE.md` section 10, slide 15, beat 1) |

Departures from the outline: the catalog size (1,046 datasets, 214 providers) is not stated anywhere on the slide or in the notes, so it has no row.

## Slide 16: OpenChart tells the agent which field is wrong.

Read 2026-11-13 from `~/Projects/openchart` (commit 26bd0ba6). The verdict is computed, not recorded: `data/16-openchart.ts` calls `validateSpec` from the installed `@opendata-ai/openchart-engine` when it loads.

| Figure | Value | Source |
|---|---|---|
| README_SPEC | the bar chart spec | `openchart/README.md` lines 26 to 44, as an object. The slide prints `JSON.stringify(spec, null, 2)` with the data rows and the chrome block dropped |
| TYPO | `language` written as `langauge` | this deck's own edit, in the manner of `packages/engine/src/compiler/__tests__/validate-did-you-mean.test.ts` lines 25 to 40 (`revenue` as `reveune`) |
| VERDICT.path | `/encoding/y/field` | `validateSpec(BAD_SPEC).errors[0].path`, at module load |
| VERDICT.code | `DATA_FIELD_MISSING` | `validateSpec(BAD_SPEC).errors[0].code`, at module load |
| VERDICT.suggestion | Use one of the available data columns: language, popularity. Did you mean "language"? | `validateSpec(BAD_SPEC).errors[0].suggestion`, at module load |
| FIXED | valid, 0 errors | `validateSpec(README_SPEC)`, at module load |
| "by edit distance" | claim | `openchart/packages/engine/src/compiler/validation/helpers.ts` (the did-you-mean helper) |
| ENGINE_VERSION | 9.0.0 | this repo's `package.json` pins `@opendata-ai/openchart-engine` 9.0.0; every `openchart/packages/*/package.json` says 9.0.0 |
| PACKAGES: core | 13,668 lines | `find packages/core/src -name '*.ts*' -not -path '*__tests__*' -not -name '*.test.*' \| xargs cat \| wc -l` |
| PACKAGES: engine | 50,369 lines | the same command on `packages/engine/src`. The outline said 50,097 |
| PACKAGES: vanilla | 42,424 lines | the same command on `packages/vanilla/src` |
| PACKAGES: react | 2,639 lines | the same command on `packages/react/src` |
| PACKAGES: vue | 2,502 lines | the same command on `packages/vue/src`. `.vue` files are not matched by the glob |
| PACKAGES: svelte | 864 lines | the same command on `packages/svelte/src`. `.svelte` files are not matched by the glob; the two wrappers hold 1,339 lines of `.vue` and `.svelte` between them |
| REACT_SHARE (notes) | 5 percent | 2,639 / 50,369, rounded, computed in the data module |
| MARKS (notes) | 19 | entries of `MARK_TYPES` in `packages/core/src/types/spec.ts` lines 3486 to 3506. Two comments in the repo say 16 |
| VALIDATOR_LINES (notes: "about thirty-four hundred") | 3,369 | `find packages/engine/src -path '*validat*' -not -path '*__tests__*' -name '*.ts' \| xargs wc -l` |
| Notes: "no schema library behind it" | claim | the validator's files import only relative modules and `@opendata-ai/*` |
| Notes: JSON Schema generated from the types, checked in CI | claim | `openchart/package.json` scripts `generate:schema` and `check:generated`; `.github/workflows/ci.yml` lines 44 to 46 |
| "Drawing is a separate package from the engine" | claim | `openchart/README.md` lines 126 to 128: core and engine are "(no DOM)", vanilla is "DOM rendering" |
| Notes: vanilla can render SVG on a server | claim | `openchart/README.md` line 159: `renderStaticSVG` from `@opendata-ai/openchart-vanilla/static`, "No browser or DOM shim is required" |
| Notes: wrappers sit on vanilla | claim | `packages/{react,vue,svelte}/package.json` each depend on core, engine and vanilla |
| Role labels in the package list | types and theme; computes layout; draws to the DOM; wrapper | `openchart/README.md` lines 126 to 128, shortened |

## Slide 17: A Decks hook blocks AI-sounding sentences.

Everything on this slide is computed at build time from files in this repository (read 2026-11-13, commit 811fe91).

| Figure | Value | Source |
|---|---|---|
| The code on beat 0 | this stage's `useStage` call | `components/DecksStage.vue`, the lines between its `excerpt:start` and `excerpt:end` comments, read with a `?raw` import of the file itself |
| DENIAL | the write, the hook command, `deny`, and the hook's lines | `site/fixtures/hook-denial.json`, imported directly. `site/scripts/capture-hook.mjs` wrote it by sending the write hook one planted line; `site/src/content-drift.test.ts` reruns the hook and fails if the answer changes. The pane's tag says "test input" |
| DENIAL_RECORDED | 2026-11-02 | `git log -1 --format=%ad --date=short -- site/fixtures/hook-denial.json` (commit 09198b7). The fixture itself carries no date |
| DENIAL_RULES | banned-phrase, ai-vocab | the fixture's `rules` |
| PATTERNS | 27 | rows of `packages/decks/lint/ai-rhetoric-patterns.tsv`, parsed as `loadPatterns` in `packages/decks/lint/scan.mjs` parses them; computed at build |
| DENIED | 5 | the rows whose severity is `error`: em-dash, banned-phrase, not-just-reveal, ai-vocab, inflated-significance. The file's header says the write hook denies an error row |
| Notes: 22 warnings | 22 | PATTERNS minus DENIED |
| SOURCED_FIGURES | computed at build | distinct table rows (header and separator rows left out) in `data-sources.md` and `data/sources/*.md`. It counts every table row, including claim rows and the banned-content table once that exists |
| "a Vue component on a GSAP timeline" | claim | `packages/decks/story/easings.ts` exports `gsap`; `useStage` in `packages/decks/story/stage.ts` |
| Notes: the engine count in the outline against the derived one | 50,097 and 50,369 | `OUTLINE.md` line 545; `data/16-openchart.ts` PACKAGES |

Left out: the outline's note that the drafting agent "was refused more than once". No denial was recorded during this build.

## Slide 18: The seven tools share most of six habits.

One row per lit cell. Every file was opened on 2026-11-13 at: stacks a952e96, foreman (`~/Projects/claude-codex`) 9413fa8, rr 536948d, statglass 5db8622a, opendata d9b5ee7c4, openchart 26bd0ba6, decks 811fe91. Paths are under `~/Projects/<repo>`, or this repository for Decks. `data/18-habits.ts` holds the same list.

| Habit | Product | Cell prints | Source |
|---|---|---|---|
| Output a program can parse | Stacks | `--json` | `stacks/packages/cli/src/commands/schema.ts` line 38 (`stacks schema`); `docs/reference/output.md` line 60 |
| Output a program can parse | foreman | `--json` | `claude-codex/README.md` line 67 ("All commands accept `--json`") |
| Output a program can parse | rr | JSON events | `rr/README.md` line 104 ("Output is structured by default") |
| Output a program can parse | StatGlass | `--json` | `statglass/crates/statglass-cli/src/cli.rs` lines 297 to 315 (`statglass schema`) |
| Output a program can parse | OpenData | `outputSchema` | `opendata/mcp/src/tools/query-sql.ts` line 75; 14 files under `mcp/src/tools/` set one |
| Output a program can parse | OpenChart | JSON Schema | `openchart/packages/core/package.json` lines 29 to 32 (the `./schema` exports) |
| The next step is printed | Stacks | `next` | `stacks/packages/cli/tests/errors.test.ts` lines 373 to 380 |
| The next step is printed | foreman | `next:` `or:` | `claude-codex/src/core/command-output.ts` lines 171 to 172. These end a command's result, not its error |
| The next step is printed | rr | suggestion | `rr/internal/errors/errors.go` lines 29 to 49; `README.md` line 118 |
| The next step is printed | StatGlass | `next` | `statglass/crates/statglass-cli/src/failure.rs` lines 123 to 125 |
| The next step is printed | OpenData | Retry after | `opendata/mcp/src/tools/error.ts` lines 30 to 53 |
| The next step is printed | OpenChart | suggestion | `openchart/packages/engine/src/compiler/validation/helpers.ts` lines 91 to 96 |
| Every exit code is documented | Stacks | 5 = report | `stacks/packages/cli/docs/reference/output.md` lines 70 to 83 |
| Every exit code is documented | foreman | 7 = not found | `claude-codex/README.md` lines 119 to 134 |
| Every exit code is documented | StatGlass | 6 = ask user | `statglass/crates/statglass-cli/src/cli.rs` lines 20 to 22 |
| A command checks the work | Stacks | verify | `stacks/packages/cli/README.md` line 35 |
| A command checks the work | foreman | contract | `claude-codex/src/guide/contract.ts` lines 57 to 62 (the contract template lists the commands that must pass) |
| A command checks the work | Decks | check, lint | `packages/decks/scripts/deck.mjs` lines 16 to 18 |
| Several agents can run it | foreman | worktrees | `claude-codex/README.md` lines 3 and 73 |
| Several agents can run it | rr | host locks | `rr/internal/lock/lock.go` line 103; `README.md` lines 24 and 86 |
| Several agents can run it | Decks | free ports | `packages/decks/scripts/deck.mjs` lines 180 to 196 |
| Docs ship with the tool | Stacks | guide | `stacks/packages/cli/README.md` lines 46 to 59 (`stacks guide`, `stacks skill install`) |
| Docs ship with the tool | foreman | guide | `claude-codex/README.md` lines 31 to 33 |
| Docs ship with the tool | rr | plugin skill | `rr/plugins/rr/skills/rr/SKILL.md`; `rr/.claude-plugin/marketplace.json` |
| Docs ship with the tool | StatGlass | guide | `statglass/crates/statglass-cli/src/guide.rs` line 8 and `src/skill.rs` line 10 (`include_str!`) |
| Docs ship with the tool | Decks | decks init | `packages/decks/scripts/deck.mjs` lines 8 to 9; `packages/decks/agent/` |

| Figure | Value | Source |
|---|---|---|
| LIT_CELLS | 26 | `data/18-habits.ts`, the count of rows above |
| AGENTS_AT_ONCE (notes: "two to four agents at a time") | 2 to 4 | `FLAG: author-reported` (`OUTLINE.md` section 11) |
| Counts on the cards (six, six, three, five) | lit cells per row | computed in `HabitsStage.vue` from `HABITS` in `data/18-habits.ts` |
| "None of them calls a model" | claim about the six habits, not about the products | each habit's sources above are flags, fields, exit codes, locks and bundled text |

Cells the outline lists that are left unlit, with the reason (also in `data/18-habits.ts`):

| Habit | Product | Why it is dark |
|---|---|---|
| Every exit code is documented | rr | rr returns the remote command's exit code unchanged (`rr/docs/configuration.md` lines 417 to 419). Its codes are the string `error.code` |
| A command checks the work | OpenChart | `validateSpec` is an imported function (`openchart/packages/engine/src/compiler/validate.ts` line 298); the repo ships no command for it |
| Several agents can run it | Stacks | the state record outside the project guards verify steps against edits; nothing found is about two agents in one project |
| Docs ship with the tool | OpenChart | `llms.txt` is at the repo root; the published package's `files` are `dist` and `schema` (`openchart/packages/core/package.json` lines 34 to 37) |

Departures from the outline: row labels and cards were rewritten to PROSE.md (plain statements). The second row is "The next step is printed" (the outline's "Errors name the next step"), because foreman's `next:` lines end results. The sixth is "Docs ship with the tool" (the outline's "in the binary"), because rr's skill ships as a plugin in its repo and Decks' rules ship in its package. The outline's "None of these tools calls a model" was not checked across seven repos; the last card makes the claim about the habits.

## Slide 19: Close

| Figure | Value | Source |
|---|---|---|
| SITE | https://steamfield.io | the studio's home page; `~/Projects/steamfield/AGENTS.md` overview |
| INSTALL | `npm install -g @steamfield/stacks`, `npm install -g @steamfield/foreman`, `brew install rileyhilliard/tap/rr` | `~/Projects/steamfield/src/data/projects.ts` lines 99, 154 and 117 (steamfield commit 1b001f9, read 2026-11-13) |
| PRODUCT_COUNT in the lede | Seven | `PRODUCTS.length` in `data/products.ts` |
| OPEN_SOURCE ("most of them open source"; notes: "six of them") | 6 of 7 | `license` fields in `~/Projects/steamfield/src/data/projects.ts`: Apache-2.0 or MIT for six, "Open core" for OpenData (line 41) |
| Event, month, speaker | Austin JS, November 2026, Riley Hilliard, Steamfield | `BYLINE` in `data/01-cover.ts` (`FLAG: author-reported`) |
| Adapters for Claude Code, Codex, OpenCode and Cursor (IF ASKED) | claim | `~/Projects/stacks/packages/cli/README.md` line 59 |

---

## Numbers refresh (2026-11-13)

Every value above was read on 2026-11-13. Rerun each command in the week of the talk.

## Banned on-slide content (checked)

| Item | Why | Status |
|---|---|---|
| a figure with no row above | Nothing on a slide is unsourced | absent |
| "Stacks is a Bun CLI" | The published CLI runs on Node and refuses Bun; Bun builds it | absent |
