---
trigger: glob
description: "Project glossary"
globs: "**/examples/*/pages/*.md,**/examples/*/components/*.vue,**/decks/*/pages/*.md,**/decks/*/components/*.vue"
---
<!-- GENERATED from .claude/ for delegate agents from .claude/rules/project-glossary.md. Edit the source, then regenerate this copy to match. -->

# Project glossary

Dataset column names are not prose. Translate every column name before it reaches a slide.

This table starts empty. Add a row per column or code term your decks put in front of an audience, with the words a slide should use instead.

| Column / code term | Prose term | Notes |
|---|---|---|

<!-- decks:repo-only -->
To have the lint hook enforce a row, add a `terminology-<slug>` line at the bottom of `packages/decks/lint/ai-rhetoric-patterns.tsv` (`error` blocks the write, `warn` only reports) and say so in the Notes column. The two rows this glossary started from, for a deck series on Texas school finance, show the shape:

<!--
| `state_revenue` | "state aid" or "state funding" | Never "state revenue". Enforced as an error. |
| `local_tax_revenue` | "local property tax collections" | Flagged as a warning. |

terminology-state-revenue	error	\b[Ss]tate revenue\b	Write "state aid" or "state funding" (not "state revenue").
terminology-local-tax	warn	\b[Ll]ocal tax revenue\b	Prefer "local property tax collections".
-->
<!-- /decks:repo-only -->
<!-- decks:user: Nothing enforces these rows automatically: whoever writes or reviews the slides applies them. Two rows from a deck series on Texas school finance show the shape:

```md
| `state_revenue` | "state aid" or "state funding" | Never "state revenue". |
| `local_tax_revenue` | "local property tax collections" | Prefer it over "local tax revenue". |
``` -->
