<script setup lang="ts">
/**
 * Slide 15: One OpenData result has text and a chart.
 *
 * Left, on a monitor, the first turn of the recorded OpenData session from
 * steamfield.io: the question, then search_datasets, query_sql and openchart.
 * Right, what the server sends. Four beats: the fourteen register calls; the
 * one WORKFLOW instruction line; a chart result splitting into the part the
 * model reads and the part only the interface gets; and the chart itself,
 * drawn inside the conversation from the session's own rows.
 *
 * Which code excerpt shows is a function of the click index. The session's
 * line count, the split and the chart are tweened.
 */
import { computed, reactive } from 'vue'
import { DRAW, DUR, SETTLE, STAGE, ink, useFrameScale, useStage } from 'slidev-addon-decks/story'
import { scaleChartTheme, slideChartAnimation, slideChartTheme } from 'slidev-addon-decks/chart-theme'
import { DIM, OFF, ON, type Pt } from './design'
import {
  CHART_DATA,
  CHART_MODEL_SAMPLE_ROWS,
  CHART_RESOURCE,
  CHART_SAMPLE_ROWS,
  RECORDED,
  SESSION,
  SHOWN,
  TOOLS_REGISTERED,
} from '../data/15-opendata'
import { TOOL_REGISTRY, WORKFLOW } from '../data/code/15-opendata'

const COPY = [
  {
    lead: 'The MCP server is TypeScript.',
    body: `It registers ${TOOLS_REGISTERED} tools and runs on Bun with Hono. The query engine is Python and DuckDB.`,
  },
  {
    lead: 'The server\u2019s instructions set the tool order.',
    body: 'The order is search, then SQL, then chart. Search results already include column schemas.',
  },
  {
    lead: 'Chart rows go to the interface only.',
    body: `The model reads the text. Up to ${CHART_SAMPLE_ROWS} rows are in _meta, which the host shows only to the interface.`,
  },
  {
    lead: 'The chart renders inside the chat.',
    body: `The interface is a React app. The host loads it in an iframe from the server's ui:// resource.`,
  },
]

/* ── Geometry, in stage viewBox units ── */
/** The session's monitor. The card sits bottom right, so this runs full height. */
const PANE = { x: 110, y: 196, width: 870, height: 754 }
/** The chart, inside the monitor's screen, under the transcript. */
const CHART = { x: 150, y: 566, width: 790, height: 318 }
/** The code pane, and later the result diagram, above the card. */
const CODE = { x: 1040, y: 196, width: 770, height: 494 }
const RESULT = { x: 1040, y: 240, w: 770, h: 206 }
const PART = { y: 300, h: 126 }
const PARTS = [
  { id: 'content', x: 1060, w: 190, note: 'text' },
  { id: 'structuredContent', x: 1270, w: 290, note: `spec, ${CHART_MODEL_SAMPLE_ROWS}-row sample` },
  { id: '_meta', x: 1580, w: 210, note: `up to ${CHART_SAMPLE_ROWS} rows` },
] as const
const READER = { y: 572, h: 108 }
const MODEL = { x: 1060, w: 300 }
const IFRAME = { x: 1470, w: 320 }
const JOIN_Y = 500

const partFoot = (i: number): Pt => [PARTS[i].x + PARTS[i].w / 2, PART.y + PART.h]
const modelTop: Pt = [MODEL.x + MODEL.w / 2, READER.y]
const iframeTop: Pt = [IFRAME.x + IFRAME.w / 2, READER.y]
const via = (from: Pt, to: Pt): Pt[] => [from, [from[0], JOIN_Y], [to[0], JOIN_Y], to]
const TO_MODEL = via(partFoot(0), modelTop)
const TO_IFRAME = [via(partFoot(1), iframeTop), via(partFoot(2), iframeTop)]

const PINK = ink('rose', 2)
const DATA = ink('cyan', 2)
const NEUTRAL = ink('slate', 2)

const s = reactive({ frame: OFF, lines: OFF, code: ON, split: OFF, flow: OFF, chart: OFF })

const { clicks, copy, beats } = useStage({
  copy: COPY,
  /* Landing: the monitor comes up and the question and the search post. */
  enter: (tl) => {
    tl.to(s, { frame: ON, duration: DUR.grow, ease: SETTLE })
    tl.to(s, { lines: SHOWN[0], duration: DUR.scale, ease: 'none' })
  },
  beats: (tl, beat) => {
    beat(0)

    // The query runs. The code pane changes file with the click index.
    tl.to(s, { lines: SHOWN[1], duration: DUR.scale, ease: 'none' })
    beat(1)

    // The chart call posts; its result opens on the right and splits.
    tl.to(s, { lines: SHOWN[2], duration: DUR.card, ease: 'none' })
    tl.to(s, { code: OFF, duration: DUR.color, ease: SETTLE }, '<')
    tl.to(s, { split: ON, duration: DUR.card, ease: SETTLE })
    tl.to(s, { flow: ON, duration: DUR.scale, ease: DRAW })
    beat(2)

    // The interface draws the chart in the conversation.
    tl.to(s, { chart: ON, duration: DUR.card, ease: SETTLE })
    beat(3)
  },
})

