# Agent guidance shipped with Decks

Install the package in your project, then run `npx -p slidev-addon-decks decks init` (or `bunx -p slidev-addon-decks decks init`). Installation makes the guidance available; init copies the project-specific instructions and wires Claude Code hooks. Re-run init after upgrading. It updates files it owns and preserves your edits; `--force` only overwrites edited files previously owned by init.

The marked block in AGENTS.md gives every agent an explicit reading order. Codex and other agents can read the same Markdown files directly. Codex, Cursor, Windsurf and OpenCode read AGENTS.md directly. Claude Code imports it through CLAUDE.md; Gemini CLI imports it through GEMINI.md. A thin .github/instructions/decks.instructions.md reference covers Copilot deck files. Native Claude Code agents, scoped rules and hooks are installed; this does not register native agents or hooks in other platforms. The shared Markdown content stays under .claude/ for compatibility, without a copy per platform. Other agents run `decks check` and `decks lint` through the shared workflow, without an automatic write hook.

## Platform entry points

| Platform | Entry point installed by init | Automatic Decks hooks |
| --- | --- | --- |
| Claude Code | `CLAUDE.md` imports `AGENTS.md`; native agent, skills and scoped rules | Prompt reminder and write-time lint |
| Codex | `AGENTS.md` | None |
| Cursor | `AGENTS.md` | None |
| GitHub Copilot | `.github/instructions/decks.instructions.md` references `AGENTS.md`, scoped to the configured decks directory | None |
| Gemini CLI | `GEMINI.md` imports `AGENTS.md` | None |
| Windsurf | `AGENTS.md` | None |
| OpenCode | `AGENTS.md` | None |

Init preserves existing host instructions outside marked Decks blocks. Before writing, it rejects destinations that are symlinks or whose parents resolve outside the project, including with `--force`; a collision stops init before any file changes. The Copilot rule uses the same content-hash ownership tracking as the shared rules. Existing files it did not create are reported as collisions and kept. Native agent applications have not each been run in the package test: the tests verify the installed files, their references and update behavior.

Discovery conventions verified against official documentation: [Codex](https://learn.chatgpt.com/docs/agent-configuration/agents-md), [Cursor](https://cursor.com/docs/rules), [Copilot](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions), [Gemini CLI](https://geminicli.com/docs/cli/gemini-md/), [Windsurf's official documentation index](https://docs.windsurf.com/llms.txt) (AGENTS.md entry), and [OpenCode](https://opencode.ai/docs/rules/).

## Coverage

The reusable guidance originated in the talks authoring setup and is maintained in the Decks repository's `.claude/` sources. `render:agent` renders those sources into `agent/templates/`; init fills in your installed package path, CLI command and configured deck directory.

| Authoring concern | Installed guidance or tool |
| --- | --- |
| Slide arc, claim headlines, word budgets, bullets and speaker notes | `rules/deck-writing.md`, `skills/building-a-deck/SKILL.md` |
| Rhetorical quality and prohibited writing patterns | `rules/prose-patterns.md`, package `lint/ai-rhetoric-patterns.tsv`, `decks lint`, Claude write hook |
| Typography, layout, themes, chart design and scripted demos | `rules/deck-patterns.md`, conventional exemplar |
| Story beats, reversible timelines, entry lifecycle, frame coordinates and cross-slide transitions | `rules/story-stage.md`, package `story/README.md`, story exemplar |
| Data modules, source records, terminology and fact review | `rules/deck-data.md`, `rules/project-glossary.md`, `skills/fact-checking-a-deck/SKILL.md`, `decks fact-extract` |
| Scaffold, screenshot walks, builds, export and visual review | `skills/building-a-deck/SKILL.md`, `decks new/check/shot/snap/build/export` |
| Author role and one-deck session scope | `agents/deck-author.md` |
| Prompt reminders and write-time lint | `.claude/hooks/decks.sh`, two entries merged into `.claude/settings.json` |

Rules and skills above are installed beneath `.claude/`. Exemplars stay in the package's `agent/exemplars/` directory; copy patterns into your deck rather than editing installed files. Story and conventional scaffold templates ship separately in `templates/`.

## Deliberate exclusions

The original project's credentials, permission grants, automatic approvals, deployment commands, branch policies, private memory, personal glossary and absolute machine paths are not portable authoring guidance and are not installed. General repository hooks for secrets, formatting, session setup and process cleanup remain the host project's responsibility. The talks-specific shell wrappers are replaced with package CLI hooks, without a jq dependency. Private article fact-check tooling is replaced with the packaged deck fact-check skill. Exemplars have project branding and private-source caveats handled during rendering.

## Verify a package release

In the Decks repository, `bun run render:agent` updates shipped templates and `bun run test:tarball` packs the actual npm package, installs it into fresh scratch projects, runs init through its public CLI, exercises ownership and hook behavior, and checks scaffold/lint/build workflows. It includes npm and Bun installs. Browser-dependent screenshot cases report a skip if Chromium is unavailable. `bun run test` also checks rendered-source drift; a source-rule change must include its rendered copy.
