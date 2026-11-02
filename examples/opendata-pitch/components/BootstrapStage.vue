<script setup lang="ts">
/**
 * Slide 5c: production is two Mac Minis, and disk is the first wall.
 *
 * Four beats. On entry the two machines settle in as cards, each listing the
 * services it runs. The first click draws three gauges for the serving box:
 * disk in amber, because it is the one that is nearly full, RAM and CPU in
 * slate, because they are not. The second grows the load test figure off its
 * rule, one figure per traffic bucket, with the tail latency on each label.
 * The third takes the wall down: the disk gauge recolors from amber to cyan
 * and a small tag names what did it.
 *
 * The cards reproduce the house card in SVG (surface rect under a corner
 * anchored radial glow) the way the slide 7 tier blocks do.
 */
import { computed, reactive, ref } from 'vue'
import {
  clamp01,
  DRAW,
  DUR,
  FILTER_IDS,
  filterUrl,
  ink,
  SETTLE,
  stagger,
  STROKE,
  useStage,
  type GrowHandle,
} from 'slidev-addon-decks/story'
import { BOXES, CEILING, GAUGES } from '../data/infra'

/* ── Machines ── */
const CARD = { x: 110, w: 800, h: 172, top: 250, gap: 26 }
const boxes = BOXES.map((box, i) => ({
  ...box,
  y: CARD.top + i * (CARD.h + CARD.gap),
  hue: i === 0 ? ('cyan' as const) : ('violet' as const),
}))

/* ── Gauges for the serving box ── */
const GAUGE = { x: 1080, w: 780, top: 300, pitch: 96, h: 14 }
const gauges = GAUGES.map((g, i) => ({
  ...g,
  y: GAUGE.top + i * GAUGE.pitch,
  color: g.wall ? ink('amber', 3) : ink('slate', 3),
}))
const wall = gauges.find((g) => g.wall) ?? gauges[0]

/* ── Load figure ── */
const FIGURE_RULE = { x1: 1080, x2: 1860, y: 740 }

const RULE_INK = ink('slate', 1)
const TRACK_INK = ink('slate', 1)

const cpuLoad = GAUGES.find((g) => g.id === 'cpu')?.text ?? ''
const diskText = GAUGES.find((g) => g.id === 'disk')?.text ?? ''

const COPY = [
  {
    lead: 'Production is two Mac Minis on a desk.',
    body: `One serves, one processes. We own the hardware, pay no cloud bill, and have ${BOXES[0].ramGb} GB of RAM on each.`,
  },
  {
    lead: 'Disk runs out long before CPU or RAM.',
    body: `${diskText} used at idle, CPU load ${cpuLoad}. Crawler agents are blocked on storage.`,
  },
  {
    lead: `${CEILING.reqPerSec.toLocaleString('en-US')} QPS before latency moves.`,
    body: `Zero failures to ${CEILING.zeroFailReqPerSec.toLocaleString('en-US')} req/s. The wall was the proxy's memory cap, not the hardware.`,
  },
  {
    lead: 'The first cloud spend is storage.',
    body: 'Same containers, same YAML, more disk. That unblocks the request loop and the crawler agents.',
  },
]

const s = reactive({ cards: 0, gauges: 0, wall: 0, rule: 0, clear: 0 })
const apiFigure = ref<GrowHandle | null>(null)
const datasetFigure = ref<GrowHandle | null>(null)

const { clicks, playCount, copy, beats } = useStage({
  copy: COPY,
  enter: (tl) => tl.to(s, { cards: 1, duration: DUR.scale, ease: SETTLE }),
  beats: (tl, beat) => {
    beat(0)

    tl.to(s, { gauges: 1, duration: DUR.scale, ease: DRAW }, `+=${DUR.opacity}`)
    // The disk gauge turns amber once it has finished filling.
    tl.to(s, { wall: 1, duration: DUR.color, ease: SETTLE }, `-=${DUR.opacity}`)
    beat(1)

    // The figure's host rises with the rule, then the number counts.
    tl.to(s, { rule: 1, duration: DUR.grow, ease: SETTLE }, `+=${DUR.opacity}`)
    // Explicit position: the figures overlap the tail of the rule rather
    // than queueing behind it, which is what appending would give.
    apiFigure.value?.addGrow(tl, tl.duration() - DUR.card)
    datasetFigure.value?.addGrow(tl, `-=${DUR.card}`)
    beat(2)

    // The wall comes down: disk recolors, the tick slides off, the tag lands.
    tl.to(s, { clear: 1, duration: DUR.scale, ease: SETTLE }, `+=${DUR.opacity}`)
    beat(3)
  },
})

