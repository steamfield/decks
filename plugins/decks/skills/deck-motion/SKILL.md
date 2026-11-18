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
| `MotionTemplate` ([templates](references/motion-templates.md)) | A turning point of the talk deserves a finished motion graphic: the opening title, the one number, a myth to correct, a section break, the close. Pick a template and write its words. |
| `Camera`, `ShapeMorph` | One dense picture is toured region by region, or one shape changes while the audience follows it. |
| [Custom motion graphics](references/motion-graphics.md) | No template fits: use `useTimeline` with gsap's plugins for masked type, a marker that draws a route, or a `Scene3D` camera move. Start from the closest template's source. |

Use only motion tokens: `duration`, `ease` and `stagger` from `@steamfield/decks/motion`, or `DUR`, `SETTLE`, `DRAW`, `TRACE` from `@steamfield/decks/kit`. CSS uses the corresponding `--deck-dur-*`, `--deck-ease-*` and `--deck-stagger` variables. Use `slideChartAnimation` for OpenChart. No per-slide raw millisecond values or invented easing curves.

## Motion graphics belong at the turns

Plan them with the arc, not after it. When sketching the slides, mark the three to six where the talk turns: the opening, the number it rests on, a belief it corrects, the breaks between parts, a process or history the speaker walks through, the close. Those get a motion template, chosen from the table in [motion-templates.md](references/motion-templates.md). Keep them off dense data slides, off slides the speaker talks over throughout, and never on three slides in a row. Film each one with `decks film` and read the sheet before calling the slide done.

## Entrances preserve continuity

An entrance establishes the scene once on arrival. A beat changes evidence when the speaker advances. Keep all state needed at click k in the seekable beat timeline; an entrance must not be the only place that establishes a later beat's data state. Avoid bounces, pulsing decoration and a new entrance on every render.

The same component can render in `slide`, `presenter`, `preview`, `overview` and `print`. Outside the active live slide, render the settled state for that instance's click, without animation, timers or WebGL. Use framework hooks and primitives to get that behavior. Do not add a second playhead or use mount as the arrival signal.

## Verify motion as a viewer

Walk forward, backward, press again mid-tween, jump to a later click, reload there and revisit the slide. Compare with `?motion=instant`, reduced motion, presenter current/preview, overview and print. The settled state must be the same regardless of navigation direction. Use `window.__deck.settled()` for automation instead of sleeping. Film an authored beat with `decks film <deck> <slide> <click> --out beat.png`. Read the frames in order to check where a stroke grows, a chart changes or a mark reaches its destination. Click 0 films the transition from the preceding visible slide. Watch live playback to judge pacing.
