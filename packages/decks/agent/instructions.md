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

To build or revise a deck, use the `deck-author` agent or the `building-a-deck` skill. To check a deck's numbers, use `fact-checking-a-deck`. The rules in `.claude/rules/` attach when you edit deck files. Worked examples to read, not edit: `{{exemplars}}/agent-experience` (conventional) and `{{exemplars}}/tides` (story).

Restart the dev server after adding a component file. Slidev builds its auto-import list at startup, so a new `.vue` renders as an empty slot with `Failed to resolve component` in the console until the server restarts.

`decks init` wrote the agent, skills and rules listed in `.claude/decks.json`. Re-running `{{decks}} init` updates the ones you have not edited and skips the rest.
