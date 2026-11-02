---
theme: the-unnamed
title: "Tides run on the Moon's clock"
info: "A five-slide story deck on how ocean tides work, drawn from NOAA predictions for Boston."
author: Claude Code (draft), Riley Hilliard (edit)
# Cross slide view transitions are run by packages/decks/setup/main.ts, not by
# Slidev: its own view-transition mode remounts every slide on every click.
# Slidev's container stays on a no-op TransitionGroup (a cut with no CSS),
# and data-od-story opts this deck into the addon's guard, the document level
# view-transition rules in packages/decks/styles/story-frame.css, and the story guard
# tests.
transition:
  name: od-cut
  css: false
htmlAttrs:
  data-od-story: ""
aspectRatio: 16/9
canvasWidth: 1920
fonts:
  fallbacks: false
  webfonts: [Inter]
  sans: Inter, sans-serif
  serif: Inter, sans-serif
  mono: Inter, sans-serif
  weights: "300,400,510,590,700"
lineNumbers: false
drawings:
  enabled: false
defaults:
  layout: full
addons: ["slidev-addon-decks"]
exportFilename: ocean-tides
src: ./pages/01-cover.md
---
---
# One stanza per slide. `clicks` is the stage's beat count minus one, and
# `beats.test.ts` fails if it disagrees with the stage's COPY array.
src: ./pages/02-two-a-day.md
clicks: 2
---
---
src: ./pages/03-two-bulges.md
clicks: 2
---
---
src: ./pages/04-spring-neap.md
clicks: 2
---
---
src: ./pages/05-coastline.md
clicks: 2
---
