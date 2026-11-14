<script setup lang="ts">
/**
 * Slide 3: I ship a change with seven tools I built.
 *
 * The seven products as stations along one road, in the order work flows
 * through them. A schematic: no data, only the order.
 *
 * Three beats. On entry the road draws and the stations show an icon and a
 * verb. The first click names each one and prints its language. The second
 * keeps the three the talk opens up and drops the other four back.
 */
import { reactive } from 'vue'
import { DUR, SETTLE, TRACE, stagger, useStage } from 'slidev-addon-decks/story'
import { DIM, FRAME, OFF, ON } from './design'
import { PRODUCTS, product } from '../data/products'
import { FEATURED, OPENDATA_TESTS, TYPESCRIPT_PRODUCTS, countWord, langLines } from '../data/03-thread'

const featuredNames = FEATURED.map((id) => product(id).name)

const COPY = [
  {
    lead: 'I built each tool for my own work.',
    body: `Most started inside OpenData, whose test suite is about ${OPENDATA_TESTS.toLocaleString('en-US')} tests.`,
  },
  {
    lead: `${countWord(TYPESCRIPT_PRODUCTS)} of the ${countWord(PRODUCTS.length).toLowerCase()} use TypeScript.`,
    body: 'rr is Go. StatGlass samples the system in Rust, and OpenData’s engine is Python.',
  },
  {
    lead: `${countWord(FEATURED.length)} get several slides tonight.`,
    body: `${featuredNames.slice(0, -1).join(', ')} and ${featuredNames.at(-1)}, with the source code on screen.`,
  },
]

/* ── Geometry, in stage viewBox units ── */
const ROAD_Y = 424
const TILE = 116
const ICON = 76
const SPAN = (FRAME.right - FRAME.left) / PRODUCTS.length
const VERB_Y = ROAD_Y + TILE / 2 + 40
const NAME_Y = VERB_Y + 46
const LANG_Y = NAME_Y + 36
const LANG_GAP = 24

const stations = PRODUCTS.map((p, i) => ({
  ...p,
  x: FRAME.left + (i + 0.5) * SPAN,
  lang: langLines(p.lang),
  featured: FEATURED.includes(p.id),
}))
/** The road between stations: a lead-in, six links and a lead-out. */
const links = [
  { x1: FRAME.left, x2: stations[0].x - TILE / 2 },
  ...stations.slice(1).map((st, i) => ({ x1: stations[i].x + TILE / 2, x2: st.x - TILE / 2 })),
  { x1: stations[stations.length - 1].x + TILE / 2, x2: FRAME.right },
]

const s = reactive({ road: OFF, tiles: OFF, names: OFF, focus: OFF })

const { clicks, copy, beats } = useStage({
  copy: COPY,
  enter: (tl) => {
    tl.to(s, { road: ON, duration: DUR.scale, ease: TRACE })
    tl.to(s, { tiles: ON, duration: DUR.scale, ease: SETTLE }, `-=${DUR.grow}`)
  },
  beats: (tl, beat) => {
    beat(0)
    tl.to(s, { names: ON, duration: DUR.scale, ease: 'none' })
    beat(1)
    tl.to(s, { focus: ON, duration: DUR.color, ease: SETTLE })
    beat(2)
  },
})

const linkProgress = (i: number) => stagger(s.road, i, links.length, 0.1)
const tileProgress = (i: number) => stagger(s.tiles, i, stations.length, 0.1)
const nameProgress = (i: number) => stagger(s.names, i, stations.length, 0.1)
/** What the last beat leaves of a station: the featured three stay, the rest drop back. */
const level = (featured: boolean) => (featured ? ON : ON - s.focus * (ON - DIM))
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <line
        v-for="(link, i) in links"
        :key="`link-${i}`"
        class="sf-wire"
        :x1="link.x1"
        :x2="link.x1 + (link.x2 - link.x1) * linkProgress(i)"
        :y1="ROAD_Y"
        :y2="ROAD_Y"
        :style="{ opacity: String(linkProgress(i) > OFF ? ON - s.focus * (ON - DIM) : OFF) }"
      />

      <g v-for="(st, i) in stations" :key="st.id" :style="{ opacity: String(level(st.featured)) }">
        <g :style="{ opacity: String(tileProgress(i)), transform: `translate(0, ${(ON - tileProgress(i)) * 14}px)` }">
          <rect class="sf-box is-well" :x="st.x - TILE / 2" :y="ROAD_Y - TILE / 2" :width="TILE" :height="TILE" />
          <PixelIcon :id="st.id" :x="st.x - ICON / 2" :y="ROAD_Y - ICON / 2" :width="ICON" :height="ICON" />
          <text class="sf-pixel" :x="st.x" :y="VERB_Y" text-anchor="middle">{{ st.verb }}</text>
        </g>
        <g :style="{ opacity: String(nameProgress(i)), transform: `translate(0, ${(ON - nameProgress(i)) * 10}px)` }">
          <text class="sf-name" :x="st.x" :y="NAME_Y" text-anchor="middle">{{ st.name }}</text>
          <text
            v-for="(line, n) in st.lang"
            :key="line"
            class="sf-mono is-small"
            :x="st.x"
            :y="LANG_Y + n * LANG_GAP"
            text-anchor="middle"
          >{{ line }}</text>
        </g>
      </g>
    </template>

    <template #overlay>
      <h2 class="od-story-head">I ship a change with seven tools I built.</h2>
      <EvidenceTag kind="schematic" :x="FRAME.right" :y="ROAD_Y - TILE / 2 - 86" align="right" :progress="s.tiles" />
      <ThreadRail />
    </template>

    <template #card>
      <StoryCard anchor="left" hue="rose" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>
