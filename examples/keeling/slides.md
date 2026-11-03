---
theme: the-unnamed
title: "Carbon dioxide is rising, and rising faster"
info: "A five-slide story deck on what the Keeling curve shows about atmospheric CO2, drawn from NOAA Mauna Loa data."
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
exportFilename: keeling
src: ./pages/01-cover.md
---
---
# One stanza per slide. `clicks` is the stage's beat count minus one.
src: ./pages/02-record.md
title: Carbon dioxide in the air keeps climbing.
clicks: 2
---
---
src: ./pages/03-seasons.md
title: The curve breathes once a year.
clicks: 2
---
---
src: ./pages/04-decades.md
title: The climb is getting steeper.
clicks: 2
---
---
src: ./pages/05-halfway.md
title: Half the rise came recently.
clicks: 2
---
