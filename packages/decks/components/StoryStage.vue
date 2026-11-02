<script setup lang="ts">
/**
 * StoryStage: the pinned frame every story slide is built in.
 *
 * One 1920x1080 svg for all ink, one unpadded HTML overlay for headline, card
 * and chips, and a beat rail in the footer. The stage owns no beat timeline:
 * children build their own inside their own keyed subtree.
 *
 * What the stage does own is the entrance. On the isActive false to true
 * edge, and only when the slide lands on its first beat, the headline, the
 * card and the rail settle up into place in that order. Landing on a later
 * beat (arriving backwards) skips it: everything is already where it belongs.
 * So does arriving through a view transition: the headline and card carry
 * their own view-transition-names and the stylesheet staggers them in, and
 * an entrance on top would put opacity 0 into the transition's snapshot.
 *
 * `enter-after-transition` (off by default) changes that last case for a
 * slide whose rows carry no hand-off, such as a cover or divider: on arrival
 * through a view transition the entrance groups hold at zero through the
 * cross fade and play once it has finished, the same policy
 * `useStageEntrance` applies to a stage's own enter motion. Anything that
 * carries a view-transition-name is left out of the hold, since the
 * transition already is its entrance. Presenter, overview, print, a later
 * beat and reduced motion still land on the resting state, and an arrival
 * that is no longer current when the transition lands is set to rest rather
 * than left at zero.
 *
 * ```vue
 * <StoryStage :beats="1" :click="0" enter-after-transition>...</StoryStage>
 * ```
 */
import { computed, onMounted, onScopeDispose, ref, unref, watch } from 'vue'
import { useIsSlideActive, useSlideContext } from '@slidev/client'
import {
  ensureStoryDefs,
  entrance,
  afterViewTransition,
  gsap,
  prefersReducedMotion,
  viewTransitionInFlight,
} from '../story'

const props = withDefaults(
  defineProps<{
    /** How many stops this slide has, including beat 0. Drives the rail. */
    beats?: number
    /** Reflow HTML/chart layout across wide screens; fixed SVG scenes stay fitted. */
    fluid?: boolean
    /** Current click index. */
    click?: number
    /**
     * Play the entrance after an in-flight view transition lands instead of
     * skipping it. For slides with no hand-off (covers, dividers).
     */
    enterAfterTransition?: boolean
  }>(),
  { beats: 1, click: 0, enterAfterTransition: false, fluid: false },
)

const { $renderContext } = useSlideContext()
const isActive = useIsSlideActive()
const root = ref<HTMLElement | null>(null)

/**
 * View transition names are only assigned on the real slide view. The
 * presenter renders a second copy of the same slide, and two elements sharing
 * a name abort the transition outright.
 */
const vtOn = computed(() => unref($renderContext) === 'slide')

onMounted(ensureStoryDefs)

let enter: gsap.core.Timeline | null = null
/** Bumped on every entrance decision, so a stale post-transition play is dropped. */
let arrival = 0

function pick(selector: string): Element[] {
  return root.value ? Array.from(root.value.querySelectorAll(selector)) : []
}

/**
 * The entrance groups. Cover rows opt in with `od-enter-a/b/c` classes rather
 * than positional selectors, so a cover with fewer rows never tweens one
 * element twice.
 */
function groups(): Element[][] {
  return [
    pick('.od-story-head, .od-enter-a'),
    pick('.od-enter-b'),
    pick('.od-story-card, .od-enter-c'),
    pick('.od-story-foot'),
  ]
}

function named(el: Element): boolean {
  const name = getComputedStyle(el).getPropertyValue('view-transition-name').trim()
  return name !== '' && name !== 'none'
}

/**
 * A hand-off, or a row holding one (a close slide's QR frame): the transition
 * morphs it in, so it gets no entrance of ours and is never held at zero.
 */
function handsOff(el: Element): boolean {
  if (named(el)) return true
  return Array.from(el.querySelectorAll('[class*="vt-"], .od-story-head, .od-story-card')).some(
    named,
  )
}

