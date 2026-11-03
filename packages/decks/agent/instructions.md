## Slide decks (Decks)

Slide decks live in `{{decksDir}}/`, one directory per deck, registered in `decks.json`. They are Slidev decks on the `slidev-addon-decks` addon. Run its CLI through the package as below; the bare `decks` name on npm is an unrelated package.

```bash
{{decks}} new <alias> [dir] [--story]     # scaffold {{decksDir}}/<dir> and register it
{{decks}} dev <alias>                     # dev server (port 3030)
{{decks}} check                           # manifest drift plus lint errors
{{decks}} lint [alias]                    # AI-prose patterns, story card COPY included
{{decks}} shot <alias> <slide> [clicks]   # screenshots of one slide at each click
{{decks}} snap <alias>                    # whole-deck screenshot walk
{{decks}} fact-extract <alias>            # every figure in a deck, for the fact-check
{{decks}} build <alias>                   # static build
{{decks}} export <alias>                  # PDF export
```

In Claude Code, use the `deck-author` agent or the `building-a-deck` skill to build or revise a deck, and `fact-checking-a-deck` to check its numbers. In other agents, read `.claude/agents/deck-author.md` and the skill files as Markdown and perform that workflow directly; those native agent/skill names are not registered by init in other platforms. Before authoring or revising, every agent (including Codex and Antigravity) must read:

1. `.claude/skills/building-a-deck/SKILL.md` for the workflow and completion criteria.
2. `.claude/rules/prose-patterns.md` and `.claude/rules/deck-writing.md` before writing copy. Deck writing takes precedence over article-writing rules.
3. `.claude/rules/deck-patterns.md` for layout, typography, charts, theme tokens and conventional animations; `.claude/rules/deck-data.md` and `.claude/rules/project-glossary.md` for figures and terminology.
4. For story decks, `.claude/rules/story-stage.md` and `{{pkg}}/story/README.md` before building stages, timelines or cross-slide transitions.
5. `.claude/skills/fact-checking-a-deck/SKILL.md` before handing off a deck with factual claims.

These are ordinary Markdown files that every agent can read directly. Claude Code also attaches the scoped rules and runs the installed prompt/write hooks. Other agents must run `{{decks}} check` and `{{decks}} lint` during each edit cycle; Claude hooks do not run in their sessions. A passing build or screenshot check does not replace opening and reviewing every slide and click state.

Worked examples to read, not edit: `{{exemplars}}/agent-experience` (conventional) and `{{exemplars}}/tides` (story).

Restart the dev server after adding a component file. Slidev builds its auto-import list at startup, so a new `.vue` renders as an empty slot with `Failed to resolve component` in the console until the server restarts.

`decks init` wrote the agent, skills and rules listed in `.claude/decks.json`. Re-running `{{decks}} init` updates the ones you have not edited and skips the rest.
