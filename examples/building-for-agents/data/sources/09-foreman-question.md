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