function playEntrance(): void {
  enter?.kill()
  enter = null
  const token = ++arrival
  const all = groups().flat()
  if (!all.length) return
  const rest = () => gsap.set(all, { clearProps: 'opacity,transform' })
  // Only the real slide view animates in. The presenter, overview and the
  // export renderer must land on the resting state, and so must a slide
  // entered on a later beat or with motion turned down. A previous entrance
  // may have been killed mid flight, so the resting state is set explicitly.
  if (!vtOn.value || props.click > 0 || prefersReducedMotion()) {
    rest()
    return
  }
  if (!viewTransitionInFlight()) {
    enter = entrance({ groups: groups() })
    return
  }
  if (!props.enterAfterTransition) {
    rest()
    return
  }
  // Hold at zero through the cross fade, then play once it has landed. The
  // hold is on the live new view, never on the outgoing snapshot.
  const held = groups().map((group) => group.filter((el) => !handsOff(el)))
  rest()
  if (held.flat().length) gsap.set(held.flat(), { opacity: 0 })
  afterViewTransition(() => {
    if (token !== arrival) return
    if (!isActive.value || props.click > 0) {
      rest()
      return
    }
    enter = entrance({ groups: held })
  })
}

// `immediate` would run during setup, before the root ref exists, so the
// mounted case is handled in onMounted and the watcher takes only the edges.
onMounted(() => {
  if (isActive.value) playEntrance()
})

watch(
  () => !!isActive.value,
  (active, was) => {
    if (active && !was) playEntrance()
  },
  { flush: 'post' },
)

onScopeDispose(() => {
  arrival++
  enter?.kill()
})
</script>

<template>
  <div ref="root" class="od-slide is-story" :class="{ 'vt-on': vtOn, 'is-fluid': props.fluid }">
    <!-- Decorative backgrounds fill the viewport; content keeps its fitted frame. -->
    <div v-if="$slots.background" class="od-stage-background" aria-hidden="true">
      <slot name="background" />
    </div>
    <!--
      Everything lives in one 16:9 frame (`.od-story-frame` in story-frame.css).
      The stage svg and the overlay only agree on where a point is when the box
      holding them matches the viewBox's aspect ratio; when the slide itself was
      that box, any viewport that was not 16:9 cropped the ink.
    -->
    <div class="od-story-frame">
      <svg
        class="od-stage"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <slot name="stage" />
      </svg>

      <div class="od-stage-overlay">
        <slot name="overlay" />
        <slot name="card" />
      </div>

      <footer v-if="props.beats > 1" class="od-story-foot">
        <span
          v-for="i in props.beats"
          :key="i"
          class="od-beat"
          :class="{ 'is-done': i - 1 <= props.click, 'is-current': i - 1 === props.click }"
        />
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* The overlay is unpadded on purpose: everything inside it positions itself
   absolutely, so a full bleed child can use inset: 0 and actually get the
   whole frame. */
.od-stage-background {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.od-stage-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* Let text receive selection without a full-frame overlay blocking charts. */
.od-stage-overlay :deep(:is(h1, h2, h3, p, span, a, li, dt, dd, td, th, .od-story-card, .od-bignum, div:not(:has(*)))) {
  pointer-events: auto;
}

/* ── Beat rail ── */
.od-story-foot {
  position: absolute;
  left: calc(5.7 * var(--lw));
  bottom: calc(3.6 * var(--sh));
  display: flex;
  align-items: center;
  gap: calc(0.55 * var(--sw));
}
.od-beat {
  display: block;
  width: calc(2.1 * var(--sw));
  height: 2px;
  border-radius: 1px;
  background: var(--od-text-dim);
  opacity: 0.55;
  transition:
    background-color var(--od-dur-card) var(--od-settle),
    opacity var(--od-dur-card) var(--od-settle),
    width var(--od-dur-card) var(--od-settle);
}
.od-beat.is-done {
  background: var(--od-text-muted);
  opacity: 0.85;
}
.od-beat.is-current {
  width: calc(3.2 * var(--sw));
  background: var(--od-cyan-bright);
  opacity: 1;
}
</style>
