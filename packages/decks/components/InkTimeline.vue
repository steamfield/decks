<script setup lang="ts">
/**
 * InkTimeline: a horizontal run of dated tick marks on the stage.
 *
 * One hairline rule, one tick per dated event, and a typeset label under each
 * tick. Labels never rotate, because a rotated label is unreadable from the
 * back of a room. They stack instead: a greedy pass measures each label at the
 * label font size and drops it to the first row where it clears the label
 * before it, up to `labelRows` rows, with a thin leader from the rule down to
 * any label that is not on the first row. A `bright` tick is the same hue at a
 * higher ramp step with a soft glow, so recency reads as brightness rather
 * than as a second colour. A `projected` tick (a date still ahead) is drawn
 * as a dotted stroke, so the boundary between past and ahead shows on the
 * rule itself.
 *
 * Default rendering is clean: round capped stroked lines. The marker branch
 * (dab ribbons through `brushRibbon`) only runs when `inkStyle()` says so.
 *
 * The component owns no timeline. It exposes one reactive entry per tick
 * (`ink` and `lift`, both 0 to 1) plus two builders, so the slide's own
 * `useStoryTimeline` decides the pacing and the beat labels.
 */
import { computed, reactive } from 'vue'
import {
  DRAW,
  DUR,
  FILTER_IDS,
  STROKE,
  brushRibbon,
  filterUrl,
  gsap,
  ink,
  inkStyle,
  xScale,
  type Hue,
  type InkStep,
  type TickState,
  type TimelineTick,
} from '../story'

const props = withDefaults(
  defineProps<{
    ticks: TimelineTick[]
    domain: [number, number]
    /** Left to right pixel range in viewBox units. */
    range: [number, number]
    /** Baseline y in viewBox units. */
    y: number
    hue?: Hue
    /** Ramp step for the ordinary set. */
    step?: InkStep
    /** Ramp step for the bright set. */
    brightStep?: InkStep
    /** Tick height above the rule, in viewBox units. */
    tickHeight?: number
    /** Stroke width of a tick, in viewBox units. */
    tickWidth?: number
    /** Clear space two labels need between them to share a row. */
    labelGap?: number
    /** Vertical distance from the rule to the first label row. */
    labelOffset?: number
    /** Vertical distance between label rows. */
    rowHeight?: number
    /** Label font size in viewBox units. Set inline, so it beats story-marks.css. */
    labelSize?: number
    /** How many rows labels may stack into before they start overprinting. */
    labelRows?: number
    /** Beat state owned by the slide. Omit to let the component own it. */
    state?: TickState[]
  }>(),
  {
    hue: 'cyan',
    step: 2,
    brightStep: 4,
    tickHeight: 74,
    tickWidth: STROKE.tick,
    labelGap: 14,
    labelOffset: 46,
    rowHeight: 38,
    labelSize: 26,
    labelRows: 4,
  },
)

/**
 * Conservative character-width estimate for label collision spacing. The
 * Inter is proportional; keep the existing spacing budget.
 */
const MONO_ADVANCE = 0.6

const clean = computed(() => inkStyle() === 'clean')
const GLOW = filterUrl(FILTER_IDS.glow)

const sx = computed(() => xScale(props.domain, props.range))

/**
 * Tick geometry plus a label row assignment.
 *
 * Ticks are walked left to right and each label takes the first row whose
 * last label ends far enough to its left. With more ticks packed together
 * than `labelRows` can hold, the least crowded row takes the overflow, which
 * is the only case that can still overprint and is a sign the labels are too
 * long rather than that the layout is wrong.
 */
