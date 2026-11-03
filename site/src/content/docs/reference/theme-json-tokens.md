---
title: theme.json tokens
description: Every group in packages/decks/theme/default.json and the --od-* CSS variable each token becomes.
group: reference
order: 3
---

A deck's `theme.json` is a partial override of `packages/decks/theme/default.json`. The theme renders to CSS custom properties:

| Token | CSS variable |
| --- | --- |
| `surfaces.K` | `--od-K` |
| `accents.K` | `--od-K` |
| `text.primary` | `--od-text` |
| `text.K` | `--od-text-K` |
| `borders.default` | `--od-border` |
| `borders.K` | `--od-border-K` |
| `glows.K` | `--od-glow-K-rgb`, used as `rgba(var(--od-glow-amber-rgb), 0.2)` |
| `fonts.K` | `--od-font-K` |

Ramps, the categorical palette, chart colors and brand text are read from JavaScript (`slidev-addon-decks/theme`, or `ink(hue, step)`), not emitted as CSS variables.

## The ones you'll reach for

- **Surfaces:** `--od-canvas`, `--od-surface`, `--od-surface-raised`
- **Text:** `--od-text`, `--od-text-secondary`, `--od-text-muted`, `--od-text-faint`, `--od-text-dim`
- **Borders:** `--od-border`, `--od-border-subtle`
- **Accents:** `--od-cyan`, `--od-rose`, `--od-amber`, `--od-emerald`, `--od-violet`, `--od-blue`, `--od-slate`

In CSS, never use raw hex values; use these variables, so a deck's `theme.json` reaches every rule.

## Groups in `default.json`

| Group | Holds |
| --- | --- |
| `surfaces` | `canvas`, `canvas-cover`, `surface`, `surface-raised`, `muted` |
| `text` | `primary`, `secondary`, `muted`, `faint`, `dim`, `highlight` |
| `borders` | `default`, `subtle`, `rule`, `axis` |
| `ramps` | Six hues (`cyan`, `amber`, `rose`, `emerald`, `violet`, `slate`), four steps each, dark to light |
| `accents` | Named colors, mostly aliases into the ramps |
| `glows` | Hex colors used as rgb triplets |
| `categorical` | The categorical chart palette |
| `fonts` | `sans`, `mono` |
| `chart` | Text, gridline, axis, eyebrow, title, subtitle, source and graph-label colors |
| `qr-white` | The QR card's light color |
| `brand` | `name`, `url`, `wordmark-gradient`, `logo` |

Merge rules, aliases and the ramp contrast rule are in [Theming with theme.json](/docs/guides/theming-with-theme-json/).
