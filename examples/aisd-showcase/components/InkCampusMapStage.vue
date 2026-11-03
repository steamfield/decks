<script setup lang="ts">
/**
 * Slide 12: AISD campuses by eco-dis share, then by TEA rating.
 */
import { computed, onMounted, onScopeDispose, ref, watch } from 'vue'
import { GeoMap } from '@opendata-ai/openchart-vue'
import type { GeoMapSpec } from '@opendata-ai/openchart-core'
import { fadeIn, fadeOutInPlace, useStage } from 'slidev-addon-decks/story'
import { slideChartTheme } from 'slidev-addon-decks/chart-theme'
import {
  AISD_CAMPUSES, AISD_CAMPUSES_BUCKETED,
  ECO_DIS_DOMAIN, ECO_DIS_RANGE_DARK,
  RATING_DOMAIN, ratingRange,
  ARTICLE_URL,
} from '../data/09b-campus-map'
import austinZipsTopo from '../data/austin-zips.json'

// The per-beat emphasis sets mirror the blog's AisdRatingsMapScrolly.
const STEPS: (Set<string> | null)[] = [
  null,                    // beat 0: eco-dis coloring (rating range unused)
  null,                    // beat 1: all ratings vivid
  new Set(['F']),          // beat 2: F vivid, rest muted
  new Set(['A', 'B']),     // beat 3: A+B vivid, rest muted
]

const COPY = [
  { lead: 'The east side lights up.', body: 'Each dot is a campus, brighter the poorer it is.' },
  { lead: 'Same dots, now colored by rating.', body: 'TEA accountability grades, A through F.' },
  { lead: 'The F campuses trace east Austin.', body: 'F campuses average 91% economically disadvantaged.' },
  { lead: 'The A campuses sit on the west side.', body: 'A campuses average 16%.' },
]

// Four labels at time 0 and no tweens: the stage motion is the GeoMap's own
// recolor between specs, so the beat timeline exists only to give `useStage`
// its label set. The beats are not missing.
const { clicks, isActive, copy, beats } = useStage({ copy: COPY, beats: (tl, beat) => {
  beat(0); beat(1); beat(2); beat(3)
} })

/**
 * The GeoMap's own box, measured in real pixels.
 *
 * Everything the map compiles is in the pixel size it measures on its
 * container, including `geo.focus.padding`, so a constant there would mean a
 * different composition at every window size. The box is sized in frame units,
 * so its measured width is proportional to the frame, and a padding expressed
 * as a fraction of it holds at any size. The map does not render until the
 * first measurement, so it never compiles against a stale zoom.
 */
const FOCUS_PAD = 0.0817
const camera = ref<HTMLElement | null>(null)
const mapPx = ref(0)
let ro: ResizeObserver | null = null
onMounted(() => {
  const el = camera.value
  if (!el) return
  const read = () => { mapPx.value = el.getBoundingClientRect().width }
  read()
  ro = new ResizeObserver(read)
  ro.observe(el)
})
onScopeDispose(() => ro?.disconnect())

// Freeze the spec when the slide is inactive so the offscreen GeoMap does not
// recolor on every click. Same pattern as useActiveMapSpec in the blog.
//
// The advance is a watcher rather than a write inside the computed's getter:
// `frozenClick` is both a dependency of `activeClick` and, that way, a write
// target of it, so the computed could invalidate itself, and it is read twice
// per beat (here and by `legend`). Computeds are expected to be pure.
const frozenClick = ref(0)
watch([clicks, isActive], ([click, active]) => {
  if (active) frozenClick.value = click
}, { immediate: true })
const activeClick = computed(() => (isActive.value ? clicks.value : frozenClick.value))

function buildSpec(click: number, boxPx: number): GeoMapSpec {
  const useEcoDis = click === 0
  const emphasized = STEPS[click] ?? null
  return {
    type: 'map',
    geo: {
      features: austinZipsTopo as unknown as GeoMapSpec['geo']['features'],
      idField: 'id',
      projection: 'mercator',
      // Fit the campus cluster, not the ZCTA extent. The padding is the slack
      // around the cluster, so it sets how much of the box the cluster takes.
      focus: { points: true, padding: boxPx * FOCUS_PAD },
    },
    data: [],
    encoding: {
      key: { field: 'id', type: 'nominal' },
      color: { field: 'id', type: 'nominal', legend: null },
    },
    points: {
      data: useEcoDis ? AISD_CAMPUSES_BUCKETED : AISD_CAMPUSES,
      longitude: { field: 'lon', type: 'quantitative' },
      latitude: { field: 'lat', type: 'quantitative' },
      size: { field: 'enrollment', type: 'quantitative' },
      color: useEcoDis
        ? {
            field: 'ecoDisBucket',
            type: 'nominal',
            title: 'Economically disadvantaged',
            scale: { domain: ECO_DIS_DOMAIN, range: ECO_DIS_RANGE_DARK },
          }
        : {
            field: 'rating',
            type: 'nominal',
            title: 'TEA rating',
            scale: { domain: RATING_DOMAIN, range: ratingRange(emphasized) },
          },
      key: { field: 'campusNumber', type: 'nominal' },
      opacity: 0.75,
      tooltip: [
        { field: 'campus', type: 'nominal', title: 'Campus' },
        { field: 'rating', type: 'nominal', title: 'TEA rating' },
        { field: 'ecoDis', type: 'quantitative', title: 'Econ. disadvantaged', format: '.0%' },
        { field: 'enrollment', type: 'quantitative', title: 'Enrollment', format: ',.0f' },
      ],
    },
    // The legend is drawn in the overlay instead: the built-in one is placed
    // in map pixels, which do not scale with the frame.
    legend: { show: false },
    watermark: false,
    animation: true,
    theme: { ...slideChartTheme, spacing: { padding: 0 } },
  }
}

