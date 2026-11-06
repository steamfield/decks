<script setup lang="ts">
/**
 * DecksCredit: a small "Created with Decks" credit for the bottom-right corner
 * of every slide.
 *
 * Opt in per deck with a `global-bottom.vue` next to `slides.md` that renders
 * `<DecksCredit />`; Slidev draws that layer on every slide. The mark is the
 * Decks logo (two slides on the diagonal, the same geometry as the site's
 * `site/src/lib/brand.ts`) drawn in `currentColor` at two strengths, so it
 * takes the deck's own text color and adds no hue to the palette. It sits below
 * the story frame's source line (`StoryLink`), in canvas pixels, because the
 * global layer is outside the story frame and its frame units. The credit
 * links to the Decks homepage.
 */
withDefaults(defineProps<{
  /** Link target: the Decks homepage. Pass `null` for plain text. */
  href?: string | null
}>(), { href: 'https://decks.steamfield.io' })
</script>

<template>
  <component
    :is="href ? 'a' : 'span'"
    class="od-decks-credit"
    :href="href"
    :target="href ? '_blank' : undefined"
    :rel="href ? 'noopener' : undefined"
  >
    <span class="lead">Created with</span>
    <svg class="mark" viewBox="0 0 32 32" aria-hidden="true">
      <path
        class="back"
        d="M12 4.75H27a3 3 0 0 1 3 3v8.5a3 3 0 0 1-3 3h-2.5v-3.5a4.5 4.5 0 0 0-4.5-4.5H9v-3.5a3 3 0 0 1 3-3Z"
      />
      <rect class="front" x="2" y="12.75" width="21" height="14.5" rx="3" />
    </svg>
    <span class="wordmark">Decks</span>
  </component>
</template>

<style scoped>
.od-decks-credit {
  position: absolute;
  right: 110px;
  bottom: 14px;
  z-index: 20;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--od-font-sans);
  font-size: 15px;
  line-height: 1;
  color: var(--od-text-faint);
  text-decoration: none;
  pointer-events: auto;
}
.mark {
  width: 20px;
  height: 20px;
}
.front {
  fill: currentColor;
}
.back {
  fill: currentColor;
  opacity: 0.55;
}
.wordmark {
  font-weight: 600;
  color: var(--od-text-muted);
}
a.od-decks-credit:hover .wordmark {
  color: var(--od-text);
}
</style>