const cardProgress = (i: number) => stagger(s.cards, i, boxes.length, 0.25)
const gaugeProgress = (i: number) => stagger(s.gauges, i, gauges.length, 0.2)
/** Rows rise in over the first stretch of their fill. */
const gaugeRise = (i: number) => clamp01(gaugeProgress(i) * 3)

/** Disk ink: amber while it is the wall, cyan once beat 3 has taken the wall down. */
const DISK_WALL = ink('amber', 3)
const DISK_CLEAR = ink('cyan', 3)
const diskInk = computed(() => (s.clear >= 0.5 ? DISK_CLEAR : DISK_WALL))
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <g :key="playCount">
        <!-- Two machines -->
        <g
          v-for="(box, i) in boxes"
          :key="box.id"
          :style="{
            opacity: String(cardProgress(i)),
            transform: `translate(0, ${(1 - cardProgress(i)) * 18}px)`,
          }"
        >
          <InkCardRect
            :x="CARD.x"
            :y="box.y"
            :width="CARD.w"
            :height="CARD.h"
            :hue="box.hue"
            :glow-opacity="0.16"
            stroke="var(--od-border)"
            :stroke-width="1"
          />
          <text
            class="od-box-role"
            :x="CARD.x + 32"
            :y="box.y + 38"
            :style="{ fill: ink(box.hue, 3) }"
          >
            {{ box.role }}
          </text>
          <!-- Purchase price, top right, with how the machine was acquired under it. -->
          <text class="od-box-cost" :x="CARD.x + CARD.w - 32" :y="box.y + 48" text-anchor="end">
            {{ box.cost }}
          </text>
          <text
            class="od-box-cost-note"
            :x="CARD.x + CARD.w - 32"
            :y="box.y + 74"
            text-anchor="end"
          >
            {{ box.costNote }}
          </text>
          <text class="od-box-name" :x="CARD.x + 32" :y="box.y + 78">{{ box.name }}</text>
          <text class="od-box-spec" :x="CARD.x + 32" :y="box.y + 110">
            {{ box.os }} · {{ box.cores }} cores · {{ box.ramGb }} GB RAM · {{ box.disk }}
          </text>
          <foreignObject :x="CARD.x + 28" :y="box.y + 126" :width="CARD.w - 56" height="40">
            <div xmlns="http://www.w3.org/1999/xhtml" class="od-box-services">
              <span v-for="svc in box.services" :key="svc" class="od-box-service">{{ svc }}</span>
            </div>
          </foreignObject>
        </g>

        <!-- Serving box gauges -->
        <g
          v-for="(g, i) in gauges"
          :key="g.id"
          :style="{
            opacity: String(gaugeRise(i)),
            transform: `translate(0, ${(1 - gaugeRise(i)) * 10}px)`,
          }"
        >
          <text class="od-gauge-label" :x="GAUGE.x" :y="g.y - 16">{{ g.label }}</text>
          <text class="od-gauge-text" :x="GAUGE.x + GAUGE.w" :y="g.y - 16" text-anchor="end">
            {{ g.text }}
          </text>
          <rect
            :x="GAUGE.x"
            :y="g.y"
            :width="GAUGE.w"
            :height="GAUGE.h"
            rx="7"
            :fill="TRACK_INK"
            fill-opacity="0.35"
          />
          <rect
            :x="GAUGE.x"
            :y="g.y"
            :width="Math.max(GAUGE.h, GAUGE.w * g.value * gaugeProgress(i))"
            :height="GAUGE.h"
            rx="7"
            :fill="g.wall ? diskInk : ink('slate', 3)"
            :style="{ fillOpacity: g.wall ? 0.35 + 0.65 * s.wall : 0.8 }"
            :filter="g.wall && s.wall > 0.5 ? filterUrl(FILTER_IDS.glow) : undefined"
            :class="{ 'is-wall': g.wall }"
          />
        </g>
        <!-- What takes the wall down, tagged under the gauge block so it clears the value labels. -->
        <text
          class="od-gauge-tag"
          :x="GAUGE.x + GAUGE.w"
          :y="gauges[gauges.length - 1].y + GAUGE.h + 36"
          text-anchor="end"
          :style="{
            fill: DISK_CLEAR,
            opacity: String(clamp01((s.clear - 0.5) / 0.5)),
            transform: `translate(0, ${(1 - clamp01((s.clear - 0.5) / 0.5)) * 6}px)`,
          }"
        >
          roadmap · cloud storage
        </text>

        <!-- Rule the load figure grows off -->
        <line
          :x1="FIGURE_RULE.x1"
          :x2="FIGURE_RULE.x2"
          :y1="FIGURE_RULE.y"
          :y2="FIGURE_RULE.y"
          :stroke="RULE_INK"
          :stroke-width="STROKE.rule"
          :style="{ opacity: String(s.rule) }"
        />
      </g>
    </template>

    <template #overlay>
      <h2 class="od-story-head is-wide">Two Mac Minis run production. Disk fills first.</h2>

      <div
        class="od-load-host"
        :style="{
          opacity: String(s.rule),
          transform: `translateY(${(1 - s.rule) * 12}px)`,
        }"
      >
        <!-- Two buckets: catalog and search traffic, and row reads through DuckDB. -->
        <InkNumber
          ref="apiFigure"
          :value="String(CEILING.api.reqPerSec)"
          suffix=" req/s"
          :label="`API calls · p95 ${CEILING.api.p95Ms} ms`"
          hue="cyan"
          :step="3"
          :size="5.2"
        />
        <InkNumber
          ref="datasetFigure"
          :value="String(CEILING.dataset.reqPerSec)"
          suffix=" req/s"
          :label="`dataset reads · p95 ${CEILING.dataset.p95Ms} ms`"
          hue="slate"
          :step="3"
          :size="3"
        />
      </div>
    </template>

    <template #card>
      <StoryCard anchor="left" hue="cyan" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>

