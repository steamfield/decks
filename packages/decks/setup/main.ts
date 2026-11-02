/**
 * Cross slide view transitions for story decks.
 *
 * A deck opts in with `htmlAttrs: { data-od-story: "" }` in its headmatter
 * and keeps Slidev's own `transition` on a no-op TransitionGroup (see
 * `packages/decks/story/view-transition.ts` for why Slidev's built in
 * `view-transition` mode is not used). This guard then wraps every slide to
 * slide navigation in the real `/` view in `document.startViewTransition`,
 * the way Slidev's own composable does, and stamps `data-od-nav="fwd|back"`
 * on <html> first so the root keyframes in `styles/story-frame.css` know
 * which way to drift. Clicks within a slide never transition.
 */
import { installViewer } from '../viewer/interaction'
import { defineAppSetup } from '@slidev/types'
import { getSlide } from '@slidev/client/logic/slides.ts'
import { startStoryTransition, supportsViewTransition } from '../story/view-transition'

export default defineAppSetup(({ router }) => {
  const disposeViewer = installViewer(router)
  if (import.meta.hot) import.meta.hot.dispose(disposeViewer)
  let finish: (() => void) | undefined

  router.beforeResolve((to, from) => {
    if (typeof document === 'undefined') return
    if (document.documentElement.dataset.odStory == null) return
    if (to.name !== 'play' || from.name !== 'play') return
    const toNo = getSlide(to.params.no as string)?.no
    const fromNo = getSlide(from.params.no as string)?.no
    if (toNo == null || fromNo == null || toNo === fromNo) return
    document.documentElement.dataset.odNav = toNo < fromNo ? 'back' : 'fwd'
    if (!supportsViewTransition()) return

    // The route change happens inside the transition's update callback, and
    // the callback resolves once the router has committed it.
    let changeRoute!: () => void
    const ready = new Promise<void>((resolve) => (changeRoute = resolve))
    const committed = new Promise<void>((resolve) => (finish = resolve))
    startStoryTransition(() => {
      changeRoute()
      return committed
    })
    return ready
  })

  const settle = () => {
    finish?.()
    finish = undefined
  }
  router.afterEach(settle)
  router.onError(settle)
})
