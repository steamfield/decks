<script setup lang="ts">
/**
 * StoryCover: the cover chrome a story deck opens, divides and closes with.
 *
 * One beat, no figures: a `StoryStage` in its cover variant holding the
 * cover frame, which is the one story overlay laid out in flow rather than
 * placed absolutely. Three rows: the brand row (`url` turns it on with that
 * URL, `brand` with the theme's), the body
 * block with eyebrow, title, lede and anything else the slot brings, and the
 * byline. A frame with no byline has two children and `center` keeps the body
 * in the middle of what is left (`.od-cover-center` in story-frame.css).
 *
 * The rows carry `od-enter-a/b/c`, which is how `StoryStage` finds its
 * entrance groups, so the classes stay on the same elements the pages used
 * to write out. `field` renders behind the frame (a graph, a drift line),
 * `aside` after it (a source link, a QR card). Decorative `background` fills
 * the viewport outside the fitted content frame.
 *
 * `enter-after-transition` passes through to `StoryStage`: the rows settle in
 * once an arrow-key arrival's view transition lands, instead of skipping.
 */
withDefaults(
  defineProps<{ url?: string; brand?: boolean; center?: boolean; enterAfterTransition?: boolean }>(),
  { url: '', brand: false, center: false, enterAfterTransition: false },
)
</script>

<template>
  <StoryStage
    class="is-story-cover"
    :beats="1"
    :fluid="!$slots.field && !$slots.aside"
    :click="0"
    :enter-after-transition="enterAfterTransition"
  >
    <template v-if="$slots.background" #background><slot name="background" /></template>
    <template #overlay>
      <slot name="field" />
      <div class="od-cover-frame">
        <slot name="head">
          <OdCoverHead v-if="url || brand" class="od-enter-a" :url="url || undefined" />
        </slot>
        <div class="od-enter-b od-cover-body" :class="{ 'od-cover-center': center }">
          <slot name="eyebrow" />
          <h1 class="od-title"><slot name="title" /></h1>
          <p v-if="$slots.lede" class="od-lede od-cover-lede"><slot name="lede" /></p>
          <slot />
        </div>
        <OdByline v-if="$slots.byline" class="od-enter-c"><slot name="byline" /></OdByline>
      </div>
      <slot name="aside" />
    </template>
  </StoryStage>
</template>