const marks = computed(() => {
  const scale = sx.value
  const halfChar = (props.labelSize * MONO_ADVANCE) / 2
  const rowRight = new Array<number>(Math.max(1, props.labelRows)).fill(-Infinity)

  const ordered = props.ticks
    .map((tick, index) => ({ tick, index, x: scale(tick.at) }))
    .sort((a, b) => a.x - b.x || a.index - b.index)

  const rowOf = new Array<number>(props.ticks.length).fill(0)
  for (const { tick, index, x } of ordered) {
    const half = tick.label.length * halfChar
    let row = rowRight.findIndex((right) => x - half >= right + props.labelGap)
    if (row < 0) row = rowRight.indexOf(Math.min(...rowRight))
    rowRight[row] = x + half
    rowOf[index] = row
  }

  return props.ticks.map((tick, index) => {
    const x = scale(tick.at)
    const row = rowOf[index]
    const top = props.y - props.tickHeight * (tick.bright ? 1 : 0.66)
    const foot = props.y + props.tickWidth * 2
    return {
      id: tick.id,
      label: tick.label,
      bright: !!tick.bright,
      projected: !!tick.projected,
      x,
      row,
      top,
      foot,
      labelY: props.y + props.labelOffset + row * props.rowHeight,
      // Clean mode draws a stroked line, so the ribbon geometry is dead weight.
      dabs: clean.value
        ? []
        : brushRibbon(
            [
              { x, y: foot },
              { x, y: top },
            ],
            {
              seed: `ink-timeline:${tick.id}`,
              width: props.tickWidth * 3,
              taperIn: 0.08,
              taperOut: 0.3,
              startWidth: 0.8,
              endWidth: 0.3,
              wobble: 1.8,
              edge: 1.1,
              samples: 11,
            },
          ),
      index,
    }
  })
})

const baseInk = computed(() => ink(props.hue, props.step))
const brightInk = computed(() => ink(props.hue, props.brightStep))
const ruleInk = computed(() => ink('slate', 1))

const own = reactive<TickState[]>(props.ticks.map(() => ({ ink: 0, lift: 0 })))

/** The array the template reads: the slide's, when it passed one in. */
const beats = computed<TickState[]>(() => props.state ?? own)

/** Ink every tick in date order, one after the next at the tick cadence. */
function addInk(tl: gsap.core.Timeline, position?: gsap.Position): gsap.core.Timeline {
  return tl.to(beats.value, { ink: 1, duration: DUR.draw, ease: DRAW, stagger: DUR.tick }, position)
}

/** Hand one tick off: it scales down and out over the morph duration. */
function addLift(tl: gsap.core.Timeline, id: string, position?: gsap.Position): gsap.core.Timeline {
  const index = props.ticks.findIndex((tick) => tick.id === id)
  if (index < 0) return tl
  return tl.to(beats.value[index], { lift: 1, duration: DUR.morph }, position)
}

/** Stage x of one tick, so a slide can park an overlay on top of it. */
function tickX(id: string): number {
  return sx.value(props.ticks.find((tick) => tick.id === id)?.at ?? props.domain[0])
}

defineExpose({ state: own, addInk, addLift, tickX })
</script>

<template>
  <g class="od-ink-timeline">
    <line
      class="od-tl-rule"
      :x1="props.range[0] - 40"
      :x2="props.range[1] + 40"
      :y1="props.y"
      :y2="props.y"
      :stroke="ruleInk"
      :stroke-width="STROKE.rule"
      stroke-opacity="0.55"
    />

    <g
      v-for="mark in marks"
      :key="mark.id"
      :style="{
        color: mark.bright ? brightInk : baseInk,
        opacity: String(beats[mark.index].ink),
      }"
    >
      <!-- Only the mark travels on a hand off. Its label stays, because the
           tick is one of a counted set and the count is the claim. -->
      <g
        :style="{
          opacity: String(1 - beats[mark.index].lift),
          transformOrigin: `${mark.x}px ${props.y}px`,
          transform: `scale(${1 - 0.75 * beats[mark.index].lift})`,
        }"
      >
        <line
          v-if="clean"
          :x1="mark.x"
          :x2="mark.x"
          :y1="mark.foot"
          :y2="mark.top"
          stroke="currentColor"
          :stroke-width="props.tickWidth"
          stroke-linecap="round"
          :stroke-dasharray="mark.projected ? `0 ${props.tickWidth * 2.5}` : undefined"
          :filter="mark.bright ? GLOW : undefined"
        />
        <g v-else :filter="filterUrl(FILTER_IDS.dry)">
          <path
            v-for="(dab, i) in mark.dabs"
            :style="{ fillOpacity: dab.fillOpacity }"
            :key="i"
            :d="dab.d"
            fill="currentColor"
          />
        </g>
      </g>

      <line
        v-if="mark.row > 0"
        :x1="mark.x"
        :x2="mark.x"
        :y1="mark.foot"
        :y2="mark.labelY - props.labelSize"
        stroke="currentColor"
        stroke-width="1"
        stroke-opacity="0.45"
      />

      <text
        class="od-stage-label"
        :class="{ 'is-end': mark.bright }"
        :x="mark.x"
        :y="mark.labelY"
        text-anchor="middle"
        :style="{ fontSize: `${props.labelSize}px` }"
      >
        {{ mark.label }}
      </text>
    </g>
  </g>
</template>
