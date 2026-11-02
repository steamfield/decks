<script setup lang="ts">
/**
 * CodeInk: a monospaced block of raw data or SQL, in a drawn frame.
 *
 * The frame is a mark and lives in the stage's coordinate space; the code
 * itself is typeset HTML and is never filtered, which is the whole aesthetic
 * of the deck: drawn marks around crisp type.
 *
 * The component renders two siblings, an absolutely positioned full bleed
 * mark layer and an absolutely positioned text box, both placed from the same
 * `x/y/width/height` in stage viewBox units. It therefore belongs in a
 * StoryStage `#overlay` slot, not in `#stage`.
 *
 * `reveal` is one 0..1 prop that a parent tweens once: the first part of it
 * draws the frame left to right, the second fades the code in under it.
 *
 * `overflow` is the point of the raw data beat. A publisher's row does not
 * fit, so it is allowed to run out of the frame and off the slide rather than
 * being ellipsised into something that looks tidy.
 *
 * `lang="sql"` highlights the lines with the tokenizer in story/code-tokens.ts:
 * keywords in the frame's hue, literals and quoted dataset references in
 * amber, everything else in the body colour. Two accents, no third.
 *
 * `href` turns the block into a link. The overlay swallows pointer events, so
 * the text box opts back in, and because the drawn frame is a sibling layer
 * rather than a child, hover is tracked here and fed to both: CSS `:hover` on
 * the anchor cannot reach the svg.
 */
import { computed, ref } from 'vue'
import {
  FILTER_IDS,
  STAGE,
  STROKE,
  brushRibbon,
  clamp01,
  filterUrl,
  ink,
  inkStyle,
  tokenizeSql,
  type Hue,
  type InkStep,
  type Point,
} from '../story'

const props = withDefaults(
  defineProps<{
    /** Code lines, rendered verbatim. */
    lines: string[]
    /** Frame box in stage viewBox units. */
    x: number
    y: number
    width: number
    height: number
    /** Small caption above the block. Not filtered either. */
    label?: string
    hue?: Hue
    step?: InkStep
    /** Ink for the caption. Defaults to the frame ink. */
    labelColor?: string
    /** Let long lines run past the frame instead of being clipped. */
    overflow?: boolean
    /** Keep the block inside its frame and let the reader scroll the rest into view. */
    scroll?: boolean
    /** Paint the canvas under the code at 0.9 so it reads over busy stage marks. */
    surface?: boolean
    /** 0 is nothing, 1 is frame drawn and code faded in. */
    reveal?: number
    /** Code size in vw. */
    fontSize?: number
    /** Highlight the lines. Unset renders them as plain text. */
    lang?: 'sql'
    /** Make the block a link, opened in a new tab. */
    href?: string
    seed?: string
  }>(),
  {
    label: '',
    hue: 'slate',
    step: 2,
    labelColor: '',
    overflow: false,
    scroll: false,
    surface: false,
    reveal: 1,
    fontSize: 1,
    lang: undefined,
    href: undefined,
    seed: 'code-ink',
  },
)

const clean = inkStyle() === 'clean'

/** The frame draws over the first stretch of the reveal, the code over the second. */
const FRAME_SHARE = 0.6
const TEXT_START = 0.5

const frameProgress = computed(() => clamp01(props.reveal / FRAME_SHARE))
const textProgress = computed(() => clamp01((props.reveal - TEXT_START) / (1 - TEXT_START)))

const color = computed(() => ink(props.hue, props.step))

const outline = computed<Point[]>(() => {
  const { x, y, width: w, height: h } = props
  return [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
    { x, y },
  ]
})

const dabs = computed(() =>
  clean
    ? []
    : brushRibbon(outline.value, {
        seed: `${props.seed}:frame`,
        width: 3.4,
        taperIn: 0.02,
        taperOut: 0.04,
        startWidth: 0.8,
        endWidth: 0.6,
        wobble: 1.1,
        edge: 0.6,
        samples: 14,
      }),
)

const inkStyleAttr = computed(() => ({
  clipPath: `inset(0 ${(1 - frameProgress.value) * 100}% 0 0)`,
  color: color.value,
}))

const pct = (n: number, total: number) => `${(n / total) * 100}%`

const boxStyle = computed(() => ({
  left: pct(props.x, STAGE.width),
  top: pct(props.y, STAGE.height),
  width: pct(props.width, STAGE.width),
  height: pct(props.height, STAGE.height),
  fontSize: `calc(${props.fontSize} * var(--sw))`,
  opacity: String(textProgress.value),
  transform: `translateY(${(1 - textProgress.value) * 10}px)`,
}))

const captionColor = computed(() => props.labelColor || color.value)

/* ── Highlighting ── */

/** One entry per line, each a list of tokens. Plain text is one plain token. */
const rows = computed(() =>
  props.lines.map((line) =>
    props.lang === 'sql' ? tokenizeSql(line) : [{ text: line, kind: 'plain' as const }],
  ),
)

const LITERAL_INK = ink('amber', 3)
const tokenColor = (kind: string): string | undefined => {
  if (kind === 'keyword') return color.value
  if (kind === 'literal') return LITERAL_INK
  return undefined
}