const excerpt = computed(() => (clicks.value >= 1 ? WORKFLOW : TOOL_REGISTRY))
const focus = computed<[number, number][]>(() => (clicks.value >= 1 ? [[3, 3]] : []))
/** Once the chart is up, the model's side of the split drops back. */
const modelSide = computed(() => String(ON - s.chart * (ON - DIM)))
const arrived = computed(() => s.flow >= ON)

const scale = useFrameScale()
const chartSpec = computed(() => {
  const base = scaleChartTheme(
    {
      ...slideChartTheme,
      fonts: { ...slideChartTheme.fonts, sizes: { ...slideChartTheme.fonts.sizes, body: 26, small: 24, axisTick: 26 } },
      spacing: { ...slideChartTheme.spacing, xAxisHeight: 58 },
    },
    scale.value,
  )
  return {
    mark: { type: 'bar' },
    // Bands draw bottom-up, so the largest change goes last to sit on top.
    data: [...CHART_DATA].reverse(),
    encoding: {
      y: { field: 'state', type: 'nominal', sort: null, axis: { title: '' } },
      x: { field: 'change', type: 'quantitative', axis: { title: 'Change since 2022 (%)', format: '.0f' } },
    },
    theme: { ...base, colors: { ...base.colors, categorical: [DATA] } },
    animation: slideChartAnimation,
    labels: { density: 'none' },
  } as never
})
const chartBox = {
  left: `${(CHART.x / STAGE.width) * 100}%`,
  top: `${(CHART.y / STAGE.height) * 100}%`,
  width: `${(CHART.width / STAGE.width) * 100}%`,
  height: `${(CHART.height / STAGE.height) * 100}%`,
}
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <!-- ── One chart result, and who reads which part (schematic) ── -->
      <g :style="{ opacity: String(s.split) }">
        <rect class="sf-box" :x="RESULT.x" :y="RESULT.y" :width="RESULT.w" :height="RESULT.h" />
        <text class="sf-mono" :x="RESULT.x + 22" :y="RESULT.y + 40">result of the openchart tool</text>

        <g v-for="(part, i) in PARTS" :key="part.id" :style="{ opacity: i === 0 ? modelSide : String(ON) }">
          <rect class="sf-box is-well" :x="part.x" :y="PART.y" :width="part.w" :height="PART.h" />
          <text class="sf-mono" :x="part.x + 16" :y="PART.y + 42" :style="{ fill: i === 0 ? NEUTRAL : DATA }">{{ part.id }}</text>
          <text class="od-part-note" :x="part.x + 16" :y="PART.y + 92">{{ part.note }}</text>
        </g>

        <g :style="{ opacity: modelSide }">
          <PacketPath :points="TO_MODEL" :progress="s.flow" :color="PINK" wire />
        </g>
        <PacketPath v-for="(path, i) in TO_IFRAME" :key="i" :points="path" :progress="s.flow" :color="DATA" wire />

        <g :style="{ opacity: modelSide, color: PINK }">
          <rect class="sf-box" :class="{ 'is-lit': arrived }" :x="MODEL.x" :y="READER.y" :width="MODEL.w" :height="READER.h" />
          <text class="sf-name" :x="MODEL.x + MODEL.w / 2" :y="READER.y + 50" text-anchor="middle">model</text>
          <text class="sf-mono is-small" :x="MODEL.x + MODEL.w / 2" :y="READER.y + 84" text-anchor="middle">reads the text</text>
        </g>
        <g :style="{ color: DATA }">
          <rect class="sf-box" :class="{ 'is-lit': arrived }" :x="IFRAME.x" :y="READER.y" :width="IFRAME.w" :height="READER.h" />
          <text class="sf-name" :x="IFRAME.x + IFRAME.w / 2" :y="READER.y + 50" text-anchor="middle">iframe</text>
          <text class="sf-mono is-small" :x="IFRAME.x + IFRAME.w / 2" :y="READER.y + 84" text-anchor="middle">{{ CHART_RESOURCE }}</text>
        </g>
      </g>
    </template>

    <template #overlay>
      <h2 class="od-story-head">OpenData sends text to the model, rows to the UI.</h2>
      <NamePlate id="opendata" />

      <TermPane
        :lines="SESSION"
        :shown="s.lines"
        :follow="false"
        :x="PANE.x"
        :y="PANE.y"
        :width="PANE.width"
        :height="PANE.height"
        :size="28"
        :tag="`Recorded ${RECORDED} · steamfield.io's OpenData session`"
        :progress="s.frame"
      />
      <div v-if="s.chart > OFF" class="od-chat-chart" :style="{ ...chartBox, opacity: String(s.chart) }">
        <OpenChart :spec="chartSpec" />
      </div>

      <CodePane
        :excerpt="excerpt"
        :focus="focus"
        :progress="s.frame * s.code"
        :x="CODE.x"
        :y="CODE.y"
        :width="CODE.width"
        :height="CODE.height"
        :size="21"
      />
      <EvidenceTag kind="schematic" :x="RESULT.x + RESULT.w" :y="RESULT.y - 44" align="right" :progress="s.split" />
      <ThreadRail current="opendata" />
    </template>

    <template #card>
      <StoryCard anchor="right" hue="rose" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>

<style scoped>
.od-part-note {
  font-family: var(--od-font-sans);
  font-size: var(--sf-svg-term);
  fill: var(--od-text-secondary);
}
.od-chat-chart {
  position: absolute;
}
</style>
