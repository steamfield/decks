<script setup lang="ts">
/**
 * Slide 19: the close. The cover's composition with the sun lower: the
 * wordmark and the event at the top, the site's address in the chrome title,
 * a one-line lede, the install commands at the bottom left and a QR code to
 * the site at the bottom right. One beat, no card. It stays up for questions.
 */
import { BYLINE } from '../data/01-cover'
import { countWord } from '../data/03-thread'
import { INSTALL, PRODUCT_COUNT, SITE } from '../data/19-close'

const month = new Date(`${BYLINE.month}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const host = new URL(SITE).host
</script>

<template>
  <StoryCover>
    <template #field><NightDriveField low /></template>
    <template #head>
      <div class="sf-cover-head od-enter-a">
        <span class="sf-wordmark"><SfMark class="sf-wordmark-mark" />steamfield</span>
        <span class="sf-cover-nav"><span>{{ BYLINE.event }}</span><span>{{ month }}</span></span>
      </div>
    </template>
    <template #title><span class="sf-chrome">{{ host }}</span></template>
    <template #lede><span class="sf-prompt">❯</span> {{ countWord(PRODUCT_COUNT) }} products, most of them open source.</template>
    <template #byline>
      <span class="cl-install">
        <span v-for="command in INSTALL" :key="command" class="cl-command"><span class="sf-prompt">$</span> {{ command }}</span>
      </span>
      <span class="cl-qr">
        <OdQrCard :url="SITE" :aria-label="`QR code to ${host}`" />
        <span class="sf-cover-by"><span>{{ BYLINE.speaker }}</span><span class="is-alt">{{ BYLINE.studio }}</span></span>
      </span>
    </template>
  </StoryCover>
</template>

<style scoped>
.cl-install {
  display: flex;
  flex-direction: column;
  gap: calc(0.5 * var(--sw));
  font-family: var(--od-font-mono);
  font-size: calc(1.15 * var(--sw));
  line-height: 1.3;
  color: var(--od-text);
  white-space: nowrap;
}
.cl-qr {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: calc(1 * var(--sw));
}
.cl-qr :deep(.od-qr-frame) {
  width: calc(9.4 * var(--sw));
  padding: calc(0.7 * var(--sw));
}
</style>
