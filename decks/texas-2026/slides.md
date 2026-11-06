---
theme: the-unnamed
title: "Texas schools after the 2026 election"
info: "What the 2026 Texas election can and cannot change for Austin ISD, and how fast."
author: Riley Hilliard
# Cross slide view transitions are run by the addon's setup/main.ts, not by
# Slidev: its own view-transition mode remounts every slide on every click.
# Slidev's container stays on a no-op TransitionGroup (a cut with no CSS),
# and data-od-story opts this deck into the addon's guard, the document level
# view-transition rules in the addon's styles/story-frame.css.
transition:
  name: od-cut
  css: false
htmlAttrs:
  data-od-story: ""
aspectRatio: 16/9
canvasWidth: 1920
fonts:
  provider: none
  fallbacks: false
  # Self-hosted from @fontsource-variable (imported in styles/tokens.css).
  # The font families themselves are tokens: fonts.* in theme.json.
  webfonts: []
lineNumbers: false
drawings:
  enabled: false
defaults:
  layout: full
addons: ["slidev-addon-decks"]
exportFilename: texas-2026
# The Decks mark (public/favicon.svg) instead of Slidev's default favicon.
favicon: /favicon.svg
src: ./pages/01-cover.md
---
---
src: ./pages/02-power-board.md
clicks: 3
---
---
src: ./pages/03-outcome-ladder.md
clicks: 4
---
---
src: ./pages/04-rulebook.md
clicks: 2
---
---
src: ./pages/05-two-campuses.md
clicks: 2
---
---
src: ./pages/06-trigger-tree.md
clicks: 3
---
---
src: ./pages/07-collision-timeline.md
clicks: 5
---
---
src: ./pages/08-senate-arc.md
clicks: 3
---
---
src: ./pages/09-undo.md
clicks: 2
---
---
src: ./pages/10-tools.md
clicks: 2
---
---
src: ./pages/11-hb2.md
clicks: 2
---
---
src: ./pages/13-futures.md
clicks: 2
---
---
src: ./pages/14-watch.md
clicks: 2
---
