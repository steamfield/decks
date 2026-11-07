# RFCs

These are proposals for infrastructure, tooling and shared components that would make the next deck faster or safer to build. Each one comes from a specific problem met while building a real deck, and its "Evidence" section says what happened.

They are follow-up work: nothing here blocks the deck in progress. An RFC is drafted as soon as the problem shows up, while the details are fresh, and is picked up once that deck lands.

| RFC | Title | Status | Found while building |
|---|---|---|---|
| [0001](0001-parallel-agent-tooling.md) | Tooling that works with parallel agent runs | Ready (one fix landed) | texas-2026 |
| [0002](0002-deck-design-tokens.md) | Shape tokens in the theme, a hex guard, and a serif font slot | Ready | texas-2026 |
| [0003](0003-presenter-notes-contract.md) | A presenter-notes format, template and guard | Ready | texas-2026 |
| [0004](0004-story-primitives.md) | Promote the parliament layout math, and gate the credit from the addon | Ready | texas-2026 |
| [0005](0005-prose-review.md) | Prose review beyond the regex lint | Ready | texas-2026 |
| [0006](0006-codex-deck-orchestration.md) | A repo kit for orchestrating deck builds through Codex | Ready | texas-2026 |

Statuses: Draft, Ready (reviewed and executable, awaiting a go-ahead), Accepted, In progress, Done, Rejected. An RFC that's done keeps its file, with a line at the top naming the commit that landed it.

Template: Problem, Evidence, Plan (each item with a "Done when" check), Scope, Verification, Open questions.

Order: 0001, 0003, 0002, 0005, 0004, then 0006. 0005 builds on 0001 (the alias form of `shot`) and 0003 (the shared notes parser); 0006 points at what 0001, 0002, 0003 and 0005 add.
