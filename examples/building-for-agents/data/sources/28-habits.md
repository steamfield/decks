## Slide 28: Each tool has some of the same six habits.

One row per lit cell. Every file was opened on 2026-11-13 at: stacks a952e96, foreman (`~/Projects/claude-codex`) 9413fa8, rr 536948d, statglass 5db8622a, decks 811fe91. Paths are under `~/Projects/<repo>`, or this repository for Decks. `data/28-habits.ts` holds the same list.

| Habit | Product | Cell prints | Source |
|---|---|---|---|
| Output a program can parse | Stacks | `--json` | `stacks/packages/cli/src/commands/schema.ts` line 38 (`stacks schema`); `docs/reference/output.md` line 60 |
| Output a program can parse | foreman | `--json` | `claude-codex/README.md` line 67 ("All commands accept `--json`") |
| Output a program can parse | rr | JSON events | `rr/README.md` line 104 ("Output is structured by default") |
| Output a program can parse | StatGlass | `--json` | `statglass/crates/statglass-cli/src/cli.rs` lines 297 to 315 (`statglass schema`) |
| The next step is printed | Stacks | `next` | `stacks/packages/cli/tests/errors.test.ts` lines 373 to 380 |
| The next step is printed | foreman | `next:` `or:` | `claude-codex/src/core/command-output.ts` lines 171 to 172. These end a command's result, not its error |
| The next step is printed | rr | suggestion | `rr/internal/errors/errors.go` lines 29 to 49; `README.md` line 118 |
| The next step is printed | StatGlass | `next` | `statglass/crates/statglass-cli/src/failure.rs` lines 123 to 125 |
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
| LIT_CELLS | 22 | `data/28-habits.ts`, the count of rows above |
| AGENTS_AT_ONCE (notes: "two to four agents at a time") | 2 to 4 | `FLAG: author-reported` (`OUTLINE.md` section 11) |
| Counts on the cards (four, four, three, five) | lit cells per row | computed in `HabitsStage.tsx` from `HABITS` in `data/28-habits.ts` |
| "None of them calls a model" | claim about the six habits, not about the products | each habit's sources above are flags, fields, exit codes, locks and bundled text |

Cells the outline lists that are left unlit, with the reason (also in `data/28-habits.ts`):

| Habit | Product | Why it is dark |
|---|---|---|
| Every exit code is documented | rr | rr returns the remote command's exit code unchanged (`rr/docs/configuration.md` lines 417 to 419). Its codes are the string `error.code` |
| Several agents can run it | Stacks | the state record outside the project guards verify steps against edits; nothing found is about two agents in one project |

Departures from the outline: row labels and cards were rewritten to PROSE.md (plain statements). The second row is "The next step is printed" (the outline's "Errors name the next step"), because foreman's `next:` lines end results. The sixth is "Docs ship with the tool" (the outline's "in the binary"), because rr's skill ships as a plugin in its repo and Decks' rules ship in its package. The outline's "None of these tools calls a model" was not checked across the product repos; the last card makes the claim about the habits.
