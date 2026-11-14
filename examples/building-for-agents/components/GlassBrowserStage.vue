<script setup lang="ts">
/**
 * Slide 13: the StatGlass UI also runs in a browser tab.
 *
 * Two beats. On entry a fork draws on the left: the React UI calls a
 * Transport interface, which has a Tauri implementation and a mock one, and
 * the mock branch lights. Beside it is the interface itself, real code. The
 * click swaps the code for a browser frame holding the real dashboard running
 * on that mock; the fork stays, dimmed except for the branch feeding the frame.
 *
 * The dashboard is the hosted demo in an iframe. It mounts only in the real
 * slide view, once this slide is active and on its second beat, and is
 * released when the slide is left. Everywhere else (presenter, overview,
 * export) and until it has loaded, the frame shows a placeholder. The iframe
 * is laid out at a fixed width and scaled to the frame, so the dashboard looks
 * the same on any projector. It takes pointer events, so it can be clicked
 * during the talk; a click inside it also takes keyboard focus, so click the
 * slide outside the frame before pressing an arrow key.
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, unref, watch } from 'vue'
import { useSlideContext } from '@slidev/client'
import { DRAW, DUR, SETTLE, STAGE, ink, useStage } from 'slidev-addon-decks/story'
import { DIM, OFF, ON, polyline, type Pt } from './design'
import {
  DEMO_ADDRESS,
  DEMO_LAYOUT_WIDTH,
  DEMO_URL,
  IMPLEMENTATIONS,
  INTERFACE,
  LINT_RULE,
  UI,
} from '../data/13-glass-browser'
import { TRANSPORT_INTERFACE } from '../data/code/13-glass-browser'

const COPY = [
  {
    lead: 'React code calls a Transport interface.',
    body: 'One implementation calls Tauri and the other is a mock. A lint rule bans Tauri imports under src/app.',
  },
  {
    lead: 'The mock runs the app without Tauri.',
    body: 'Vitest, Playwright, the browser dev server and the docs site demo all use it.',
  },
]

/* ── Geometry, in stage viewBox units ── */
const AXIS_X = 455
const UI_BOX = { x: 300, y: 276, w: 310, h: 84 }
const FACE = { x: 250, y: 440, w: 410, h: 84 }
const IMPL = { y: 596, w: 330, h: 94, xs: [110, 470] }
const FORK_Y = 560
const implMid = (i: number) => IMPL.xs[i] + IMPL.w / 2
const impls = IMPLEMENTATIONS.map((impl, i) => ({ ...impl, x: IMPL.xs[i], mock: impl.id === 'mock' }))

const TO_FACE: Pt[] = [
  [AXIS_X, UI_BOX.y + UI_BOX.h],
  [AXIS_X, FACE.y],
]
const branch = (i: number): Pt[] => [
  [AXIS_X, FACE.y + FACE.h],
  [AXIS_X, FORK_Y],
  [implMid(i), FORK_Y],
  [implMid(i), IMPL.y],
]

const CODE_BOX = { x: 840, y: 276, width: 970, height: 490 }
const BROWSER = { x: 840, y: 196, w: 970, h: 704 }
/** From the mock box into the frame. */
const TO_FRAME: Pt[] = [
  [IMPL.xs[1] + IMPL.w, IMPL.y + IMPL.h / 2],
  [BROWSER.x, IMPL.y + IMPL.h / 2],
]

const DATA = ink('cyan', 2)

/** `code` is the entrance's; `swap` is the click's. No field is driven by both. */
const s = reactive({ frame: OFF, mock: OFF, code: OFF, swap: OFF, demo: OFF })

const { clicks, isActive, copy, beats } = useStage({
  copy: COPY,
  enter: (tl) => {
    tl.to(s, { frame: ON, duration: DUR.grow, ease: SETTLE })
    tl.to(s, { code: ON, duration: DUR.card, ease: SETTLE }, `-=${DUR.card}`)
    tl.to(s, { mock: ON, duration: DUR.grow, ease: DRAW })
  },
  beats: (tl, beat) => {
    beat(0)
    // The code gives way to the app itself, fed by the lit branch.
    tl.to(s, { swap: ON, duration: DUR.opacity, ease: SETTLE })
    tl.to(s, { demo: ON, duration: DUR.card, ease: SETTLE })
    beat(1)
  },
})