const spec = computed(() => buildSpec(activeClick.value, mapPx.value))

/** Which key the legend shows; the whole list cross fades when it changes. */
const legendMode = computed(() => (activeClick.value === 0 ? 'eco-dis' : 'rating'))

/** The legend the map would have drawn, in the same colors as the dots. */
const legend = computed(() => {
  if (activeClick.value === 0) {
    return ECO_DIS_DOMAIN.map((label, i) => ({ label, color: ECO_DIS_RANGE_DARK[i] }))
  }
  const range = ratingRange(STEPS[activeClick.value] ?? null)
  return RATING_DOMAIN.map((label, i) => ({ label, color: range[i] }))
})
</script>
<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #overlay>
      <div class="campus-map">
        <div ref="camera" class="campus-map-camera">
          <GeoMap v-if="mapPx" :spec="spec" dark-mode="force" />
        </div>
      </div>
      <div class="campus-head">
        <h2 class="od-story-head">Austin's ratings follow its poverty map.</h2>
        <!-- Beat 0 to 1 swaps the eco-dis key for the rating key, so the list
             cross fades as a block on the card's clock. Beats 2 and 3 only
             mute some ratings, so the dots ease their color in place. -->
        <div class="campus-legend-swap">
          <Transition :css="false" @enter="fadeIn" @leave="fadeOutInPlace">
            <ul :key="legendMode" class="campus-legend">
              <li v-for="item in legend" :key="item.label">
                <span class="campus-legend-dot" :style="{ background: item.color }" />{{ item.label }}
              </li>
            </ul>
          </Transition>
        </div>
      </div>
      <StoryLink :href="ARTICLE_URL" />
    </template>
    <template #card>
      <StoryCard anchor="left" hue="cyan" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>
<style scoped>
/* The map is the slide: it bleeds past all four edges, and the prose sits in
   the empty west half of the cluster. Two boxes do that, and every number in
   them is a frame unit, so the composition is the same at any window size.

   `campus-map` is the frame itself and clips, so nothing reaches the letterbox
   bands on a viewport that is not 16:9.

   `campus-map-camera` is the GeoMap's own box, and it is deliberately larger
   than the frame. Two things about the map fix its numbers, and moving one
   means recomputing the other:

   - The map renders at `width x 0.625 * width` (it measures its container's
     width and derives the height), so the width is the only zoom knob.
   - `geo.focus` centers the campus cluster in that box, so the box's offsets
     are what place the cluster: it hangs off the left and top of the frame to
     put the cluster right of center, clear of the headline and the card.

   Landing points at 1920x1080: the cluster centered at (1280, 540) spanning
   roughly x 880 to 1680, which leaves the headline, the legend, the card's
   column, the link and the beat rail free of dots at every beat. */
.campus-map {
  position: absolute;
  top: 0;
  bottom: 0;
  /* The map is the one layer that covers the window rather than the frame, so
     it reaches past both letterbox bands. Everything else on the slide, the
     camera offsets below included, still lays out against the frame. */
  left: calc(-1 * var(--od-bleed-x));
  right: calc(-1 * var(--od-bleed-x));
  overflow: hidden;
}
/* The prose sits over the west half of the cluster, which is sparse but not
   empty. A black wash runs the diagonal, heaviest under the headline in the
   top left and gone before the dot field in the bottom right. It never takes a
   pointer event, so the dots underneath keep their tooltips. */
.campus-map::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    to bottom right,
    rgb(0 0 0) 0%,
    rgb(0 0 0 / 0.9) 18%,
    rgb(0 0 0 / 0.68) 33%,
    rgb(0 0 0 / 0.4) 48%,
    rgb(0 0 0 / 0.15) 62%,
    rgb(0 0 0 / 0) 78%
  );
}
.campus-map-camera {
  position: absolute;
  /* The stage overlay swallows pointer events so ink never blocks a click; the
     map opts back in so its dot tooltips work on hover. */
  pointer-events: auto;
  top: calc(-27.8 * var(--sh));
  /* Offset back by the bleed, so the cluster lands where it did when this box
     was positioned against the frame. */
  left: calc(var(--od-bleed-x) - 3.3 * var(--sw));
  width: calc(140 * var(--sw));
}

/* Headline and legend are one flowed block, pinned where the shared stylesheet
   pins a headline on its own. Story text is sized in rem rather than in frame
   units, so the headline wraps to two lines on a small window; stacking the two
   in flow is what keeps the legend under it at every size instead of at a fixed
   offset that a second line would run into. */
.campus-head {
  position: absolute;
  top: calc(6.2 * var(--sh));
  left: calc(5.7 * var(--sw));
}
.campus-head .od-story-head {
  position: static;
}
.campus-legend-swap {
  /* The anchor for the outgoing list, which `fadeOutInPlace` pins at top 0. */
  position: relative;
  margin: 0.9rem 0 0;
}
.campus-legend {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 1.1rem;
  padding: 0;
  list-style: none;
  font-size: 1.05rem;
  color: var(--od-text-muted);
}
.campus-legend li {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.campus-legend-dot {
  width: 0.62rem;
  height: 0.62rem;
  border-radius: 50%;
  transition: background-color var(--od-dur-card) var(--od-settle);
}
</style>