/* ── Link ── */

/**
 * The frame is a sibling layer, not a child of the anchor, so hover is state
 * here rather than a CSS `:hover`. Focus counts as hover so the keyboard sees
 * the same affordance.
 */
const active = ref(false)
const isLink = computed(() => !!props.href)
/** Only take pointer input once the block is actually on screen, as StoryLink does. */
const interactive = computed(() => (isLink.value || props.scroll) && textProgress.value > 0.5)
const lit = computed(() => active.value && interactive.value)

/** Hover lifts the drawn frame out of its 0.7 resting opacity. */
const frameOpacity = computed(() => (lit.value ? 1 : 0.7))
</script>

<template>
  <div class="od-stage-layer" aria-hidden="true">
    <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
      <g :style="inkStyleAttr">
        <!-- Clean: a hairline frame. -->
        <template v-if="clean">
          <rect
            :x="props.x"
            :y="props.y"
            :width="props.width"
            :height="props.height"
            rx="10"
            fill="none"
            stroke="currentColor"
            :stroke-width="STROKE.rule"
            :stroke-opacity="frameOpacity"
          />
        </template>
        <g v-else :filter="filterUrl(FILTER_IDS.rule)">
          <path
            v-for="(dab, i) in dabs"
            :style="{ fillOpacity: dab.fillOpacity }"
            :key="i"
            :d="dab.d"
            fill="currentColor"
          />
        </g>
      </g>
    </svg>
  </div>

  <component
    :is="isLink ? 'a' : 'div'"
    class="od-codeink"
    :class="{
      'is-overflow': props.overflow,
      'is-scroll': props.scroll,
      'is-surface': props.surface,
      'is-link': isLink,
      'is-interactive': interactive,
      'is-lit': lit,
    }"
    :style="boxStyle"
    :href="props.href"
    :target="isLink ? '_blank' : undefined"
    :rel="isLink ? 'noopener' : undefined"
    @mouseenter="active = true"
    @mouseleave="active = false"
    @focus="active = true"
    @blur="active = false"
  >
    <div v-if="props.label" class="od-codeink-label" :style="{ color: captionColor }">
      {{ props.label }}
    </div>
    <pre class="od-codeink-body"><span
      v-for="(row, i) in rows"
      :key="i"
      class="od-codeink-line"
    ><span
      v-for="(token, j) in row"
      :key="j"
      :style="{ color: tokenColor(token.kind) }"
    >{{ token.text }}</span></span></pre>
  </component>
</template>

<style scoped>
/* Scoped rather than in the shared story CSS: it ships to every deck,
   and nothing outside this component needs these rules. */
.od-codeink {
  position: absolute;
  box-sizing: border-box;
  padding: calc(1.1 * var(--sw)) calc(1.4 * var(--sw));
  font-family: var(--od-font-mono);
  pointer-events: none;
}
/* A linked block carries no link styling: the affordance is the block lighting
   up, which is the drawn frame coming to full opacity and the surface lifting
   with it. `transform` belongs to the reveal tween, so hover never moves it. */
.od-codeink.is-link {
  color: inherit;
  text-decoration: none;
  /* Slidev's layouts-base.css gives every `a` in a slide a dashed bottom
     border (`border-current border-b border-dashed`), which drew a dotted rule
     across the foot of the block. The drawn frame is this block's border. */
  border: none;
  cursor: pointer;
  transition: background var(--od-dur-card) var(--od-settle);
}
/* Off screen the block is not a pointer target, the same opt-in StoryLink makes. */
.od-codeink.is-interactive {
  pointer-events: auto;
}
.od-codeink.is-link:focus-visible {
  outline: none;
}
.od-codeink.is-link.is-lit {
  border-radius: 10px;
  background: color-mix(in srgb, var(--od-surface) 80%, transparent);
}
.od-codeink.is-surface {
  border-radius: 10px;
  background: color-mix(in srgb, var(--od-canvas) 90%, transparent);
}
.od-codeink-label {
  margin-bottom: 0.75em;
  font-size: 0.78em;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}
.od-codeink-body {
  margin: 0;
  font: inherit;
  line-height: 1.75;
  color: var(--od-text-secondary);
}
.od-codeink-line {
  display: block;
  white-space: pre;
}
/* Tidy blocks stay inside their frame. */
.od-codeink:not(.is-overflow) .od-codeink-body {
  overflow: hidden;
  text-overflow: ellipsis;
}
/* A scrolling block stays inside the frame and lets the reader wheel the rest
   into view. The fade at the foot says there is more without a scrollbar
   drawing a bar down the block. */
.od-codeink.is-scroll {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.od-codeink.is-scroll .od-codeink-label {
  flex: none;
}
.od-codeink.is-scroll .od-codeink-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--od-border) transparent;
  mask-image: linear-gradient(to bottom, black calc(100% - 2.5em), transparent);
}
/* The raw row does not, on purpose: it runs out of the frame and off the
   slide, which is the claim the beat is making. */
.od-codeink.is-overflow {
  overflow: visible;
}
.od-codeink.is-overflow .od-codeink-body {
  width: max-content;
  overflow: visible;
}
</style>
