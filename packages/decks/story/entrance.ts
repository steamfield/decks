/**
 * useStageEntrance: the enter motion every story stage runs, in one place.
 *
 * A stage has two motion systems. The beat timeline (`useStoryTimeline`) is a
 * pure function of the click index and is seekable in both directions. The
 * entrance is not: it is the one-shot settle that plays when the slide lands
 * on beat 0, and it cannot ride the beat timeline because that timeline seeks
 * rather than tweens on first entry, so anything placed before `beat0` would
 * render at its end state instantly and never animate.
 *
 * The policy the nine stages had each written out by hand:
 *
 * - not the real slide view (overview thumbnail, presenter preview, print):
 *   show the end state.
 * - slide not active: hold at zero, so the next entry replays.
 * - entered on a later beat, or motion turned down: show the end state.
 * - otherwise: hold at zero through the cross fade, then play once the view
 *   transition has landed. An entrance during a transition would put opacity
 *   zero into the snapshot.
 *
 * `build` runs inside `onMounted`, so a template ref to a child is already
 * there and `margin.value?.addGrow(tl, '<')` works. Pass `beats` to build the
 * beat timeline in the same scope for the same reason.
 */
import {
  effectScope,
  onBeforeUnmount,
  onMounted,
  toValue,
  unref,
  watch,
  type MaybeRefOrGetter,
} from 'vue'
import { useSlideContext } from '@slidev/client'
import { gsap } from './easings'
import { prefersReducedMotion, useStoryTimeline } from './timeline'
import { afterViewTransition } from './view-transition'

export interface StageEntranceOptions {
  clicks: MaybeRefOrGetter<number>
  isActive: MaybeRefOrGetter<boolean>
  /**
   * The beat timeline, built in the same scope and after the entrance, so a
   * stage that drives a child through its exposed API has the ref by then.
   */
  beats?: (tl: gsap.core.Timeline) => void
}

export function useStageEntrance(
  build: (tl: gsap.core.Timeline) => void,
  opts: StageEntranceOptions,
): void {
  const { $renderContext } = useSlideContext()
  const inSlideView = unref($renderContext) === 'slide'

  const scope = effectScope()
  let enter: gsap.core.Timeline | null = null

  onMounted(() => {
    scope.run(() => {
      enter = gsap.timeline({ paused: true })
      build(enter)

      watch(
        () => [!!toValue(opts.isActive), toValue(opts.clicks)] as const,
        ([active, clicks], previous, onCleanup) => {
          const tl = enter
          if (!tl) return
          let cancelled = false
          onCleanup(() => { cancelled = true })
          if (!inSlideView) tl.progress(1).pause()
          else if (!active) tl.pause(0)
          else if (clicks > 0 || prefersReducedMotion()) tl.progress(1).pause()
          // Returning to beat 0 within the same visit must not replay the
          // entrance. Advancing early above finishes it, even while waiting
          // for the slide transition, so the first mark cannot stay hidden.
          else if (!previous?.[0]) {
            tl.pause(0)
            afterViewTransition(() => {
              if (!cancelled && toValue(opts.isActive) && toValue(opts.clicks) === 0) tl.play(0)
            })
          }
        },
        { immediate: true },
      )

      if (opts.beats) {
        useStoryTimeline(opts.beats, {
          clicks: () => toValue(opts.clicks),
          isActive: () => toValue(opts.isActive),
        })
      }
    })
  })

  onBeforeUnmount(() => {
    enter?.kill()
    enter = null
    scope.stop()
  })
}
