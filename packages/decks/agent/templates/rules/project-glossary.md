---
paths:
  - "{{decksDir}}/*/pages/*.md"
  - "{{decksDir}}/*/components/*.vue"
---

# Project glossary

Dataset column names are not prose. Translate every column name before it reaches a slide.

This table starts empty. Add a row per column or code term your decks put in front of an audience, with the words a slide should use instead.

| Column / code term | Prose term | Notes |
|---|---|---|

Nothing enforces these rows automatically: whoever writes or reviews the slides applies them. Two rows from a deck series on Texas school finance show the shape:

```md
| `state_revenue` | "state aid" or "state funding" | Never "state revenue". |
| `local_tax_revenue` | "local property tax collections" | Prefer it over "local tax revenue". |
```
