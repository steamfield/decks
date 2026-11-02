<script setup lang="ts">
/**
 * StoryLink: a clickable source line at the bottom right of a story slide.
 *
 * The stage overlay swallows pointer events so ink never blocks a click on
 * the deck, which means a link inside it has to opt back in. Opens in a new
 * tab so the presentation stays where it is. Reads as a citation, not a
 * button: faint mono text on a hairline.
 */
withDefaults(
  defineProps<{
    href: string
    /** Display text. Defaults to the href without its scheme. */
    label?: string
    /** 0..1, for links that belong to a beat rather than the whole slide. */
    opacity?: number
  }>(),
  { label: undefined, opacity: 1 },
)
</script>

<template>
  <a
    class="od-mono od-story-link"
    :href="href"
    target="_blank"
    rel="noopener"
    :style="{ opacity: String(opacity), pointerEvents: opacity > 0.5 ? 'auto' : 'none' }"
  >
    {{ label ?? href.replace(/^https?:\/\//, '') }}
  </a>
</template>

<style scoped>
.od-story-link {
  position: absolute;
  right: calc(5.7 * var(--lw));
  bottom: calc(4.4 * var(--sh));
  font-size: 0.95rem;
  color: var(--od-text-faint);
  text-decoration: none;
  border-bottom: 1px solid var(--od-border);
  transition: opacity var(--od-dur-card) var(--od-settle);
}
.od-story-link:hover {
  color: var(--od-text-muted);
}
</style>
