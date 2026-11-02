<script setup lang="ts">
/**
 * Hand-off, first half: a baseline that survives into the next slide.
 *
 * A cross-slide morph needs three things. The deck sets `data-od-story` in
 * its headmatter, which is what scopes the document-level view-transition
 * rules. The element that persists carries one of the `vt-*` classes from
 * `story-frame.css`, here `vt-baseline`. And that class has to sit on an
 * HTML element, not on an SVG `<g>`, which is what `StoryLayer` is for: a div
 * in the overlay holding its own 1920x1080 svg.
 *
 * Only adjacent slides may share a name, and a name reaches the CSS through
 * two selector lists, the `.vt-on` setter and the one `:is()` rule that nulls
 * it again (`vt-names.test.ts` fails if one is missed), so reuse an existing
 * name before adding one.
 */
import { useStage } from 'slidev-addon-decks/story'

/** The rule sits high here and low on the next slide, so the morph is visible. */
const RULE_X: [number, number] = [300, 1620]
const RULE_Y = 420

const COPY = [
  {
    lead: 'This rule is about to move.',
    body: 'It carries vt-baseline, so the next slide inherits the same mark.',
  },
]

const { clicks, copy, beats } = useStage({
  copy: COPY,
  beats: (_tl, beat) => {
    beat(0)
  },
})
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #overlay>
      <StoryLayer class="vt-baseline">
        <InkRule :x1="RULE_X[0]" :x2="RULE_X[1]" :y="RULE_Y" seed="handoff-baseline" />
      </StoryLayer>

      <h2 class="od-story-head">One mark, carried across the cut.</h2>
    </template>

    <template #card>
      <StoryCard anchor="left" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>
