<script setup lang="ts">
/**
 * StoryLayer: a second full bleed svg over the stage, for ink that has to sit
 * on an element with a CSS box.
 *
 * The stage svg is one element, so nothing drawn in it can carry a
 * view-transition-name of its own, and the browser will not put one on an svg
 * `<g>` either. A layer is the answer: a div in the overlay, sized to the
 * frame by `.od-stage-layer` in story-frame.css, holding its own 1920x1080 svg
 * the same viewBox as the stage. Anything drawn in the slot lands on the same
 * point the stage would put it.
 *
 * The caller's `class` (a `vt-*` name) falls through to the div, which is the
 * element the name has to sit on.
 */
</script>

<template>
  <div class="od-stage-layer">
    <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <slot />
    </svg>
  </div>
</template>
