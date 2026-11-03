---
theme: the-unnamed
title: "OpenData: public data, made usable for AI agents"
info: "Pitch: OpenData cleans public data once so AI agents can ground answers in it. Data-storytelling deck, September 2026."
author: Riley Hilliard
# Cross slide view transitions are run by packages/decks/setup/main.ts, not by
# Slidev: its own view-transition mode remounts every slide on every click.
# Slidev's container stays on a no-op TransitionGroup (a cut with no CSS),
# and data-od-story opts this deck into the addon's guard and scopes the
# document level view-transition rules in packages/decks/styles/story-frame.css to it.
transition:
  name: od-cut
  css: false
htmlAttrs:
  data-od-story: ""
routerMode: hash
aspectRatio: 16/9
canvasWidth: 1920
fonts:
  provider: none
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
exportFilename: opendata-showcase
src: ./pages/01-files-to-row.md
clicks: 1
---

---
src: ./pages/02-scale-graph.md
title: Every dataset we clean joins the Dataset Graph.
clicks: 3
---
