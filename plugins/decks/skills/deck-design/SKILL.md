---
name: deck-design
description: Use when choosing or reviewing Decks layouts, typography, themes, cards, labels and visual hierarchy, especially when slides repeat a generic template.
---

# Deck design

Load `decks:working-with-decks` for the installed canvas and kit guides. Read [layout, type and tokens](references/layout.md) before styling. For visualizations also load `decks:visualization`; for visible copy load `decks:writing-slides`.

Decide what each slide needs the audience to see first. Give that thing the space and contrast. A theme makes styling consistent; it cannot decide which evidence matters.

## Two tests

**Deletion test:** remove an eyebrow, subtitle, icon, badge, border or card. If the audience loses no information or grouping, leave it out.

**25% zoom test:** inspect a contact sheet or thumbnails small enough that text cannot be read. For the deck, can you see changes in emphasis and pacing? For a slide, can you identify its dominant content? Uniform boxes and header stacks fail. Use thumbnail images for this test; browser text-size controls change type, not the whole composition.

## Stop the default shapes

- Do not give every slide three identical cards with an icon, title and blurb. Use a grid only when the evidence really consists of comparable independent units. A ranking needs bars or rows; a process needs a sequence; one finding can fill a slide.
- Do not repeat eyebrow + heading + paraphrasing subtitle + grid on every slide. Vary anatomy with the argument while keeping type, margins and source placement coherent.
- Cards must group a meaningful object, comparison or state. Slides do not need the web UI rule that a card must be clickable. Avoid cards around every sentence and nested panels.
- Eyebrows must add category, period, status or orientation absent from the headline. Mood words and arbitrary section numbers add work. They are labels, not heading elements.
- Give accent color one clear job per slide: the subject, a comparison or a real state. Do not spread it across eyebrows, dots, icons, borders and badges until everything competes. Keep semantic color assignments stable across slides.
- Icons must disambiguate something the text or position cannot. No star for AI, tinted circle above every card, decorative dot beside every label, or emoji as an unrequested icon system.
- Use flat text and restrained surfaces as the default. Gradient text, glows, palette-cycling borders and isolated italic accent words need an explanatory purpose. An existing deliberate deck system can use effects; copying them everywhere does not establish one.
- Motion is part of hierarchy. Load `decks:deck-motion`; revealing every bullet is not a design system.

## Review the rendered deck

Choose the form the evidence needs before styling it. Inspect the cover and one representative content slide before extending the system. Then inspect every state at presentation size and as thumbnails. Check at 16:9, 4:3 and 21:9, and enlarge the text with the viewer controls. Shorten copy or change layout when it does not fit; shrinking it defeats the purpose.
