<script setup lang="ts">
import theme from '#decks/theme'

/**
 * The brand mark from the theme (`brand.logo`: a viewBox plus inner SVG
 * markup; `null` renders nothing). The default theme has no mark; the
 * OpenData example decks set one in their `theme.json`.
 *
 * The styles below animate a mark by class. On mount, a two-cycle
 * intro plays:
 *   1. A transient accent burst pair (violet + amber) emerges and fades out
 *   2. The brand teal + cyan layers emerge, settle, then drift in a subtle float
 * When a settle animation ends, its group swaps to the float class. A custom
 * mark can opt into the same motion by using those class names.
 */
withDefaults(defineProps<{ size?: number }>(), { size: 32 })

const logo = theme.brand.logo

// animationend bubbles, so one listener on the <svg> sees both layer groups.
const onAnimationEnd = (e: AnimationEvent) => {
  if (!e.animationName.includes('move')) return
  const el = e.target as Element
  if (el.classList.contains('od-settle-teal')) el.classList.replace('od-settle-teal', 'od-float-teal')
  else if (el.classList.contains('od-settle-cyan')) el.classList.replace('od-settle-cyan', 'od-float-cyan')
}
</script>

<template>
  <svg
    v-if="logo"
    :width="size"
    :height="size"
    :viewBox="logo['view-box']"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    @animationend="onAnimationEnd"
    v-html="logo.svg"
  />
</template>

<style scoped>
/* ── Animated logo mark (two-cycle intro). :deep because the mark is v-html. ── */

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
:deep(.od-intro) {
  opacity: 0;
  animation:
    od-logo-intro-fade 2s linear forwards,
    od-logo-intro-move 2s cubic-bezier(0.12, 0, 1, 1) forwards;
  will-change: transform, opacity;
}
:deep(.od-intro-0) {
  animation-delay: 0s;
}
:deep(.od-intro-1) {
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
:deep(.od-settle-teal) {
  opacity: 0;
  animation:
    od-logo-settle-fade 2s ease-out forwards,
    od-logo-settle-move-teal 2s ease-out forwards;
  animation-delay: 1.6s;
  will-change: transform, opacity;
}
:deep(.od-settle-cyan) {
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
:deep(.od-float-teal) {
  opacity: 1;
  animation: od-logo-float-teal 3s ease-in-out infinite;
  will-change: transform;
}
:deep(.od-float-cyan) {
  opacity: 1;
  animation: od-logo-float-cyan 3.4s ease-in-out infinite;
  will-change: transform;
}

@media (prefers-reduced-motion: reduce) {
  :deep(.od-intro) {
    display: none;
  }
  :deep(.od-settle-teal) {
    opacity: 1;
    animation: none;
    transform: translate3d(0, -5px, 0);
  }
  :deep(.od-settle-cyan) {
    opacity: 1;
    animation: none;
    transform: translate3d(0, -9px, 0);
  }
}
</style>
