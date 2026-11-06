# RFCs

These are proposals for infrastructure, tooling and shared components that would make the next deck faster or safer to build. Each one comes from a specific problem met while building a real deck, and its "Evidence" section says what happened.

They are follow-up work: nothing here blocks the deck in progress. An RFC is drafted as soon as the problem shows up, while the details are fresh, and is picked up once that deck lands.

| RFC | Title | Status | Found while building |
|---|---|---|---|
| [0001](0001-parallel-agent-tooling.md) | Tooling that works with parallel agent runs | Draft (one fix landed) | texas-2026 |
| [0002](0002-deck-design-tokens.md) | Scaffold per-deck design tokens and guard against literals | Draft | texas-2026 |
| [0003](0003-presenter-notes-contract.md) | A presenter-notes format, template and guard | Draft | texas-2026 |
| [0004](0004-story-primitives.md) | Promote parliament chart, track timeline and status tags to the addon | Draft | texas-2026 |
| [0005](0005-prose-review.md) | Prose review beyond the regex lint | Draft | texas-2026 |
| [0006](0006-codex-deck-orchestration.md) | A repo kit for orchestrating deck builds through Codex | Draft | texas-2026 |

Statuses: Draft, Accepted, In progress, Done, Rejected. An RFC that's done keeps its file, with a line at the top naming the commit that landed it.

Template: Problem, Evidence, Proposal, Scope, Open questions.