<style scoped>
/* The disk gauge recolors when the wall comes down. */
.is-wall {
  transition: fill var(--od-dur-card) var(--od-settle);
}
.od-gauge-tag {
  font-family: var(--od-font-mono);
  font-size: 15px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.od-box-role {
  font-family: var(--od-font-mono);
  font-size: 17px;
  font-weight: 510;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.od-box-cost {
  font-family: var(--od-font-mono);
  font-size: 28px;
  font-weight: 510;
  font-variant-numeric: tabular-nums;
  fill: var(--od-text);
}
.od-box-cost-note {
  font-family: var(--od-font-mono);
  font-size: 15px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  fill: var(--od-text-faint);
}
.od-box-name {
  font-family: var(--od-font-sans);
  font-size: 32px;
  font-weight: 590;
  letter-spacing: -0.015em;
  fill: var(--od-text);
}
.od-box-spec {
  font-family: var(--od-font-mono);
  font-size: 19px;
  fill: var(--od-text-muted);
}
.od-box-services {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-family: var(--od-font-mono);
  font-size: 16px;
  color: var(--od-text-secondary);
}
.od-box-service {
  padding: 3px 10px;
  border: 1px solid var(--od-border);
  border-radius: 6px;
  white-space: nowrap;
}
.od-gauge-label {
  font-family: var(--od-font-sans);
  font-size: 22px;
  font-weight: 510;
  fill: var(--od-text);
}
.od-gauge-text {
  font-family: var(--od-font-mono);
  font-size: 19px;
  font-variant-numeric: tabular-nums;
  fill: var(--od-text-muted);
}
.od-load-host {
  position: absolute;
  left: calc(56.25 * var(--sw));
  top: calc(59 * var(--sh));
  display: flex;
  /* First-baseline alignment, not flex-end: the two figures are set at
     different sizes, so aligning their boxes leaves the numbers on two
     different baselines. A flex item's baseline is its first line box, which
     here is the figure itself. */
  align-items: baseline;
  gap: calc(2.4 * var(--sw));
}
</style>
