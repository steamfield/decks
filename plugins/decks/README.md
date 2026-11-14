# Decks plugin

Requires Node 22.12 or newer, including in projects without `@steamfield/decks`.

In a project with `@steamfield/decks` installed, run `decks init`. It adds the
versioned Steamfield marketplace and enables this plugin in `.claude/settings.json`,
copies the same skills to `.agents/skills/` for Codex, and adds guidance to `AGENTS.md`.
Re-run init after upgrading the package. It preserves edits to files it installed;
`decks init --force` replaces those edits. Files init did not install stay untouched.

Each collaborator runs once:

```sh
claude plugin install decks@steamfield --scope project
```

Enabling a plugin in project settings does not install it for collaborators.
After upgrading `@steamfield/decks` and re-running init, each collaborator updates
the installed plugin and restarts Claude Code:

```sh
claude plugin update decks@steamfield --scope project
```

To try this checkout directly, run `claude --plugin-dir ./plugins/decks` from this repo.

The plugin contains seven skills (`building-a-deck`, `writing-slides`, `deck-design`,
`deck-motion`, `visualization`, `deck-data`, `working-with-decks`), the `deck-author`
agent, and hooks that check prose before writes and remind agents of slide-writing
rules. Hooks use the project's installed package. In projects without
`@steamfield/decks`, they exit silently.
