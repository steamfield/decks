/**
 * beatCopy: the prose card's copy for the current beat.
 *
 * Every story stage keeps its card text in a `COPY` array indexed by click,
 * and every one of them clamped that index by hand. The clamp is the whole
 * point: a slide can be entered on a beat past the last card (a deep link, a
 * CLICKS_MAX jump), and reading past the end would blank the card.
 */
import { computed, type ComputedRef, type Ref } from 'vue'
import type { BeatCopy } from './types'

export function beatCopy<T extends BeatCopy>(
  copy: readonly T[],
  clicks: Ref<number>,
): ComputedRef<T> {
  return computed(() => copy[Math.min(Math.max(clicks.value, 0), copy.length - 1)])
}
