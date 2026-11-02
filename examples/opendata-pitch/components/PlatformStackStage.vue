<script setup lang="ts">
/**
 * Slide 6b: the platform as a stack. The catalog and graph are the base, the
 * three surfaces stand on it, and the last beat adds private data underneath.
 *
 * The stack is centred in the right column, opposite the card. Beat 0 is a
 * frame rather than a lone bar: the three surfaces are already there as faint
 * slate outlines with no text, so the shape of the thing is on screen from
 * first paint and the first click fills it rather than inventing it.
 *
 * The surfaces are not three identical tiles. Agents is half again as wide as
 * the other two, because it is the surface the case study just ran on; the
 * row still spans the base exactly.
 *
 * The last beat does not replace the base. Swapping the catalog out for
 * private data read as "we stop doing this and start doing that", which is
 * the opposite of the claim: a dashed amber slab slides in under the catalog,
 * same width, shorter, and carries the roadmap tag.
 */
import { computed, reactive } from 'vue'
import { clamp01, DRAW, DUR, ink, SETTLE, stagger, useStage } from 'slidev-addon-decks/story'
import { BASELINE_X } from '../data/baseline'

/* ── Geometry, in stage viewBox units. The stack fills the right column. ── */
const BASE = { x: BASELINE_X[0], w: BASELINE_X[1] - BASELINE_X[0], h: 116 }
const SURFACE = { h: 164, gap: 40 }
/** Agents is the wide one; the three widths plus two gaps span the base inset. */
const SURFACE_INSET = 14
const ROW_W = BASE.w - SURFACE_INSET * 2
const UNIT_W = (ROW_W - SURFACE.gap * 2) / 3.5
const STEM = 52
const STEP = 0.18
/** The private slab: same width as the base, shorter, tucked under it. */
const SLAB = { h: 76, gap: 20 }

/** Centred on the whole stack, slab included, so nothing moves when it lands. */
const STACK_MID = 600
const STACK_H = SURFACE.h + STEM + BASE.h + SLAB.gap + SLAB.h
const SURFACE_Y = STACK_MID - STACK_H / 2
const STEM_TOP = SURFACE_Y + SURFACE.h
const BASE_Y = STEM_TOP + STEM
const SLAB_Y = BASE_Y + BASE.h + SLAB.gap

const SURFACES = [
  { id: 'api', name: 'API', who: 'Developers build on it', wide: false },
  { id: 'agents', name: 'Agents', who: 'MCP and Ask, no code needed', wide: true },
  { id: 'charts', name: 'Charts', who: 'Editable, for articles and decks', wide: false },
]
let cursor = BASE.x + SURFACE_INSET
const surfaces = SURFACES.map((surface) => {
  const w = surface.wide ? UNIT_W * 1.5 : UNIT_W
  const x = cursor
  cursor += w + SURFACE.gap
  return { ...surface, x, w, cx: x + w / 2 }
})

const BASE_INK = ink('cyan', 3)
const SURFACE_INK = ink('emerald', 3)
const OUTLINE_INK = ink('slate', 1)
const PRIVATE_INK = ink('amber', 3)

const BASE_COPY = { name: 'Catalog and graph', meta: 'one query interface' }
const SLAB_COPY = { name: 'Your data', meta: 'on an enterprise’s own data' }

const COPY = [
  {
    lead: 'One catalog, one graph, one interface.',
    body: 'Everything we clean lands in one place, linked to everything like it, behind a single query layer.',
  },
  {
    lead: 'Three ways in, for three kinds of user.',
    body: 'Developers build on the API. Non-technical users ask an agent. Editors get charts they can edit.',
  },
  {
    lead: 'The same stack runs on private data.',
    body: 'Every enterprise conversation asks for it. It ships once signed demand covers the SOC 2 cost.',
  },
]

/** Beat state, every field 0 to 1. `frame` is the entrance. */
const s = reactive({ frame: 0, surfaces: 0, slab: 0, chip: 0 })

/* ── Enter motion: the base and the three empty surfaces settle up together ── */
const { clicks, playCount, copy, beats } = useStage({
  copy: COPY,
  enter: (tl) => tl.to(s, { frame: 1, duration: DUR.card, ease: SETTLE }),
  beats: (tl, beat) => {
    beat(0)

    tl.to(s, { surfaces: 1, duration: DUR.scale, ease: DRAW }, `+=${DUR.opacity}`)
    beat(1)

    tl.to(s, { slab: 1, duration: DUR.grow, ease: SETTLE }, `+=${DUR.opacity}`)
    tl.to(s, { chip: 1, duration: DUR.card, ease: SETTLE }, `-=${DUR.opacity}`)
    beat(2)
  },
})

/** Each surface fills on its own slice of the beat, left to right. */
const surfaceProgress = (i: number) => stagger(s.surfaces, i, SURFACES.length, STEP)
/** Boolean on purpose: the ink eases in CSS, so the fill lands as one event. */
const surfaceLit = (i: number) => surfaceProgress(i) >= 0.5

