/**
 * The cross slide view transition, owned by the deck rather than by Slidev.
 *
 * Slidev's own `transition: view-transition` swaps the slideshow container
 * between a plain div and a TransitionGroup on every route change, and a
 * click is a route change, so every click remounted every slide: entrances
 * replayed, blooms restarted and the frame went black for a beat. The addon
 * setup (`shared/setup/main.ts`) runs the transition from a router guard
 * instead, and the deck keeps Slidev's container on a no-op TransitionGroup
 * that never remounts anything.
 *
 * This module is the one place that knows whether a transition is in flight,
 * so a slide can decide between "the transition is my entrance" and "play the
 * entrance myself" (a fresh load, a deep link, a browser without the API).
 */

let active: ViewTransition | null = null

export function viewTransitionInFlight(): boolean {
  return active !== null
}

/** True where the API exists. A browser without it gets a plain cut. */
export function supportsViewTransition(): boolean {
  return typeof document !== 'undefined' && 'startViewTransition' in document
}

/**
 * Start a document transition around `update`. Returns null and runs the
 * update directly where the API is missing.
 */
export function startStoryTransition(update: () => Promise<void> | void): ViewTransition | null {
  if (!supportsViewTransition()) {
    void update()
    return null
  }
  const vt = document.startViewTransition(update)
  active = vt
  const clear = () => {
    if (active === vt) active = null
  }
  vt.finished.then(clear, clear)
  return vt
}

/** Run `cb` once the in flight transition has finished, or now if none is. */
export function afterViewTransition(cb: () => void): void {
  if (!active) {
    cb()
    return
  }
  active.finished.then(cb, cb)
}
