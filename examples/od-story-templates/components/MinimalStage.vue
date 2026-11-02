<script setup lang="ts">
/**
 * The smallest correct story stage: one series, one chip, three beats.
 *
 * Copy this file, rename it, swap the data and the copy. Everything a stage
 * needs is here once and nothing else is: the deck's real stages add marks,
 * not structure. `bun run new <alias> <dir> --story` writes this same file as
 * the deck's first stage.
 *
 * The same stage as `references/od-templates/components/StoryMinimalStage.vue`,
 * copied because components are deck-local and this gallery runs on the story
 * headmatter the conventional template deck does not carry.
 *
 * The stage lives in the deck's `components/` directory because Slidev
 * auto-imports from there. A component under `packages/decks/components/` would be
 * auto-imported into every deck in the package, which is not what a template
 * is for.
 */
import { reactive, ref } from 'vue'
import {
  DUR,
  useStage,
  xScale,
  yScale,
  type LineHandle,
  type RuleHandle,
} from 'slidev-addon-decks/story'

/** Illustrative series, in data units. A real stage imports from `data/*.ts`. */
const SERIES = [
  { x: 2021, y: 0.1 },
  { x: 2022, y: 0.3 },
  { x: 2023, y: 0.6 },
  { x: 2024, y: 1.0 },
  { x: 2025, y: 1.4 },
  { x: 2026, y: 1.9 },
]

const X_DOMAIN: [number, number] = [2021, 2026]
const Y_DOMAIN: [number, number] = [0, 2]
/** Pixel ranges in viewBox units of the 1920x1080 stage. y runs bottom first. */
const X_RANGE: [number, number] = [300, 1700]
const Y_RANGE: [number, number] = [620, 240]

/** The chip is placed by the same scales the line is drawn with. */
const CHIP_X = xScale(X_DOMAIN, X_RANGE)(2026)
const CHIP_Y = yScale(Y_DOMAIN, Y_RANGE)(1.9)

/**
 * One card per beat, in beat order. Its length is the beat count, so this
 * array and the `clicks:` in the manifest are the only two numbers that have
 * to agree (`beats.test.ts` checks that, and the eight/twenty word budget).
 */
const COPY = [
  { lead: 'A thousand datasets, hand curated.', body: 'Small enough to read end to end.' },
  { lead: 'Connectors made coverage compound.', body: 'One config ingests a whole portal.' },
  { lead: 'The index is the product now.', body: 'Every dataset joins the ones already there.' },
]

/** Child handles the beat script drives. They exist from mount, not setup. */
const line = ref<LineHandle | null>(null)
const rule = ref<RuleHandle | null>(null)

/** Beat state, every field 0 to 1. Marks read it; nothing else writes it. */
const s = reactive({ chip: 0, ghost: 0 })

const { clicks, copy, beats } = useStage({
  copy: COPY,
  /** One shot settle on landing: the baseline is there before the first beat. */
  enter: (tl) => rule.value?.addDraw(tl, 0),
  /** The beat script. Every tween reads a DUR constant; no bare numbers. */
  beats: (tl, beat) => {
    beat(0)
    line.value?.addDraw(tl)
    tl.to(s, { chip: 1, duration: DUR.card })
    beat(1)
    tl.to(s, { chip: 0, duration: DUR.opacity })
    tl.to(s, { ghost: 1, duration: DUR.color })
    beat(2)
  },
})
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <!-- Ink goes in the stage svg. Nothing here is keyed on `playCount`: a
         mark the beat script drives through a ref must stay outside that key,
         because the remount it forces would leave both timelines animating a
         child that is no longer mounted, and the line would never sweep. Both
         timelines re-arm on re-entry on their own (`addDraw` is a `fromTo`,
         and the beat timeline is a pure function of the click index), so the
         key buys nothing here. Reach for it only for state no timeline owns:
         a CSS keyframe, a canvas, a child with its own playhead. -->
    <template #stage>
      <g>
        <InkLine
          ref="line"
          :series="SERIES"
          :x-domain="X_DOMAIN"
          :y-domain="Y_DOMAIN"
          :x-range="X_RANGE"
          :y-range="Y_RANGE"
          hue="cyan"
          seed="minimal-growth"
          :ghost="s.ghost > 0.5"
        />
        <text class="od-stage-label" :x="X_RANGE[0]" :y="Y_RANGE[0] + 48">2021</text>
        <text class="od-stage-label" :x="X_RANGE[1]" :y="Y_RANGE[0] + 48" text-anchor="end">
          2026
        </text>
      </g>
    </template>

    <!-- The overlay is HTML over the stage, in the same coordinate space. -->
    <template #overlay>
      <!-- A StoryLayer is a second svg on a div, which is the only element a
           `vt-*` hand-off class can sit on. Without a class it is just ink. -->
      <StoryLayer>
        <InkRule ref="rule" :x1="X_RANGE[0]" :x2="X_RANGE[1]" :y="Y_RANGE[0]" seed="minimal-base" />
      </StoryLayer>

      <h2 class="od-story-head">The catalog doubled twice in five years.</h2>
      <InkChip :x="CHIP_X" :y="CHIP_Y" text="1.9M datasets" :progress="s.chip" />
    </template>

    <!-- The prose card cross-fades whenever its lead or body changes. -->
    <template #card>
      <StoryCard anchor="left" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>
