# RFC 0001: Tooling that works with parallel agent runs

Status: Draft. Item 1 landed in `29bea71`.

## Problem

The repo's commands assume one person working in one checkout with one dev server. Deck builds now run as several Codex agents at once, each in its own worktree under `.claude/worktrees/`, so the tooling has to handle several checkouts and several dev servers side by side. Today it doesn't, and the failures are quiet: tests that pass by accident, dev servers that collide, and test files nobody runs.

## Evidence (texas-2026)

1. `bun run test` on main ran 941 tests instead of 324. Vitest's positional filters (`packages/decks/story` and so on) match substrings, so every worktree's copy of the suite ran too. That makes an unfinished agent run able to fail main's gate. Fixed by excluding `.claude/worktrees/**` in `vitest.config.ts`.
2. The design run stopped to ask what to do because port 3030 was taken by an unrelated server, and `bun run shot` assumes 3030. Every later contract had to hand-assign a port to each run (3040–3045).
3. The design run wrote `decks/texas-2026/styles/tokens.test.ts`, a browser regression test, but `bun run test` lists fixed paths and never discovers tests under `decks/`. It only runs when someone remembers the separate command.
4. The theme contrast test enrolls themes by a hard-coded list in `packages/decks/theme/theme.test.ts`. A new deck's `theme.json` is unchecked until someone edits that test, and the design run had to widen its own scope to do it.
5. `bun run fact-extract texas-2026` failed because the command takes the alias (`tx26`), not the directory name. Two runs lost a command to this.

## Proposal

1. Done: exclude agent worktrees from vitest.
2. Make `bun run shot` and `bun run snap` take the deck alias, the way `decks shot <alias>` already does. When no `--port` is given, find a free port (`freePort` already exists in `deck.mjs`) and start or reuse a server for that deck. Have `bun run dev` print the port it chose. Agents then never need a port assigned.
3. Add `decks/*/**/*.test.ts` and `examples/*/**/*.test.ts` to the test script, or move the test script to a vitest `include` list in the config, so deck-local tests are always discovered.
4. Have the theme contrast test discover every `theme.json` next to a registered deck in `decks.json`, so a new deck is checked automatically.
5. Have deck commands accept either the alias or the deck directory name, and say which one matched.

## Scope

`vitest.config.ts`, `package.json` scripts, `packages/decks/scripts/deck.mjs`, `shot.mjs`, `snap.mjs`, `packages/decks/theme/theme.test.ts`, and the command docs in `AGENTS.md`.

## Open questions

- Should the shorthand `bun run shot <n>` keep working against a server already on 3030, for humans who have one open? Probably yes, as the fallback when no alias is given.
