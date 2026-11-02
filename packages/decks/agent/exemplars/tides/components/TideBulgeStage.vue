<script setup lang="ts">
/**
 * Slide 3: why there are two tides. Pull arrows shrink with distance from the
 * Moon, the ocean stretches toward it, then away from it, and a coastal point
 * rides the turning Earth through both bulges.
 *
 * Schematic, not to scale: bulge heights and arrow lengths are geometry. The
 * one figure on the slide (the lunar day) comes from data/moon-clock.ts.
 */
import { computed, reactive } from 'vue'
import { DRAW, DUR, SETTLE, ink, useStage } from 'slidev-addon-decks/story'
import { LUNAR_DAY_LABEL } from '../data/moon-clock'

const EARTH = { x: 1000, y: 540, r: 170 }
const OCEAN_R = 196
const NEAR_MAX = 96
const FAR_MAX = 84
const MOON = { x: 1720, y: 540, r: 46 }

/** Relative pull at the near ocean, Earth's centre, and the far ocean. */
const ARROWS = [
  { id: 'near', x: EARTH.x + OCEAN_R, len: 170 },
  { id: 'centre', x: EARTH.x, len: 120 },
  { id: 'far', x: EARTH.x - OCEAN_R, len: 82 },
]

const COPY = [
  {
    lead: 'The Moon pulls the near ocean hardest.',
    body: "Gravity weakens with distance, so water facing the Moon is pulled more than Earth's center.",
  },
  {
    lead: 'The far ocean is pulled least.',
    body: 'Earth is pulled away from that water, which leaves a second bulge on the opposite side.',
  },
  {
    lead: 'Earth turns under both bulges.',
    body: `One turn back under the Moon takes ${LUNAR_DAY_LABEL}, so both bulges pass each coast.`,
  },
]

/** near/far: bulge growth 0 to 1. spin: turns of the coastal marker. */
const s = reactive({ arrows: 0, near: 0, far: 0, coast: 0, spin: 0 })

/** Ocean radius at angle a (radians, 0 points at the Moon). */
function oceanR(a: number): number {
  const c = Math.cos(a)
  return OCEAN_R + NEAR_MAX * s.near * Math.max(0, c) ** 2 + FAR_MAX * s.far * Math.max(0, -c) ** 2
}

const oceanPath = computed(() => {
  const n = 120
  const pts: string[] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const r = oceanR(a)
    pts.push(`${(EARTH.x + r * Math.cos(a)).toFixed(1)},${(EARTH.y - r * Math.sin(a)).toFixed(1)}`)
  }
  return `M${pts.join('L')}Z`
})

/** The coast starts at the top of the globe and turns counterclockwise. */
const coast = computed(() => {
  const a = Math.PI / 2 + s.spin * Math.PI * 2
  const r = oceanR(a)
  return { x: EARTH.x + r * Math.cos(a), y: EARTH.y - r * Math.sin(a) }
})

const { clicks, copy, beats } = useStage({
  copy: COPY,
  beats: (tl, beat) => {
    beat(0)
    tl.to(s, { arrows: 1, duration: DUR.opacity, ease: SETTLE })
    tl.to(s, { near: 1, duration: DUR.scale, ease: DRAW })
    beat(1)
    tl.to(s, { far: 1, duration: DUR.scale, ease: DRAW })
    beat(2)
    tl.to(s, { arrows: 0, duration: DUR.opacity, ease: SETTLE })
    tl.to(s, { coast: 1, duration: DUR.opacity, ease: SETTLE })
    tl.to(s, { spin: 1, duration: DUR.bloom, ease: 'none' })
  },
})
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <g>
        <path :d="oceanPath" :fill="ink('cyan', 1)" fill-opacity="0.35" :stroke="ink('cyan', 3)" stroke-width="3" />
        <circle :cx="EARTH.x" :cy="EARTH.y" :r="EARTH.r" class="earth" />
        <text class="od-stage-label" :x="EARTH.x" :y="EARTH.y + 10" text-anchor="middle">Earth</text>

        <circle :cx="MOON.x" :cy="MOON.y" :r="MOON.r" :fill="ink('slate', 3)" />
        <text class="od-stage-label" :x="MOON.x" :y="MOON.y + MOON.r + 48" text-anchor="middle">Moon</text>

        <g :style="{ opacity: String(s.arrows) }" :stroke="ink('amber', 3)" :fill="ink('amber', 3)">
          <g v-for="a in ARROWS" :key="a.id">
            <line :x1="a.x" :y1="EARTH.y" :x2="a.x + a.len - 18" :y2="EARTH.y" stroke-width="6" stroke-linecap="round" />
            <path :d="`M${a.x + a.len},${EARTH.y} l-26,-15 v30 Z`" stroke="none" />
          </g>
        </g>

        <circle
          :cx="coast.x"
          :cy="coast.y"
          r="14"
          :fill="ink('emerald', 4)"
          :style="{ opacity: String(s.coast) }"
        />
      </g>
    </template>

    <template #overlay>
      <h2 class="od-story-head">The Moon stretches the ocean into two bulges.</h2>
    </template>

    <template #card>
      <StoryCard v-if="copy.lead" anchor="left" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>

<style scoped>
.earth {
  fill: var(--od-surface-raised);
  stroke: var(--od-border);
  stroke-width: 2;
}
</style>
