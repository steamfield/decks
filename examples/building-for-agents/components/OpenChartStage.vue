<script setup lang="ts">
/**
 * Slide 16: OpenChart tells the agent which field is wrong.
 *
 * Three columns: a chart spec as JSON, what `validateSpec` said about it, and
 * the chart. The verdict is the engine's real return value, computed when the
 * data module loads. Four beats: the spec; one misspelled field and the error
 * that names it; the field fixed, the verdict clean and the chart drawn by the
 * Vue wrapper; then the six packages by size.
 *
 * Which spec shows, which line is marked and what the verdict says are
 * functions of the click index. The chart and the package list are tweened.
 */
import { computed, reactive } from 'vue'
import { DRAW, DUR, SETTLE, STAGE, ink, stagger, useFrameScale, useStage } from 'slidev-addon-decks/story'
import { scaleChartTheme, slideChartAnimation, slideChartTheme } from 'slidev-addon-decks/chart-theme'
import { DIM, OFF, ON } from './design'
import {
  BAD_EXCERPT,
  ENGINE_VERSION,
  FIXED,
  FIXED_EXCERPT,
  PACKAGES,
  README_SPEC,
  SPEC_LABEL,
  TYPO_LINE,
  VERDICT,
} from '../data/16-openchart'

const COPY = [
  {
    lead: 'A chart is a JSON spec.',
    body: 'The spec names a mark and maps data columns to x and y. The engine computes the layout.',
  },
  {
    lead: 'The error names the misspelled field.',
    body: 'It has a JSON Pointer path, an error code, and a suggestion with the closest column name.',
  },
  {
    lead: 'With the field corrected, the spec validates.',
    body: 'validateSpec returns no errors and the Vue component draws the chart.',
  },
  {
    lead: 'Drawing is a separate package from the engine.',
    body: `vanilla draws the engine's layout to the DOM. The React, Vue and Svelte packages wrap vanilla.`,
  },
]

/* ── Geometry, in stage viewBox units ── */
const CODE = { x: 110, y: 196, width: 690, height: 504 }
const TILE = { x: 826, y: 196, width: 440, height: 504 }
const CHART = { x: 1292, y: 196, width: 518, height: 504 }
/** The package list, right of the card. One row per package. */
const LIST = { x: 850, y: 728, row: 36, name: 0, bar: 150, barMax: 470, barHeight: 18, gap: 16 }
const widest = Math.max(...PACKAGES.map((p) => p.lines))
const rows = PACKAGES.map((p, i) => ({
  ...p,
  y: LIST.y + 34 + i * LIST.row,
  width: Math.max(3, (p.lines / widest) * LIST.barMax),
  count: p.lines.toLocaleString('en-US'),
  top: p.lines === widest,
}))

const DATA = ink('cyan', 2)
const NEUTRAL = ink('slate', 1)

const s = reactive({ frame: OFF, verdict: OFF, chart: OFF, list: OFF })

const { clicks, copy, beats } = useStage({
  copy: COPY,
  enter: (tl) => tl.to(s, { frame: ON, duration: DUR.grow, ease: SETTLE }),
  beats: (tl, beat) => {
    beat(0)

    // The misspelled line is marked and the engine's error lands.
    tl.to(s, { verdict: ON, duration: DUR.card, ease: SETTLE })
    beat(1)

    // The field is fixed (the click index swaps the spec) and the chart draws.
    tl.to(s, { chart: ON, duration: DUR.card, ease: SETTLE })
    beat(2)

    // The packages, by size. The spec and the verdict drop back.
    tl.to(s, { list: ON, duration: DUR.scale, ease: DRAW })
    beat(3)
  },
})

/** idle before the first click, bad on it, ok from the second. */
const phase = computed(() => (clicks.value < 1 ? 'idle' : clicks.value < 2 ? 'bad' : 'ok'))
const excerpt = computed(() => (phase.value === 'ok' ? FIXED_EXCERPT : BAD_EXCERPT))
const focus = computed<[number, number][]>(() =>
  clicks.value === 1 || clicks.value === 2 ? [[TYPO_LINE, TYPO_LINE]] : [],
)
const back = computed(() => ON - s.list * (ON - DIM))
const rowProgress = (i: number) => stagger(s.list, i, rows.length, 0.12)

const scale = useFrameScale()
const chartSpec = computed(() => {
  const base = scaleChartTheme(
    {
      ...slideChartTheme,
      fonts: {
        ...slideChartTheme.fonts,
        sizes: { ...slideChartTheme.fonts.sizes, subtitle: 24, body: 24, small: 21, axisTick: 24 },
      },
    },
    scale.value,
  )
  return {
    ...README_SPEC,
    theme: { ...base, colors: { ...base.colors, categorical: [DATA] } },
    animation: slideChartAnimation,
    labels: { density: 'none' },
  } as never
})

