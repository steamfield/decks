---
title: Ink marks
description: The Vue components that draw onto a story stage, from InkLine and InkBars to chips, rules and numbers.
group: concepts
order: 2
---

Ink marks are Vue components that draw onto the stage. They use a clean stroked style by default and switch to a hand-drawn marker style with one setting.

| Component | Draws |
| --- | --- |
| `InkLine` | A drawn series, with a `LineHandle` the beat script drives |
| `InkBars` | Rows that grow, reorder, recolor and exit, with a `BarsHandle` |
| `InkRule` | A rule across the stage |
| `InkNumber` | A number |
| `InkTimeline` | A timeline |
| `InkChip` | A floating annotation |
| `InkCardRect` | A card box |
| `InkLabeledCard` | A card box plus a name and a note line |
| `InkPing` | A one-shot focus ring around a named mark, driven by a 0 to 1 `progress` |

`InkLine`'s opt-in `head` rides a dot on the draw front while the sweep is under way.

## Driving marks from beats

A stage reaches a mark through a template ref and drives it from the beat timeline. The timelines are built once, at mount, and each tween is bound to the child that existed then. So a mark the beat script drives must not sit inside a subtree keyed on `playCount`: a remount would leave the timeline animating the old instance, and the new one would render fully drawn and never move. `handle-refs.test.ts` fails on a driven ref inside that key.

## Colors

Marks take colors from the deck's theme. In a stage, read them with `ink(hue, step)` from `slidev-addon-decks/story` (`ink('cyan', 2)`), never a hex literal, so a deck's `theme.json` recolors its marks too. See [Theming with theme.json](/docs/guides/theming-with-theme-json/).
