---
theme: the-unnamed
title: "In 2025, 87% of survey respondents had used webpack. 26% of them would use it again."
info: "A five-slide story deck on the move from webpack to Vite, and from Jest to Vitest, drawn from the State of JavaScript survey, 2016 to 2025."
author: Claude Code (draft and fact-check edit)
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
exportFilename: state-of-js
src: ./pages/01-cover.md
---
---
# One stanza per slide. `clicks` is the stage's beat count minus one.
# Every figure typed in a title is checked against the data by the matching
# data/*.ts module, which `bun run test` loads.
src: ./pages/02-webpack.md
title: webpack retention fell from 95% to 26% as Vite use rose from 29% to 84%.
clicks: 2
---
---
src: ./pages/03-keep.md
title: 26 of every 100 webpack users would use it again, against 98 of every 100 Vite users.
clicks: 1
---
---
src: ./pages/04-build-tools.md
title: Of 12 build tools in 2025, webpack ranked first in use and last in retention.
clicks: 2
---
---
src: ./pages/05-testing.md
title: Since 2021, Jest retention fell to 65% as Vitest use rose to 54%.
clicks: 3
---
