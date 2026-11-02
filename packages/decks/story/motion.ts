/**
 * Shared motion for the story chrome: card swaps and the slide entrance.
 *
 * Everything here is small on purpose. The card rises six pixels while it
 * fades, the headline and card settle into place on slide entry, and that is
 * the whole vocabulary. The pace comes from DUR, the curve from SETTLE, and
 * both are the same ones the stage timelines use, so chrome and ink read as
 * one motion system rather than two.
 */
import { DUR, SETTLE, gsap } from './easings'
import { prefersReducedMotion } from './timeline'

/** How far a piece of chrome travels while it fades in, in px. */
export const RISE = { card: 6, enter: 14 } as const

/**
 * Vue `@enter` hook: fade in with a short rise. Under reduced motion the rise
 * is dropped and only the fade remains.
 */
export function riseIn(el: Element, done: () => void): void {
  if (prefersReducedMotion()) {
    fadeIn(el, done)
    return
  }
  gsap.fromTo(
    el,
    { opacity: 0, y: RISE.card },
    { opacity: 1, y: 0, duration: DUR.card, ease: SETTLE, onComplete: done },
  )
}

/**
 * Vue `@enter` hook: fade in place over the card beat, no travel. Pairs with
 * `fadeOutInPlace` for a label that swaps on a beat (a timeline date, a map
 * legend), which should cross fade on the card's clock without the card's
 * rise.
 */
export function fadeIn(el: Element, done: () => void): void {
  gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: DUR.card, ease: SETTLE, onComplete: done })
}

/**
 * Ease a box from a measured height to its natural height over the card beat.
 *
 * For a container whose content is swapped by `riseIn`/`fadeOutInPlace`: the
 * outgoing copy leaves the flow, so without this the box would resize to the
 * incoming copy in one frame. Call it from the `@enter` hook with the height
 * recorded in `@before-leave`. Any height tween still running on the box is
 * killed first, so fast clicking never stacks two. Under reduced motion the
 * box takes its new height at once.
 */
export function easeHeight(el: HTMLElement, from: number): void {
  gsap.killTweensOf(el, 'height')
  gsap.set(el, { clearProps: 'height,overflow' })
  const to = el.offsetHeight
  if (prefersReducedMotion() || !(from > 0) || Math.abs(to - from) < 1) return
  // Clipped while it travels: a bottom anchored box grows upward, and without
  // the clip a taller incoming copy would hang below the border until the box
  // caught up. The outgoing copy is gone in DUR.opacity, well inside DUR.card.
  gsap.fromTo(
    el,
    { height: from, overflow: 'hidden' },
    { height: to, duration: DUR.card, ease: SETTLE, clearProps: 'height,overflow' },
  )
}

/**
 * Vue `@leave` hook for a swapped card body: take the outgoing copy out of
 * flow so the two states overlap rather than collapsing the card height mid
 * swap, then fade it without moving it. Only the incoming copy travels.
 */
export function fadeOutInPlace(el: Element, done: () => void): void {
  gsap.set(el, { position: 'absolute', top: 0, left: 0, right: 0 })
  gsap.to(el, { opacity: 0, duration: DUR.opacity, onComplete: done })
}

export interface EntranceOptions {
  /** Ordered groups of elements; each group starts one stagger after the last. */
  groups: Element[][]
}

/**
 * Slide entrance: each group fades in and settles up over the morph
 * duration, starting one `opacity` beat after the previous group. Returns
 * the timeline so the caller can kill it on re-entry or unmount.
 */
export function entrance(opts: EntranceOptions): gsap.core.Timeline {
  const tl = gsap.timeline()
  let at = 0
  for (const group of opts.groups) {
    if (!group.length) continue
    tl.fromTo(
      group,
      { opacity: 0, y: RISE.enter },
      { opacity: 1, y: 0, duration: DUR.morph, ease: SETTLE, clearProps: 'transform' },
      at,
    )
    at += DUR.opacity
  }
  return tl
}
