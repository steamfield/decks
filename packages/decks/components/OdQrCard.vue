<script setup lang="ts">
/**
 * OdQrCard: white QR card + labels for close slides.
 *
 * Preferred: pass `url` and the QR renders at runtime (uqr), no asset step.
 * Or pass `image`, a filename in the deck's public/ directory; the component
 * applies the BASE_URL guard so builds under `--base /slides/<name>/` resolve it.
 */
import { computed } from 'vue'
import { renderSVG } from 'uqr'

const props = defineProps<{
  url?: string
  image?: string
  label?: string
  sublabel?: string
  ariaLabel?: string
}>()

const qrSvg = computed(() => (props.url ? renderSVG(props.url, { ecc: 'M', border: 0 }) : ''))

const base = import.meta.env.BASE_URL || '/'
const imageCss = computed(() =>
  props.image ? `url('${base}${props.image}') center/contain no-repeat` : '',
)
</script>

<template>
  <div class="od-qr-card">
    <div
      class="od-qr-frame"
      role="img"
      :aria-label="ariaLabel ?? `QR code${label ? ` to ${label}` : ''}`"
    >
      <div v-if="url" class="od-qr-img" v-html="qrSvg"></div>
      <div v-else class="od-qr-img" :style="{ background: imageCss }"></div>
    </div>
    <span v-if="label" class="od-eyebrow od-qr-label">{{ label }}</span>
    <span v-if="sublabel" class="od-mono od-qr-sublabel">{{ sublabel }}</span>
  </div>
</template>

<style scoped>
.od-qr-card {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.1rem;
}
.od-qr-frame {
  background: var(--od-qr-white);
  border-radius: 14px;
  padding: 1.1rem;
  width: 240px;
  aspect-ratio: 1;
}
.od-qr-img {
  width: 100%;
  height: 100%;
}
.od-qr-img :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}
.od-qr-label {
  font-size: 0.95rem;
}
.od-qr-sublabel {
  font-size: 0.9rem;
  color: var(--od-text-faint);
}
</style>
