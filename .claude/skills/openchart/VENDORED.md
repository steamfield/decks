# Vendored

Copied from `plugins/openchart/skills/openchart/` in
https://github.com/tryopendata/skills at 5be82dc (plugin version 9.0.0), which
matches the `@opendata-ai/openchart-*` 9.0.0 packages this repo depends on.

It is vendored so Codex and Antigravity delegates (through the
`.agents/skills/openchart` symlink) get the same OpenChart reference Claude Code
gets from the `openchart` plugin, pinned to the version the decks render with.

Don't edit these files here. When the OpenChart dependency moves to a new major
version, re-copy the skill from the matching release of tryopendata/skills and
update the commit above. Slide-specific chart rules (theme, sizes, chrome,
colors from the deck theme) are not here: they are "Charts" in
`.claude/rules/deck-patterns.md`, which wins where the two disagree.
