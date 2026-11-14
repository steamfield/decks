---
name: deck-motion
description: Use when adding or reviewing Decks click reveals, entrances, transitions, animated figures, demos or React story-stage beats.
---

# Deck motion

Load `decks:working-with-decks` and the installed motion and kit guides first. Read [clicks, tokens and stage lifecycle](references/motion.md) before scripting a stage.

Motion earns its place when it directs the next comparison, preserves an object's identity, or paces a step the speaker must explain. Keep content visible when the audience can read it together. Do not fade in every bullet by default. Do not add a click or stagger merely to make a slide feel animated.

| Primitive | Use when |
| --- | --- |
| `Step` | One item or group should appear on a particular click, optionally leave later. |
| `Steps` | Each child deserves its own spoken step. A list can reveal one item per click. |
| `Stagger` | One group belongs to one click but its ordering helps reading. It is not one click per child. |
| `TextReveal` | One short plain string needs deliberate emphasis on one click. Avoid making the audience wait to read every sentence. |
| `Highlight` | Existing text stays visible while attention moves to a phrase. |
| `CountUp` | The arrival at a magnitude helps the explanation; the final value is sourced and readable. Skip decorative counting. |
| `Draw` | The direction or construction of an SVG stroke matters. It lives inside an SVG. |
| `Morph` | The same object changes position/size across adjacent slides, or clicks with `morphSteps: true`. Identity must be meaningful. |
| `useStage` and story beats | One pinned scene evolves while card copy advances. Set explicit MDX clicks. |

Use only motion tokens: `duration`, `ease` and `stagger` from `@steamfield/decks/motion`, or `DUR`, `SETTLE`, `DRAW`, `TRACE` from `@steamfield/decks/kit`. CSS uses the corresponding `--deck-dur-*`, `--deck-ease-*` and `--deck-stagger` variables. Use `slideChartAnimation` for OpenChart. No per-slide raw millisecond values or invented easing curves.

## Entrances preserve continuity

An entrance establishes the scene once on arrival. A beat changes evidence when the speaker advances. Keep all state needed at click k in the seekable beat timeline; an entrance must not be the only place that establishes a later beat's data state. Avoid bounces, pulsing decoration and a new entrance on every render.

The same component can render in `slide`, `presenter`, `preview`, `overview` and `print`. Outside the active live slide, render the settled state for that instance's click, without animation, timers or WebGL. Use framework hooks and primitives to get that behavior. Do not add a second playhead or use mount as the arrival signal.

## Verify motion as a viewer

Walk forward, backward, press again mid-tween, jump to a later click, reload there and revisit the slide. Compare with `?motion=instant`, reduced motion, presenter current/preview, overview and print. The settled state must be the same regardless of navigation direction. Use `window.__deck.settled()` for automation instead of sleeping. Screenshots verify settled frames; watch live pacing separately.
