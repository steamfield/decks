<script setup lang="ts">
/**
 * Hand-off, second half: the same baseline, lower on the stage.
 *
 * The pair is what makes the morph. This slide names the same element with
 * the same `vt-baseline` class and places it somewhere else; the browser
 * tweens between the two boxes, so the rule slides down as the slides cut.
 *
 * The headline and the prose card carry names of their own, assigned in
 * `story-frame.css`, so between two story slides they cross-fade in place
 * without either stage asking for it.
 *
 * Nothing else persists: the chip is new here, so it arrives with the frame.
 */
import { useStage } from 'slidev-addon-decks/story'

const RULE_X: [number, number] = [300, 1620]
const RULE_Y = 720

const COPY = [
  {
    lead: 'Same rule, new position.',
    body: 'The browser tweens the two boxes; neither stage animates anything.',
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
      <InkChip :x="RULE_X[1]" :y="RULE_Y" text="the rule landed here" anchor="right" />
    </template>

    <template #card>
      <StoryCard anchor="left" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>