const place = (box: { x: number; y: number; width: number; height: number }) => ({
  left: `${(box.x / STAGE.width) * 100}%`,
  top: `${(box.y / STAGE.height) * 100}%`,
  width: `${(box.width / STAGE.width) * 100}%`,
  height: `${(box.height / STAGE.height) * 100}%`,
})
/** The replacement label sits where the pane's own label is: its top left. */
const labelBox = { left: place(CODE).left, top: place(CODE).top, width: place(CODE).width }
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <!-- ── The six packages, by lines of source ── -->
      <g :style="{ opacity: String(s.list) }">
        <text class="sf-pixel is-small" :x="LIST.x" :y="LIST.y + 8">Lines of TypeScript, excluding tests</text>
        <g v-for="(row, i) in rows" :key="row.name" :style="{ opacity: String(rowProgress(i)) }">
          <text class="sf-mono" :x="LIST.x + LIST.name" :y="row.y + 6" :style="{ fill: row.top ? DATA : undefined }">{{ row.name }}</text>
          <rect
            :x="LIST.x + LIST.bar"
            :y="row.y - LIST.barHeight + 6"
            :width="row.width * rowProgress(i)"
            :height="LIST.barHeight"
            rx="2"
            :fill="row.top ? DATA : NEUTRAL"
          />
          <text class="sf-mono is-small" :x="LIST.x + LIST.bar + row.width + LIST.gap" :y="row.y + 5">
            {{ row.count }} · {{ row.role }}
          </text>
        </g>
      </g>
    </template>

    <template #overlay>
      <h2 class="od-story-head">OpenChart validation reports which field is wrong.</h2>
      <NamePlate id="openchart" />

      <!-- The spec. CodePane has no tone for one marked line and prints a file
           path as its label, so this wrapper recolors the focused line and
           replaces the label. -->
      <div class="oc-spec" :class="`is-${phase}`">
        <CodePane
          :excerpt="excerpt"
          :focus="focus"
          :progress="s.frame * back"
          :x="CODE.x"
          :y="CODE.y"
          :width="CODE.width"
          :height="CODE.height"
          :size="21"
        />
        <div class="oc-spec-label" :style="{ ...labelBox, opacity: String(s.frame * back) }">{{ SPEC_LABEL }}</div>
      </div>

      <!-- What validateSpec returned -->
      <div class="oc-verdict" :class="`is-${phase}`" :style="{ ...place(TILE), opacity: String(s.frame * back) }">
        <div class="oc-verdict-head">validateSpec(spec)</div>
        <div class="oc-verdict-run">engine {{ ENGINE_VERSION }}, run in this page</div>
        <dl v-if="phase === 'bad'" class="oc-verdict-rows" :style="{ opacity: String(s.verdict) }">
          <dt>valid</dt>
          <dd class="is-state">false</dd>
          <dt>path</dt>
          <dd>{{ VERDICT.path }}</dd>
          <dt>code</dt>
          <dd>{{ VERDICT.code }}</dd>
          <dt>suggestion</dt>
          <dd class="is-prose">{{ VERDICT.suggestion }}</dd>
        </dl>
        <dl v-else-if="phase === 'ok'" class="oc-verdict-rows">
          <dt>valid</dt>
          <dd class="is-state">{{ FIXED.valid }}</dd>
          <dt>errors</dt>
          <dd>{{ FIXED.errors }}</dd>
        </dl>
      </div>

      <!-- The chart, drawn by the addon's Vue wrapper from the same spec -->
      <div class="oc-chart" :style="place(CHART)">
        <OpenChart v-if="s.chart > OFF" :spec="chartSpec" :style="{ opacity: String(s.chart) }" />
      </div>

      <ThreadRail current="openchart" />
    </template>

    <template #card>
      <StoryCard anchor="left" hue="rose" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>

<style scoped>
.oc-spec { display: contents; }
.oc-spec :deep(.sf-code-label) { visibility: hidden; }
.oc-spec-label {
  position: absolute;
  box-sizing: border-box;
  padding: calc(0.9 * var(--sw)) calc(1.2 * var(--sw)) 0;
  font-family: var(--od-font-mono);
  font-size: calc(0.9375 * var(--sw));
  color: var(--od-text-muted);
  white-space: nowrap;
  pointer-events: none;
}
.oc-spec.is-bad :deep(.sf-code-line:not(.is-cold) span) { color: var(--od-pink); }
.oc-spec.is-ok :deep(.sf-code-line:not(.is-cold) span) { color: var(--od-phosphor); }

.oc-verdict {
  position: absolute;
  box-sizing: border-box;
  padding: calc(0.9 * var(--sw)) calc(1.2 * var(--sw));
  border: var(--sf-hairline) solid var(--od-border-rule);
  border-radius: var(--sf-radius-card);
  background: color-mix(in srgb, var(--od-screen-black) 82%, transparent);
  transition: border-color var(--od-dur-card) var(--od-settle);
}
.oc-verdict.is-bad { border-color: var(--od-pink); }
.oc-verdict.is-ok { border-color: var(--od-phosphor); }
.oc-verdict-head {
  font-family: var(--od-font-mono);
  font-size: calc(1.25 * var(--sw));
  color: var(--od-text);
}
.oc-verdict-run {
  margin-top: calc(0.5 * var(--sw));
  font-family: var(--sf-font-pixel);
  font-size: calc(0.6771 * var(--sw));
  line-height: var(--sf-pixel-leading);
  text-transform: uppercase;
  color: var(--od-text-muted);
}
.oc-verdict-rows { margin: calc(1.1 * var(--sw)) 0 0; }
.oc-verdict-rows dt {
  font-family: var(--sf-font-pixel);
  font-size: calc(0.6771 * var(--sw));
  text-transform: uppercase;
  color: var(--od-text-muted);
}
.oc-verdict-rows dd {
  margin: calc(0.25 * var(--sw)) 0 calc(0.8 * var(--sw));
  font-family: var(--od-font-mono);
  font-size: calc(1.09375 * var(--sw));
  color: var(--od-text);
  overflow-wrap: anywhere;
}
.oc-verdict-rows dd.is-prose {
  font-family: var(--od-font-sans);
  font-size: calc(1.40625 * var(--sw));
  line-height: 1.1;
  color: var(--od-text-secondary);
}
.oc-verdict.is-bad dd.is-state { color: var(--od-pink); }
.oc-verdict.is-ok dd.is-state { color: var(--od-phosphor); }

.oc-chart {
  position: absolute;
  box-sizing: border-box;
  padding: calc(0.6 * var(--sw));
  border: var(--sf-hairline) dashed var(--od-border-rule);
  border-radius: var(--sf-radius-card);
}
</style>
