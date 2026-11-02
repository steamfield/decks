<script setup lang="ts">
/**
 * Slide 9: the close. The cover's chrome again: the brand row, the catalog
 * graph orbiting behind the title, and the QR card with the site link lower
 * right. Nothing else: no beats, no bullets, no figures.
 *
 * The QR wrapper carries `vt-qr-frame`. While the traction slide is hidden
 * nothing seeds that name on the slide before, so the frame is drawn in place
 * here; unhide slide 8 and the tick hands off into it again. It wraps only the
 * white QR square: the label sits outside it, because story-frame.css paints
 * anything carrying that class opaque.
 */
import { QR_FRAME_VARS } from '../data/qr-frame'
</script>

<template>
  <StoryCover url="tryopendata.ai" center>
    <template #field><CoverGraphField /></template>
    <template #title>Every dataset discoverable.<br />Every claim verifiable.</template>
    <template #aside>
      <div class="od-close-qr" :style="QR_FRAME_VARS">
        <div class="vt-qr-frame od-qr-morph">
          <OdQrCard url="https://tryopendata.ai" aria-label="QR code to tryopendata.ai" />
        </div>
        <span class="od-eyebrow">tryopendata.ai</span>
      </div>
    </template>
  </StoryCover>
</template>

<style scoped>
/* Use of funds, stated as intent rather than as a figure: there is no raise
   number on this deck. Faint, so the title still carries the slide. */
.od-close-next {
  margin: calc(2.4 * var(--sh)) 0 0;
  max-width: calc(52 * var(--sw));
  font-size: calc(1.15 * var(--sw));
  font-weight: 300;
  letter-spacing: -0.005em;
  color: var(--od-text-faint);
}
/* Positioned from the shared QR frame constant, so slide 8's seed can be
   derived from the same numbers and the morph grows in place. */
.od-close-qr {
  position: absolute;
  right: var(--od-qr-gutter);
  top: var(--od-qr-top);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.9rem;
  text-align: center;
}
.od-qr-morph {
  border-radius: 14px;
  /* story-frame.css paints this white under `.vt-on`; the presenter has none. */
  background: var(--od-qr-white);
}
</style>
