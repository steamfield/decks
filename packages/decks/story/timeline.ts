/**
 * useStoryTimeline: timeline position as a pure function of the click index.
 *
 * Each animating component builds its own paused timeline with labels
 * `beat0`..`beatN`, then this watcher decides between a seek and a tween:
 *
 * - first run, slide not active, reduced motion, or a jump of more than one
 *   beat: seek, so revisits and CLICKS_MAX entries land instantly.
 * - otherwise: tween, which plays the erase sequence for free on reverse.
 */
import { getCurrentScope, onScopeDispose, ref, watch, type Ref } from 'vue'
// Import through easings so the CustomEase registration and gsap defaults are
// in place before any timeline is built.
import { gsap } from './easings'

type Source<T> = Ref<T> | (() => T)

function read<T>(source: Source<T>): T {
  return typeof source === 'function' ? (source as () => T)() : source.value
}

export interface StoryTimelineOptions {
  clicks: Source<number>
  isActive: Source<boolean>
}

export interface StoryTimeline {
  tl: gsap.core.Timeline
  seekTo: (index: number, animate?: boolean) => void
  current: Ref<number>
}

/** Add a `beat<n>` label at the current end of the timeline. */
export function beat(tl: gsap.core.Timeline, n: number): gsap.core.Timeline {
  return tl.addLabel(`beat${n}`)
}

/**
 * A gsap position resolved to an absolute time on `tl`.
 *
 * Two reasons a handle resolves rather than forwarding the string. A helper
 * that inserts several tweens has to give them all the same start: a relative
 * position like `+=0.14` is measured from the timeline's end *at the moment of
 * insertion*, so handing the same string to seven inserts staggers them a beat
 * apart instead of moving the rows as one.
 *
 * And `'<'` does not mean what a beat script reads it as. It is "the start of
 * the previously inserted tween", not "the end of the timeline", and
 * `addLabel` does not count as an insert. So in the shape every beat script
 * has -- `beat(0); grow(a); beat(1); grow(b); beat(2); grow(c)` -- a defaulted
 * `'<'` lands b and c back on top of a, all three figures arrive on beat 1,
 * and the last two beats advance the card against a frozen stage. Handles
 * default to `'>'` for that reason; a stage that wants two marks to move
 * together still passes `'<'` explicitly.
 */
export function resolvePosition(
  tl: gsap.core.Timeline,
  position: gsap.Position | undefined,
): number {
  if (typeof position === 'number') return position
  if (typeof position === 'string') {
    if (position === '<') {
      const recent = tl.recent() as gsap.core.Animation | null
      return recent ? recent.startTime() : tl.duration()
    }
    if (position === '>') return tl.duration()
    const relative = /^([+-])=([\d.]+)$/.exec(position)
    if (relative) {
      const delta = (relative[1] === '-' ? -1 : 1) * Number(relative[2])
      return Math.max(0, tl.duration() + delta)
    }
    const label = tl.labels[position]
    if (label !== undefined) return label
  }
  return tl.duration()
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function beatIndices(tl: gsap.core.Timeline): number[] {
  return Object.keys(tl.labels)
    .map((label) => /^beat(\d+)$/.exec(label))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => Number(m[1]))
    .sort((a, b) => a - b)
}

export function useStoryTimeline(
  build: (tl: gsap.core.Timeline) => void,
  opts: StoryTimelineOptions,
): StoryTimeline {
  const tl = gsap.timeline({ paused: true })
  build(tl)

  const beats = beatIndices(tl)
  const maxBeat = beats.length ? beats[beats.length - 1] : 0
  const current = ref(-1)
  let tween: gsap.core.Tween | null = null

  const clamp = (n: number) => {
    if (!beats.length) return 0
    let best = beats[0]
    for (const b of beats) if (b <= n) best = b
    return Math.min(best, maxBeat)
  }

  function seekTo(index: number, animate = false): void {
    const target = clamp(index)
    const label = `beat${target}`
    const interrupted = tween !== null && tween.progress() < 1
    const previousTime = tl.labels[`beat${current.value}`]
    const targetTime = tl.labels[label]
    const rate = Math.abs(tl.timeScale()) || 1
    const stepDuration = Math.abs(targetTime - previousTime) / rate
    const remaining = Math.abs(targetTime - tl.time()) / rate
    tween?.kill()
    tween = null
    if (animate) {
      // Retarget from the visible position, but never queue several beats of
      // catch-up behind rapid clicks. Uninterrupted beats keep their timing.
      tween = tl.tweenTo(label, {
        ease: 'none',
        overwrite: true,
        ...(interrupted && stepDuration > 0
          ? { duration: Math.min(remaining, stepDuration) }
          : {}),
      })
    } else {
      tl.seek(label, false)
    }
    current.value = target
  }

  watch(
    () => [read(opts.clicks) ?? 0, !!read(opts.isActive)] as const,
    ([clicks, active]) => {
      const target = clamp(clicks)
      const first = current.value < 0
      const jumped = Math.abs(target - current.value) > 1
      seekTo(target, !first && active && !jumped && !prefersReducedMotion())
    },
    { immediate: true, flush: 'post' },
  )

  if (getCurrentScope()) {
    onScopeDispose(() => {
      tween?.kill()
      tl.kill()
    })
  }

  return { tl, seekTo, current }
}
