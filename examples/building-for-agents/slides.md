---
theme: the-unnamed
title: "Building for agents"
info: "Using TypeScript to build agent tooling and infrastructure, from CLIs to a native macOS app. Austin JS, November 2026."
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
  # Self-hosted: fontsource imports and the Heros @font-face are in
  # styles/tokens.css. The families themselves are tokens: fonts.* in
  # theme.json and --sf-font-* in tokens.css.
  webfonts: []
lineNumbers: false
drawings:
  enabled: false
defaults:
  layout: full
addons: ["slidev-addon-decks"]
exportFilename: building-for-agents
src: ./pages/01-cover.md
---
---
src: ./pages/02-two-users.md
title: "My tools have two users: me and a coding agent."
clicks: 2
---

---
src: ./pages/03-thread.md
title: I ship a change with seven tools I built.
clicks: 2
---

---
src: ./pages/04-stacks-loop.md
title: Stacks briefs the agent and checks its work.
clicks: 3
---

---
src: ./pages/05-stacks-tour.md
title: The Stacks CLI is written with Effect.
clicks: 5
---

---
src: ./pages/06-stacks-output.md
title: Stacks output differs for people and agents.
clicks: 3
---

---
src: ./pages/07-foreman-session.md
title: foreman runs each Codex task in its own worktree.
clicks: 4
---

---
src: ./pages/08-foreman-daemon.md
title: foreman is a short-lived CLI and a daemon.
clicks: 3
---

---
src: ./pages/09-foreman-question.md
title: Codex waits until Claude answers its question.
clicks: 3
---

---
src: ./pages/10-rr-locks.md
title: rr runs each agent's tests on its own machine.
clicks: 4
---

---
src: ./pages/11-monitor-to-glass.md
title: StatGlass started as the rr monitor command.
clicks: 2
---

---
src: ./pages/12-glass-boundary.md
title: Rust collects the data and TypeScript draws it.
clicks: 4
---

---
src: ./pages/13-glass-browser.md
title: The StatGlass UI also runs in a browser tab.
clicks: 1
---

---
src: ./pages/14-glass-cli.md
title: Agents read StatGlass history through a CLI.
clicks: 2
---

---
src: ./pages/15-opendata.md
title: OpenData sends text to the model, rows to the UI.
clicks: 3
---

---
src: ./pages/16-openchart.md
title: OpenChart validation reports which field is wrong.
clicks: 3
---

---
src: ./pages/17-decks.md
title: A Decks hook blocks AI-sounding sentences.
clicks: 2
---

---
src: ./pages/18-habits.md
title: Each tool has some of the same six habits.
clicks: 3
---

---
src: ./pages/19-close.md
title: The seven tools are at steamfield.io.
---

