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