const op = (value: number) => String(value)
/** What the second beat is no longer about. */
const rest = computed(() => op(s.frame * (ON - s.demo * (ON - DIM))))
const mockLit = computed(() => s.mock > 0.5)

const box = (b: { x: number; y: number; w: number; h: number }) => ({
  left: `${(b.x / STAGE.width) * 100}%`,
  top: `${(b.y / STAGE.height) * 100}%`,
  width: `${(b.w / STAGE.width) * 100}%`,
  height: `${(b.h / STAGE.height) * 100}%`,
})

/* ── The live demo ── */
const { $renderContext } = useSlideContext()
const inSlideView = unref($renderContext) === 'slide'
const onDemoBeat = computed(() => clicks.value >= 1)
const live = computed(() => inSlideView && isActive.value && onDemoBeat.value)
const loaded = ref(false)
watch(live, (now) => {
  if (!now) loaded.value = false
})

/** The iframe keeps one layout width; the frame scales it to whatever it measures. */
const view = ref<HTMLElement | null>(null)
const fit = reactive({ scale: ON, height: OFF })
let observer: ResizeObserver | null = null
function measure() {
  const el = view.value
  if (!el || el.clientWidth === 0) return
  fit.scale = el.clientWidth / DEMO_LAYOUT_WIDTH
  fit.height = el.clientHeight / fit.scale
}
onMounted(() => {
  measure()
  if (typeof ResizeObserver === 'undefined' || !view.value) return
  observer = new ResizeObserver(measure)
  observer.observe(view.value)
})
onBeforeUnmount(() => observer?.disconnect())
const iframeStyle = computed(() => ({
  width: `${DEMO_LAYOUT_WIDTH}px`,
  height: `${fit.height}px`,
  transform: `scale(${fit.scale})`,
  opacity: loaded.value ? '1' : '0',
}))
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #stage>
      <!-- ── The fork (schematic) ── -->
      <g :style="{ opacity: rest }">
        <path class="sf-wire" :d="polyline(TO_FACE)" />
        <path class="sf-wire" :d="polyline(branch(0))" />

        <rect class="sf-box" :x="UI_BOX.x" :y="UI_BOX.y" :width="UI_BOX.w" :height="UI_BOX.h" />
        <text class="sf-name" :x="UI_BOX.x + 24" :y="UI_BOX.y + 40">{{ UI.name }}</text>
        <text class="sf-mono is-small" :x="UI_BOX.x + 24" :y="UI_BOX.y + 68">{{ UI.path }}</text>

        <text v-for="(line, i) in LINT_RULE" :key="line" class="sf-mono is-small" :x="AXIS_X + 22" :y="UI_BOX.y + UI_BOX.h + 30 + i * 24">
          {{ line }}
        </text>

        <rect class="sf-boundary" :x="FACE.x" :y="FACE.y" :width="FACE.w" :height="FACE.h" />
        <text class="sf-mono" :x="FACE.x + 24" :y="FACE.y + 38">{{ INTERFACE.name }}</text>
        <text class="sf-mono is-small" :x="FACE.x + 24" :y="FACE.y + 66">{{ INTERFACE.path }}</text>

        <g v-for="impl in impls.filter((i) => !i.mock)" :key="impl.id">
          <rect class="sf-box" :x="impl.x" :y="IMPL.y" :width="IMPL.w" :height="IMPL.h" />
          <text class="sf-name" :x="impl.x + 24" :y="IMPL.y + 42">{{ impl.name }}</text>
          <text class="sf-mono is-small" :x="impl.x + 24" :y="IMPL.y + 72">{{ impl.note }}</text>
        </g>
      </g>

      <!-- The mock branch stays lit through both beats. -->
      <g :style="{ opacity: op(s.frame), color: DATA }">
        <path class="sf-wire" :d="polyline(branch(1))" :style="{ stroke: mockLit ? DATA : undefined }" />
        <path class="sf-wire" :d="polyline(TO_FRAME)" :style="{ stroke: DATA, opacity: op(s.demo) }" />
        <g v-for="impl in impls.filter((i) => i.mock)" :key="impl.id">
          <rect class="sf-box" :class="{ 'is-lit': mockLit }" :x="impl.x" :y="IMPL.y" :width="IMPL.w" :height="IMPL.h" />
          <text class="sf-name" :x="impl.x + 24" :y="IMPL.y + 42">{{ impl.name }}</text>
          <text class="sf-mono is-small" :x="impl.x + 24" :y="IMPL.y + 72">{{ impl.note }}</text>
        </g>
      </g>
    </template>

    <template #overlay>
      <h2 class="od-story-head">The StatGlass UI also runs in a browser tab.</h2>
      <NamePlate id="statglass" chip-only />
      <EvidenceTag kind="schematic" :x="110" :y="226" :progress="s.frame" />

      <CodePane :excerpt="TRANSPORT_INTERFACE" :focus="[[1, 2], [4, 4], [6, 10], [12, 12]]" :progress="s.code * (ON - s.swap)" v-bind="CODE_BOX" />

      <!-- ── The app, in a browser frame ── -->
      <div class="glass-browser" :class="{ 'is-on': onDemoBeat }" :style="{ ...box(BROWSER), opacity: op(s.demo) }">
        <div class="glass-browser-bar">
          <span class="glass-browser-dots"><i /><i /><i /></span>
          <span class="glass-browser-address">{{ DEMO_ADDRESS }}</span>
        </div>
        <div ref="view" class="glass-browser-view">
          <div class="glass-browser-wait">
            <span class="glass-browser-url">{{ DEMO_ADDRESS }}</span>
            <span class="glass-browser-line">Live demo loads in the slide view</span>
          </div>
          <iframe
            v-if="live"
            class="glass-browser-app"
            :src="DEMO_URL"
            :style="iframeStyle"
            title="StatGlass dashboard, running on its mock transport"
            referrerpolicy="no-referrer"
            @load="loaded = true"
          />
        </div>
      </div>
      <EvidenceTag kind="illustrative" :x="BROWSER.x + BROWSER.w" :y="BROWSER.y + BROWSER.h + 12" align="right" :progress="s.demo">
        Illustrative data · the real app, mock transport
      </EvidenceTag>

      <ThreadRail current="statglass" />
    </template>

    <template #card>
      <StoryCard anchor="left" hue="cyan" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>

