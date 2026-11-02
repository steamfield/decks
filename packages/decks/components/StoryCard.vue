<script setup lang="ts">
/**
 * StoryCard: the floating prose card.
 *
 * One bold lead plus at most two short sentences. The card never moves within
 * a slide; only its content swaps. The outgoing copy fades in place and the
 * incoming copy rises into it, the same swap every story card uses. The box
 * eases from the old copy's height to the new one's over the same beat, so
 * the card's top edge glides instead of jumping (it is bottom anchored).
 *
 * The `lead` slot exists for the one card that marks up a word inside the lead
 * (slide 6 underlines "triples"). It defaults to the prop, so every other
 * caller passes a string and never sees it.
 */
import { computed, ref } from 'vue'
import { easeHeight, fadeOutInPlace, riseIn, type Hue } from '../story'

const props = withDefaults(
  defineProps<{
    /** Bold lead line. At most eight words. */
    lead: string
    /** Supporting sentence. At most twenty words. */
    body?: string
    anchor?: 'left' | 'right'
    /** Accent of the corner glow; pick the hue of the ink the card sits beside. */
    hue?: Hue
  }>(),
  { body: '', anchor: 'left', hue: 'cyan' },
)

/** Content identity: swapping either line cross fades the card. */
const contentKey = computed(() => `${props.lead}|${props.body}`)

/**
 * Height hand-off for the swap. `before-leave` runs while the outgoing copy is
 * still in flow (or mid-ease, which offsetHeight also reads correctly), and
 * `enter` runs once the incoming copy is in flow and the outgoing one has gone
 * absolute, which is when the new height can be measured.
 */
const bodyEl = ref<HTMLElement | null>(null)
let fromHeight = 0
function onBeforeLeave(): void {
  fromHeight = bodyEl.value?.offsetHeight ?? 0
}
function onEnter(el: Element, done: () => void): void {
  riseIn(el, done)
  if (bodyEl.value) easeHeight(bodyEl.value, fromHeight)
  fromHeight = 0
}
</script>

<template>
  <div class="od-story-card" :class="[`anchor-${props.anchor}`, `accent-${props.hue}`]">
    <div ref="bodyEl" class="od-story-card-body">
      <Transition :css="false" @before-leave="onBeforeLeave" @enter="onEnter" @leave="fadeOutInPlace">
        <div :key="contentKey">
          <p class="od-story-lead">
            <slot name="lead">{{ props.lead }}</slot>
          </p>
          <p v-if="props.body" class="od-story-copy">{{ props.body }}</p>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.od-story-card-body {
  position: relative;
}
.od-story-lead {
  margin: 0;
  /* Frame units, so the card keeps its proportion to the stage. 23.2px at 1920. */
  font-size: calc(1.2084 * var(--sw));
  font-weight: 590;
  line-height: 1.35;
  letter-spacing: -0.016em;
  color: var(--od-text);
}
.od-story-copy {
  margin: calc(0.5833 * var(--sw)) 0 0;
  font-size: calc(1.2084 * var(--sw));
  font-weight: 400;
  line-height: 1.5;
  color: var(--od-text-muted);
}
</style>
