# Repo-only references in the agent setup

Every reference in the repo's `.claude/` agent, skills and rules (and `tools/`, `.claude/hooks/`) that only works inside the Decks repo, and what `decks init` ships instead. `scripts/render-agent.mjs` applies the mappings; a reference with no mapping fails the render, so this table and the renderer cannot drift apart silently.

Mapping kinds:

- **CLI**: a `decks` subcommand, rendered as `{{decks}} <cmd>`. `init` fills `{{decks}}` with `bunx -p slidev-addon-decks decks` when the project has a bun lockfile, else `npx -p slidev-addon-decks decks`.
- **Exemplar**: a deck bundled under `agent/exemplars/`, rendered as `{{exemplars}}/<deck>` (`node_modules/slidev-addon-decks/agent/exemplars/<deck>`).
- **Variable**: `{{decksDir}}` (from the project's `decks.json`, default `decks`) or `{{pkg}}` (the installed package, `node_modules/slidev-addon-decks`).
- **Delete**: wrapped in `<!-- decks:repo-only -->…<!-- /decks:repo-only -->` in the source and dropped on render; where the passage needs different wording in a user project, a `<!-- decks:user: … -->` comment right after it carries that wording.

Files: A = `agents/deck-author.md`, BD = `skills/building-a-deck/SKILL.md`, FC = `skills/fact-checking-a-deck/SKILL.md`, DP = `rules/deck-patterns.md`, DW = `rules/deck-writing.md`, DD = `rules/deck-data.md`, SS = `rules/story-stage.md`, PP = `rules/prose-patterns.md`, PG = `rules/project-glossary.md`.

## Commands

| Reference | Where | Kind | Rendered as |
|---|---|---|---|
| `bun run new <alias> <dir> [--story] …` | A, BD, DP | CLI | `{{decks}} new …` |
| `bun run dev <alias>` | BD, DP | CLI | `{{decks}} dev <alias>` |
| `bun run build <alias>` | A, BD, DP, SS | CLI | `{{decks}} build <alias>` |
| `bun run build:all` | BD (definition of done 2) | Delete | Repo-only: it gates a change to `packages/decks/`. `decks build --all` exists, but a user's deck work doesn't need it. |
| `bun run export <alias>` | BD, DP | CLI | `{{decks}} export <alias>` |
| `bun run list` | BD | CLI | `{{decks}} list` |
| `bun run check` | A, BD, DP, SS | CLI | `{{decks}} check` (manifest drift plus `decks lint` errors) |
| `bun run lint` | A, BD, DP, DW | CLI | `{{decks}} lint`, which also covers story `COPY`; the user wording says so where the repo text splits lint and test |
| `bun run test` (story guards, `COPY` lint) | A, BD, SS | Delete + CLI | The `COPY` lint half is `{{decks}} lint`. The beats/clicks/durations/frame-units/vt-names guards are vitest suites that don't ship; user text says to keep `clicks:` in step by hand and confirm with `shot` |
| `bun run typecheck` | A, BD, SS | Delete | A user project has no repo `tsc` config to run |
| `bun run shot <n> [clicks]` | A, BD, SS | CLI | `{{decks}} shot <alias> <n> [clicks]` (the package CLI takes the alias) |
| `bun run snap <dir> [port]` | A, BD, SS | CLI | `{{decks}} snap <alias>`, reframed as a before/after walk for a theme or styles change |
| `bun run snap:diff <a> <b>` and the pitch noise-floor frames | BD, SS | Delete | No `decks` subcommand; pixel parity is a repo refactor gate |
| `bun run fact-extract <alias>` | BD, DD, FC, DP | CLI | `{{decks}} fact-extract <alias>` |
| `bun tools/content-fact-extract.mjs <deck-dir>` | FC | Delete | Covered by `{{decks}} fact-extract <alias>` |
| `bun run test:hooks`, `bun run test:embed` | AGENTS.md only | n/a | Not in the agent setup |

## Decks and exemplars

| Reference | Where | Kind | Rendered as |
|---|---|---|---|
| `examples/agent-experience` (and `pages/01-cover.md`, `10-closing.md`, `03-interview.md`, `components/AxErrorCards.vue`) | A, BD, DP, DW | Exemplar | `{{exemplars}}/agent-experience/…`, a copy with brand, cover, byline and QR neutralized |
| `examples/opendata-pitch` as the story reference | A, BD, DP, SS | Exemplar | `{{exemplars}}/tides` (copy of `examples/tides`, the RFC's story exemplar) |
| `examples/opendata-pitch/data-sources.md` | BD | Exemplar | `{{exemplars}}/tides/data-sources.md` |
| `` `opendata-pitch` `` in a claim that holds for tides | DP (story slides), DW (word-budget note) | Exemplar | `` `tides` `` |
| `opendata-pitch` builds cover and close from `StoryCover` | DP | Delete + user wording | "`tides` builds its cover out of `StoryCover`" (tides has no close slide) |
| `examples/opendata-pitch/data/isbe-files.ts` provenance header | DD | Delete + user wording | The header stays as an inline example; the pointer goes to `{{exemplars}}/tides/data/` |
| `examples/opendata-pitch/theme.json`, `examples/od-templates/theme.json` | DP | Delete + user wording | `{{exemplars}}/agent-experience/theme.json` (brand-only override) |
| `opendata-pitch` design-review anecdote (17 categories, seven weeks) | DW | Delete + user wording | "one of the decks this package was extracted from" |
| `examples/od-templates/`, `examples/od-story-templates/` galleries | A, DP, SS | Delete | Not bundled |
| `decks/`, `decks/<dir-name>/`, `decks/*/…` | A, BD, DP, DW, DD, SS, PG, PP | Variable | `{{decksDir}}/…` |
| `examples/` beside `decks/` ("files under `examples/` or `decks/`") | A, BD, DW | Variable | `{{decksDir}}/` |
| `paths:` frontmatter globs on `examples/…` and `packages/decks/…` | DP, DW, DD, SS, PP, PG | Delete | Dropped; the `decks/…` globs become `{{decksDir}}/…` |
| "in this repo", "the repo root", "a file in the repo" | A, BD, FC, DD, DP | Variable | "this project", "the project root" |

## Package internals

| Reference | Where | Kind | Rendered as |
|---|---|---|---|
| `packages/decks/story/README.md`, `story/stage.ts`, `story/ramps.ts`, `story/types.ts`, `story/timeline.ts` | DP, SS | Variable | `{{pkg}}/story/…` (all ship in the package) |
| `packages/decks/components/StoryLayer.vue`, `styles/story-frame.css`, `setup/main.ts`, `theme/default.json` | SS, DP | Variable | `{{pkg}}/…` |
| "One bun workspace; the addon and runner are `packages/decks/`" | A, DP | Delete + user wording | "Decks live in `{{decksDir}}/` … the addon and CLI are the installed package at `{{pkg}}/`; read it, never edit it" |
| `packages/decks/scripts/deck.mjs` (the `decks` bin) | DP | Delete + user wording | "the `decks` CLI from `slidev-addon-decks`" |
| `packages/decks/styles/*.css` as the place for shared rules | DP | Delete + user wording | The deck's own `styles/index.css` |
| Hand-offs in `story-frame.css` | SS | Delete + user wording | Addon names in `{{pkg}}/styles/story-frame.css`, deck-local names in the deck's `styles/index.css` |
| Promote a component into the addon on second use; "don't edit `packages/decks/`" | A, DP | Delete + user wording | "Don't edit anything under `{{pkg}}/`; copy a pattern into your deck" |
| `beats.test.ts`, `test-decks.ts`, `OVER_BUDGET_TODAY` | SS, DW | Delete + user wording | Card budget and beats/clicks agreement stated as rules, checked with `{{decks}} shot` |
| `frame-units.test.ts`, `handle-refs.test.ts`, `vt-names.test.ts`, `theme.test.ts` | SS, DP | Delete | The rules they enforce stay; the claim that a test enforces them goes |
| "the render the snap gate is pinned to" | DP | Delete | Repo refactor context |
| `data-od-story` in a conventional deck's comments enrols it in the guards | SS | Delete | Only the repo's guard tests read it |
| `packages/decks/{story,scripts,theme}` vitest scope | SS | Delete | Repo test suite |

## tools/ and hooks (ported by the CLI half, not rendered)

| Reference | Where | Kind | Replacement |
|---|---|---|---|
| `tools/ai-rhetoric-patterns.tsv` | DW, PG, `tools/content-lint.sh`, hooks | Variable | Ships as `{{pkg}}/lint/ai-rhetoric-patterns.tsv`; DW points there |
| Adding a `terminology-*` row to the TSV to enforce a glossary term | PG | Delete + user wording | "Nothing enforces these rows automatically"; the package has no project-local pattern file |
| `tools/content-lint.sh` | hooks, `ai-rhetoric-patterns.tsv` header | CLI | `decks lint [alias]` |
| `tools/content-fact-extract.mjs` | DD, FC | CLI | `decks fact-extract <alias>` |
| `.claude/hooks/lint-ai-rhetoric.sh` (bash + jq) | `.claude/settings.json` | CLI | `decks hook lint`, wired by `init` as `node "$CLAUDE_PROJECT_DIR/{{pkg}}/scripts/deck.mjs" hook lint` |
| `.claude/hooks/user-prompt-submit.sh` (bash + jq) | `.claude/settings.json` | CLI | `decks hook prompt`, wired the same way |
| `packages/decks/scripts/shot.mjs`, `snap.mjs` | root `package.json` | CLI | `decks shot <alias> <slide> [clicks]`, `decks snap <alias>` |

## Not changed

`.claude/rules/*.md`, `.claude/skills/*/SKILL.md` and `.claude/agents/deck-author.md` paths, `slidev-addon-decks/*` import specifiers, and `decks.json` keep their names: `init` writes the files to the same paths and the package exports the same specifiers.

The scaffold templates in `packages/decks/templates/` still mention `packages/decks/` and `beats.test.ts` in comments that `decks new` copies into a user's deck. They are outside this render; the tides exemplar copy rewrites the same two comments.