<style scoped>
.glass-browser {
  position: absolute;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: var(--sf-hairline) solid var(--od-border-rule);
  border-radius: var(--sf-radius-card);
  background: var(--od-surface);
  pointer-events: none;
}
/* The overlay ignores the pointer; the frame takes it back once it is shown. */
.glass-browser.is-on { pointer-events: auto; }
.glass-browser-bar {
  display: flex;
  align-items: center;
  gap: calc(1 * var(--sw));
  padding: calc(0.6 * var(--sw)) calc(0.9 * var(--sw));
  border-bottom: var(--sf-hairline) solid var(--od-border-rule);
}
.glass-browser-dots {
  display: flex;
  gap: calc(0.42 * var(--sw));
}
.glass-browser-dots i {
  width: calc(0.62 * var(--sw));
  height: calc(0.62 * var(--sw));
  border-radius: var(--sf-full);
  background: var(--od-text-faint);
}
.glass-browser-address {
  flex: 1;
  min-width: 0;
  padding: calc(0.3 * var(--sw)) calc(0.8 * var(--sw));
  border-radius: var(--sf-radius-control);
  background: var(--od-well);
  font-family: var(--od-font-mono);
  font-size: calc(0.9375 * var(--sw));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--od-text-secondary);
}
.glass-browser-view {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: var(--od-screen-black);
}
.glass-browser-wait {
  position: absolute;
  inset: var(--sf-zero);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: calc(1.1 * var(--sw));
  text-align: center;
}
.glass-browser-url {
  font-family: var(--od-font-mono);
  font-size: calc(0.9375 * var(--sw));
  color: var(--od-text-muted);
}
.glass-browser-line {
  font-family: var(--od-font-sans);
  font-size: calc(2.1 * var(--sw));
  color: var(--od-phosphor);
}
.glass-browser-app {
  position: absolute;
  top: var(--sf-zero);
  left: var(--sf-zero);
  border: none;
  transform-origin: top left;
  pointer-events: auto;
  transition: opacity var(--od-dur-card) var(--od-settle);
}
</style>
