<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * OpenData isometric data-layers mark. Matches shared/components/opendata-icon.tsx.
 *
 * On mount, a two-cycle intro plays (CSS-driven, see the block below):
 *   1. A transient accent burst pair (violet + amber) emerges and fades out
 *   2. The brand teal + cyan layers emerge, settle, then drift in a subtle float
 * Swapping the settle classes to float classes after the settle animation ends
 * mirrors the React component's animationend handler.
 */
withDefaults(defineProps<{ size?: number }>(), { size: 32 })

const tealRef = ref<SVGGElement | null>(null)
const cyanRef = ref<SVGGElement | null>(null)

const onTealEnd = (e: AnimationEvent) => {
  if (e.animationName.includes('move') && tealRef.value)
    tealRef.value.classList.replace('od-settle-teal', 'od-float-teal')
}
const onCyanEnd = (e: AnimationEvent) => {
  if (e.animationName.includes('move') && cyanRef.value)
    cyanRef.value.classList.replace('od-settle-cyan', 'od-float-cyan')
}

onMounted(() => {
  tealRef.value?.addEventListener('animationend', onTealEnd)
  cyanRef.value?.addEventListener('animationend', onCyanEnd)
})
onBeforeUnmount(() => {
  tealRef.value?.removeEventListener('animationend', onTealEnd)
  cyanRef.value?.removeEventListener('animationend', onCyanEnd)
})
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <!-- Box lid (behind layers) -->
    <path d="M 4 18 L 16 23 L 28 18 L 16 13 Z" fill="#2563EB" opacity="0.25" />
    <!-- Cycle 1: transient accent burst pair (amber + violet) -->
    <g class="od-intro od-intro-1"><path d="M 4 18 L 16 23 L 28 18 L 16 13 Z" fill="#F59E0B" /></g>
    <g class="od-intro od-intro-0"><path d="M 4 18 L 16 23 L 28 18 L 16 13 Z" fill="#A78BFA" /></g>
    <!-- Cycle 2: brand layers that settle, then float -->
    <g ref="tealRef" class="od-settle-teal">
      <path d="M 4 18 L 16 23 L 28 18 L 16 13 Z" fill="#10B981" />
    </g>
    <g ref="cyanRef" class="od-settle-cyan">
      <path d="M 4 18 L 16 23 L 28 18 L 16 13 Z" fill="#38BDF8" />
    </g>
    <!-- Box front walls (on top of layers for occlusion) -->
    <path d="M 4 18 L 16 23 L 16 30 L 4 25 Z" fill="#2563EB" />
    <path d="M 16 23 L 28 18 L 28 25 L 16 30 Z" fill="#1E3A5F" />
  </svg>
</template>

<style scoped>
/* ── Animated logo mark (OdLogo two-cycle intro, see opendata-icon.tsx) ── */

/* Cycle 1: transient accent burst pair emerges, rises, fades out. */
@keyframes od-logo-intro-fade {
  0% {
    opacity: 0;
  }
  8% {
    opacity: 1;
  }
  50% {
    opacity: 1;
  }
  70% {
    opacity: 0;
  }
  100% {
    opacity: 0;
  }
}
@keyframes od-logo-intro-move {
  0% {
    transform: translate3d(0, 3px, 0);
  }
  10% {
    transform: translate3d(0, 0, 0);
  }
  40% {
    transform: translate3d(0, -3px, 0);
  }
  70%,
  100% {
    transform: translate3d(0, -9px, 0);
  }
}
.od-intro {
  opacity: 0;
  animation:
    od-logo-intro-fade 2s linear forwards,
    od-logo-intro-move 2s cubic-bezier(0.12, 0, 1, 1) forwards;
  will-change: transform, opacity;
}
.od-intro-0 {
  animation-delay: 0s;
}
.od-intro-1 {
  animation-delay: 0.25s;
}

/* Cycle 2: brand layers emerge and settle into final position. */
@keyframes od-logo-settle-fade {
  0% {
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  100% {
    opacity: 1;
  }
}
@keyframes od-logo-settle-move-teal {
  0% {
    transform: translate3d(0, 3px, 0);
  }
  15% {
    transform: translate3d(0, 0, 0);
  }
  65% {
    transform: translate3d(0, -5.5px, 0);
  }
  100% {
    transform: translate3d(0, -5px, 0);
  }
}
@keyframes od-logo-settle-move-cyan {
  0% {
    transform: translate3d(0, 3px, 0);
  }
  15% {
    transform: translate3d(0, 0, 0);
  }
  65% {
    transform: translate3d(0, -9.5px, 0);
  }
  100% {
    transform: translate3d(0, -9px, 0);
  }
}
.od-settle-teal {
  opacity: 0;
  animation:
    od-logo-settle-fade 2s ease-out forwards,
    od-logo-settle-move-teal 2s ease-out forwards;
  animation-delay: 1.6s;
  will-change: transform, opacity;
}
.od-settle-cyan {
  opacity: 0;
  animation:
    od-logo-settle-fade 2s ease-out forwards,
    od-logo-settle-move-cyan 2s ease-out forwards;
  animation-delay: 1.85s;
  will-change: transform, opacity;
}

/* After settling, drift in a subtle infinite float. */
@keyframes od-logo-float-teal {
  0%,
  100% {
    transform: translate3d(0, -5px, 0);
  }
  50% {
    transform: translate3d(0, -6px, 0);
  }
}
@keyframes od-logo-float-cyan {
  0%,
  100% {
    transform: translate3d(0, -9px, 0);
  }
  50% {
    transform: translate3d(0, -10.2px, 0);
  }
}
.od-float-teal {
  opacity: 1;
  animation: od-logo-float-teal 3s ease-in-out infinite;
  will-change: transform;
}
.od-float-cyan {
  opacity: 1;
  animation: od-logo-float-cyan 3.4s ease-in-out infinite;
  will-change: transform;
}

@media (prefers-reduced-motion: reduce) {
  .od-intro {
    display: none;
  }
  .od-settle-teal {
    opacity: 1;
    animation: none;
    transform: translate3d(0, -5px, 0);
  }
  .od-settle-cyan {
    opacity: 1;
    animation: none;
    transform: translate3d(0, -9px, 0);
  }
}
</style>
