# Parity with the Slidev decks

One row per behaviour the decks rely on today. "Proved by" names the test or check; a row
without one is not done. "Change" marks a deliberate difference from Slidev.

| Behaviour | Today | react-decks | Proved by |
| --- | --- | --- | --- |
| `next` advances a click, then the slide | Slidev `useNav` | `core/navigation.ts` | |
| `prev` onto a previous slide lands on its last click | Slidev `useNav` | `core/navigation.ts` | |
| `nextSlide` / `prevSlide` land on click 0 | Slidev `useNav` | `core/navigation.ts` | |
| Slides before the current one render fully revealed | `CLICKS_MAX` | `core/clicks.ts` | |
| URL holds slide and click, `#/n?clicks=c`, omitted at 0 | hash router | `core/location.ts` | |
| Reload keeps slide and click | URL | store + Playwright | |
| Hidden slides are not numbered, printed or counted | parser drops `hide: true` | node `slides` plugin | |
| Speaker notes with `[click]` markers, cumulative `[click:N]` | last HTML comment | `<Notes>` + `core/notes.ts` | |
| Click total known before a slide mounts | no (0 until mount) | yes, static in the manifest. Change | |
| Slide order | `src:` manifest | filename order. Change | |
| Slide fills the window at any aspect ratio | 100vw x 100vh override | `core/canvas.ts` fill | |
| Type scales with the window | no (fixed rem) | yes. Change | |
| Presenter and audience windows stay in sync | server-ref | BroadcastChannel + `core/sync.ts` | |
| A late or reloaded tab does not move the others | n/a | join protocol | |
| Slide transition per boundary, direction-aware | TransitionGroup / view transition | view transitions | |
| Story slides cross-fade with named elements | `startStoryTransition` | `runTransition` + `Morph` | |
| Stages jump to end state outside the live slide | `$renderContext !== 'slide'` | `renderContext` + `data-deck-motion` | |
| Reduced motion | timelines seek; 140 ms fade kept | `instant`: no fade. Change | |
| Components need no imports in a slide | unplugin auto-import | `components` plugin | |
| New component file renders without restart | no | yes. Change | |
| Deck `theme.json` overrides the theme, live | `decksTheme()` plugin | `theme` plugin | |
| Deck `styles/index.css` loads after theme styles | Slidev roots | `theme` plugin | |
| PDF export, one page per (slide, click) | `slidev export --with-clicks` | `decks export` | |
| `decks:*` embed protocol | `setup/embed.ts` | `runtime/embed.ts` | |
| Server identity meta for `shot` / `snap` | `slidev:entry` | `decks:entry` | |
| Zoom, pan, text sizing | `packages/decks/viewer` | `runtime/viewer.ts` | |
| Addon public files at `/theme/` | `decksPublic()` | `defineTheme({ publicDir })` | |
