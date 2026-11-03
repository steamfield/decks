// The agent files `decks init` installs. render-agent.mjs (repo-only, not
// shipped) renders each from `.claude/<path>` into `agent/templates/<path>`;
// init.mjs writes each template to `.claude/<path>` in the user's project.
export const SOURCES = [
  'agents/deck-author.md',
  'skills/building-a-deck/SKILL.md',
  'skills/fact-checking-a-deck/SKILL.md',
  'rules/deck-patterns.md',
  'rules/deck-writing.md',
  'rules/deck-data.md',
  'rules/story-stage.md',
  'rules/prose-patterns.md',
  'rules/project-glossary.md',
]
