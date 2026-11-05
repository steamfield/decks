<script setup lang="ts">
/**
 * Slide 6: the close. The cover's chrome again, with the record ghosted
 * behind the title and a QR code to the NOAA page the data came from. No
 * beats and no figures.
 */
import { DATA_URL, DATA_URL_LABEL } from '../data/close'
</script>

<template>
  <StoryCover>
    <template #field><CoverCurveField ghost /></template>
    <template #title>Anyone can download<br />the whole record.</template>
    <template #lede>Every figure in this deck comes from NOAA's Mauna Loa CSV files.</template>
    <template #aside>
      <div class="qr">
        <OdQrCard :url="DATA_URL" :aria-label="`QR code to ${DATA_URL_LABEL}`" />
        <span class="od-eyebrow">{{ DATA_URL_LABEL }}</span>
      </div>
    </template>
  </StoryCover>
</template>

<style scoped>
/* Lower right, under the end of the ghosted curve. */
.qr {
  position: absolute;
  right: calc(5.7 * var(--sw));
  bottom: calc(10 * var(--sh));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(1.4 * var(--sh));
}
</style>
