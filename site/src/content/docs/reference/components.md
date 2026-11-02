---
title: Components
description: The components slidev-addon-decks auto-imports in every deck, by family, and its import paths.
group: reference
order: 4
---

Every component under `packages/decks/components/` is auto-imported in each deck that enables the addon.

## Story frame

| Component | What it is |
| --- | --- |
| `StoryStage` | The pinned stage: SVG, overlay and card slots. Owns the entrance groups. `<StoryStage fluid>` lets HTML layouts use the available width. |
| `StoryLayer` | A second full-bleed SVG, for ink that needs a `view-transition-name`. |
| `StoryCard` | The floating prose card. |
| `StoryCover` | Cover, thesis, divider and close chrome, slotted. |

## Ink marks and layout

`InkLine`, `InkBars`, `InkRule`, `InkNumber`, `InkTimeline`, `InkChip`, `InkCardRect`, `InkLabeledCard` and `InkPing` draw onto the stage; see [Ink marks](/docs/concepts/ink-marks/). `UnitGrid` and `RowStrip` lay marks out.

## Charts and other components

| Component | What it is |
| --- | --- |
| `OpenChart` | `<OpenChart :spec="..." />` renders an [OpenChart](https://github.com/tryopendata/openchart) spec sized for the 1920x1080 slide canvas, with a shared chart theme and entrance animation. |
| `Graph3D` | A WebGL network graph. Needs `three`, `3d-force-graph` and `three-spritetext` installed alongside, and mounts only in the real slide view. |
| `CodeInk` | Syntax-highlighted code reveal. |
| `Underline` | An underline mark. |

## Slide chrome

Cover, footer, eyebrow, byline and QR card, plus layout classes for bullets, two columns, big stats and full-bleed charts.

## Viewer

In the audience view, `Cmd/Ctrl +` and `-` resize the text, a trackpad pinch zooms the slide, and `Cmd/Ctrl 0` resets both. Presenter, overview and PDF export are not affected.

## Import paths

| Path | Exports |
| --- | --- |
| `slidev-addon-decks/story` | `useStage`, `DUR`, `stagger`, `ink`, the beat and stage helpers |
| `slidev-addon-decks/theme` | `theme`, the resolved theme object |
| `slidev-addon-decks/chart-theme` | The shared chart theme |
