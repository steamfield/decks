# Vendored OpenChart essentials

Adapted extracts from `openchart` in https://github.com/tryopendata/skills at commit
`5be82dc`, plugin version 9.0.0, matching OpenChart 9.0.0.

The reference names `chart-selection.md`, `encoding-channels.md`,
`color-strategy.md` and `annotations.md` preserve their upstream topics.
`marks.md` condenses the upstream bar, line, area, scatter and series-style
references. The upstream skill's type-first rule and format-string guidance
are included. This is a curated adaptation, not an unchanged copy of the full
OpenChart manual.

Changes for slides: larger token-based type, Decks' public React wrapper,
frame scaling, click/context lifecycle, theme-resolved colors, source records
and zero-baseline bars. Web examples with unsourced illustrative figures,
framework-specific setup and repository-internal paths are omitted. The
Constant-channel shorthand is described conditionally because installed public
types can support more than the original reference. The Decks-specific
`presentation.md` and `ink.md` references are authored alongside these
extracts.

When the installed OpenChart version changes, compare these extracts against
the matching release's public declarations and refresh the source commit.
Installed types win on field shapes. Slide-specific honesty, provenance,
readability and theme rules still apply.
