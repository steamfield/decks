---
theme: the-unnamed
title: "TITLE"
info: "One-line description for SEO and slide index."
author: {{author}}
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
exportFilename: {{dir}}
src: ./pages/01-cover.md
---
---
# One stanza per slide. `clicks` is the stage's beat count minus one: keep it
# equal to the stage's COPY length minus one, or the last beats never show.
src: ./pages/02-first.md
clicks: 2
---