const slabIn = computed(() => clamp01(s.slab))

/** The roadmap tag rides the new slab, top right, on its name line. */
const CHIP_X = BASE.x + BASE.w - 28
const CHIP_Y = SLAB_Y + 38
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <g :key="playCount">
        <!-- Base: the catalog, on every beat -->
        <g
          :style="{
            color: BASE_INK,
            opacity: String(s.frame),
            transform: `translate(0, ${(1 - s.frame) * 14}px)`,
          }"
        >
          <InkCardRect
            :x="BASE.x"
            :y="BASE_Y"
            :width="BASE.w"
            :height="BASE.h"
            :glow-r="0.8"
            :glow-edge="0.6"
            :stroke-opacity="0.75"
            :stroke-width="2"
            glow-filter
          />
          <text class="od-stack-name" :x="BASE.x + 36" :y="BASE_Y + 48">{{ BASE_COPY.name }}</text>
          <text class="od-stack-meta" :x="BASE.x + 36" :y="BASE_Y + 84">{{ BASE_COPY.meta }}</text>
        </g>

        <!-- Private data: a dashed slab under the catalog, on the last beat -->
        <g
          v-if="slabIn > 0"
          :style="{
            color: PRIVATE_INK,
            opacity: String(slabIn),
            transform: `translate(0, ${(1 - slabIn) * -16}px)`,
          }"
        >
          <InkCardRect
            :x="BASE.x"
            :y="SLAB_Y"
            :width="BASE.w"
            :height="SLAB.h"
            :glow-r="0.8"
            :glow-edge="0.6"
            :stroke-opacity="0.75"
            :stroke-width="2"
            dash="10 10"
            glow-filter
          />
          <text class="od-stack-name" :x="BASE.x + 36" :y="SLAB_Y + 40">{{ SLAB_COPY.name }}</text>
          <text class="od-stack-meta" :x="BASE.x + 36" :y="SLAB_Y + 66">{{ SLAB_COPY.meta }}</text>
        </g>

        <!-- Surfaces: outlines from first paint, filled on the first click -->
        <g
          v-for="(surface, i) in surfaces"
          :key="surface.id"
          class="od-stack-surface"
          :style="{
            color: surfaceLit(i) ? SURFACE_INK : OUTLINE_INK,
            opacity: String(s.frame),
            transform: `translate(0, ${(1 - s.frame) * 14}px)`,
          }"
        >
          <line
            :x1="surface.cx"
            :x2="surface.cx"
            :y1="STEM_TOP"
            :y2="BASE_Y"
            stroke="currentColor"
            stroke-opacity="0.5"
            stroke-width="2"
          />
          <InkCardRect
            :x="surface.x"
            :y="SURFACE_Y"
            :width="surface.w"
            :height="SURFACE.h"
            :glow-r="0.8"
            :glow-edge="0.6"
            :lit="surfaceLit(i)"
            :stroke-opacity="surfaceLit(i) ? 0.75 : 0.4"
            :stroke-width="2"
            :glow-filter="surfaceLit(i)"
          />
          <text
            class="od-stack-name"
            :x="surface.x + 28"
            :y="SURFACE_Y + 50"
            :style="{ opacity: String(surfaceProgress(i)) }"
          >
            {{ surface.name }}
          </text>
          <foreignObject
            :x="surface.x + 26"
            :y="SURFACE_Y + 66"
            :width="surface.w - 44"
            :height="SURFACE.h - 74"
            :style="{ opacity: String(surfaceProgress(i)) }"
          >
            <div xmlns="http://www.w3.org/1999/xhtml" class="od-stack-who">{{ surface.who }}</div>
          </foreignObject>
        </g>
      </g>
    </template>

    <template #overlay>
      <h2 class="od-story-head is-wide">The catalog is the base. The tools are the product.</h2>

      <InkChip
        :x="CHIP_X"
        :y="CHIP_Y"
        anchor="right"
        hue="amber"
        text="Roadmap, not built yet"
        :progress="s.chip"
      />
    </template>

    <template #card>
      <StoryCard anchor="left" hue="emerald" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>

<style scoped>
/* A surface recolors from outline to lit on the first click. Its glow eases
   in with the colour, but the stroke opacity steps, as it always has here. */
.od-stack-surface {
  transition: color var(--od-dur-card) var(--od-settle);
}
.od-stack-surface :deep(.od-card-stroke) {
  transition: none;
}
.od-stack-name {
  font-family: var(--od-font-sans);
  font-size: 30px;
  font-weight: 590;
  letter-spacing: -0.015em;
  fill: var(--od-text);
}
.od-stack-meta {
  font-family: var(--od-font-mono);
  font-size: 20px;
  font-weight: 500;
  fill: var(--od-text-faint);
}
.od-stack-who {
  font-family: var(--od-font-sans);
  font-size: 19px;
  line-height: 1.3;
  color: var(--od-text-muted);
}
</style>
