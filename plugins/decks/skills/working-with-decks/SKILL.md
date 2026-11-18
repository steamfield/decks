---
name: working-with-decks
description: Use when starting work in a project using @steamfield/decks, finding the installed framework documentation, running the CLI, or choosing a Decks authoring skill.
---

# Working with Decks

Start here before creating or editing a deck. Use the project's installed version.

1. Read `node_modules/@steamfield/decks/package.json` for the version and public exports.
2. Read `node_modules/@steamfield/decks/docs/README.md`, then the relevant files in that directory. These are the installed version's guide.
3. If local docs are missing or insufficient, use the documentation in the [Decks GitHub repository](https://github.com/steamfield/decks) at the release tag matching that exact version. Do not substitute the default branch or a guessed tag. If no matching tag exists, use the installed declarations and CLI help and report the documentation gap.
4. Check signatures against the installed `.d.ts` files selected by the package's exports. Do not use private, deprecated or experimental APIs. When docs and the implementation differ, confirm the installed behavior and report the discrepancy.

This package uses MDX slides and React components; a Slidev/Vue deck with `slides.md`, `pages/` or `slidev-addon-decks` needs migration before these workflows apply.

Read [project layout and CLI](references/project.md) for file discovery, imports and commands. Use `decks` through the project's package manager or local bin; the commands below assume it is on PATH. Run from the project directory containing `decks.json`. A deck argument can also be a directory.

## Load the skill for the work

These are plugin skills, invoked as `decks:<name>`. Follow their linked references before authoring the relevant part.

| Request | Load next, in order |
| --- | --- |
| Make a deck or change its structure | `decks:building-a-deck`, which routes the full workflow |
| Write, shorten or revise visible text | `decks:writing-slides` |
| Choose a layout, typography, theme or visual hierarchy | `decks:deck-design` |
| Add reveals, transitions, demos or story beats | `decks:deck-motion` |
| Add a motion graphic: an animated title, stat, timeline, quote, section break, kinetic type or 3D | `decks:deck-motion`, its motion-templates reference first |
| Add or edit a chart, table, map or Ink visualization | `decks:visualization`, then `decks:deck-data` before writing any figure |
| Add numbers, refresh evidence or fact-check | `decks:deck-data` |

For a six-slide story about Q3 numbers: load `building-a-deck`, then `writing-slides`, `deck-design`, `deck-motion`, and `deck-data`; load `visualization` before selecting marks or writing a chart spec. Source the actual Q3 data before drafting numeric claims. Finish the building workflow, including `decks check`, `decks lint`, visual QA and the fact-check in `deck-data`.

For a churn-by-month chart: load `visualization` and `deck-data` before entering values; define the churn denominator, time window and missing-month treatment, then select and encode the chart. Finish with the relevant checks and a fact-check of the new claims.
