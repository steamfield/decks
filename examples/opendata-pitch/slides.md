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
exportFilename: opendata-pitch
src: ./pages/01-cover.md
---
---
# Thesis: the claim and the why-now in two lines, before the ISBE slide, so the
# cleaning story reads as the input problem rather than as the product.
src: ./pages/01a-thesis.md
title: Agents can query any data that is clean and in a database. Almost no public data is.
---

---
src: ./pages/03-files-to-row.md
title: Twenty-nine files became one dataset.
clicks: 1
---

---
src: ./pages/04-scale-graph.md
title: Every dataset we clean joins the Dataset Graph.
clicks: 3
---

---
# Infrastructure: 5a alone before the case study. A dataset is a YAML file, six
# stages and one gate, and agents author most of them now. It does not draw the
# shared baseline; the rule starts on 6.
src: ./pages/05a-pipeline.md
title: Infrastructure as code, written by agents.
clicks: 3
---

---
# Divider: the case study opens. One beat, cover chrome, no figures.
src: ./pages/06a-case-study.md
title: Two tests, ten districts, one contradiction.
---

---
src: ./pages/06-customer.md
title: They had the data. They could not get at it.
clicks: 3
---

---
# Benchmark: thirty questions as two rows of marks, web arm then connector arm,
# then the time and effort each arm spent, then Phase 0, billed per token.
# Stands after the case study: they had the data and could not get at it, and
# with the catalog an agent does. No subtitle: the v4.1 comparison that used to
# sit under the headline is not on the slide, available for Q&A from
# data-sources.md.
src: ./pages/06d-benchmark.md
title: Thirty questions.
clicks: 4
---

---
# Platform: the stack the case study ran on, centred in the right column. Does
# not draw the shared baseline; the rule fades out after slide 6 and returns on 7.
src: ./pages/06b-platform.md
title: The catalog is the base. The tools are the product.
clicks: 2
---

---
src: ./pages/07-model.md
title: Companies already sell usable public data.
clicks: 2
---

---
# Bootstrap stands after the model, not before the case study: it is the
# capital-efficiency proof for the tier ladder, and it answers "what does this
# cost to run" at the point the pricing is on screen rather than three slides
# early.
src: ./pages/05c-bootstrap.md
title: Two Mac Minis run production. Disk fills first.
clicks: 3
---

---
# Signals: the reach, the discovery conversations, and the skeptic finding.
# Stands where traction would, and says plainly that none of it is revenue.
# Three beats, two clicks: the reach figure is enter motion, so beat 0 already
# has a number on stage under the card that claims it.
src: ./pages/08-signals.md
title: Verifiability is what converts the skeptics.
clicks: 2
---

---
src: ./pages/09-close.md
title: Every dataset discoverable. Every claim verifiable.
---
