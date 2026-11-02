---
theme: the-unnamed
title: "Story Slide Templates"
info: "Reference stages for a story deck: the minimal stage, bars, labelled cards, and a cross-slide hand-off."
author: Decks
# The story headmatter. Cross slide view transitions are run by
# shared/setup/main.ts, not by Slidev: its own view-transition mode remounts
# every slide on every click. Slidev's container stays on a no-op
# TransitionGroup (a cut with no CSS), and data-od-story opts this deck into
# the addon's guard, the document level view-transition rules in
# shared/styles/story-frame.css, and the story guard tests. This is the one
# thing `examples/od-templates` does not carry, which is why the two
# galleries are separate decks.
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
exportFilename: od-story-templates
src: ./pages/01-cover.md
---
---
# The smallest correct stage: useStage with copy, an enter motion and a beat
# script; one line drawn on a beat; one chip; one card.
src: ./pages/02-minimal.md
clicks: 2
---
---
# InkBars: grow on entry, recolor one row, drop two and re-sort the rest.
src: ./pages/03-bars.md
clicks: 2
---
---
# A row of InkLabeledCard boxes arriving on a stagger, with the last one
# switching from planned to built.
src: ./pages/04-cards.md
clicks: 2
---
---
# The hand-off pair. These two slides are adjacent on purpose: they share the
# vt-baseline name, and only adjacent slides may.
src: ./pages/05-handoff-one.md
---
---
src: ./pages/06-handoff-two.md
---
