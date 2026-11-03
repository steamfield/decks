/**
 * Embed control: drive a built deck from a same-origin parent page.
 *
 * Slidev's own embed API (`useEmbeddedControl`) is dev-only, so a static
 * build cannot be stepped from outside. This is the replacement, and it does
 * nothing unless the deck runs inside an iframe whose parent has the same
 * origin: a normal tab, the presenter and the PDF export never see it.
 *
 * Parent -> deck:
 *   { type: 'decks:cmd', cmd: 'next' | 'prev' | 'nextSlide' | 'prevSlide' | 'go', slide?, beat? }
 * Deck -> parent, in this order on load, then a state pair per move:
 *   { type: 'decks:ready' }
 *   { type: 'decks:meta', title, slides, slideTitles }
 *   { type: 'decks:state', slide, slides, beat, beats, lead, body, settled, direction }
 *
 * `settled` is false when a move starts and true once nothing finite is
 * moving: no gsap tween or timeline active, no running CSS animation or
 * transition, and no story view transition in flight (see `busy`).
 */
import { nextTick, onMounted, onScopeDispose, watch } from 'vue'
import { useRouter } from 'vue-router'
import { configs, useNav } from '@slidev/client'
import { gsap } from '../story/easings'
import { routeEmbedNavigation } from '../composables/embed-navigation'
import { viewTransitionInFlight } from '../story/view-transition'

export type EmbedCommand = 'next' | 'prev' | 'nextSlide' | 'prevSlide' | 'go'
export type EmbedDirection = 'forward' | 'backward' | null

/** Longest a move may stay unsettled; a stuck animation still reports settled. */
const SETTLE_CAP_MS = 6000

/** True only inside an iframe whose parent page shares this page's origin. */
export function sameOriginParent(): boolean {
  if (typeof window === 'undefined' || window.parent === window) return false
  try {
    return window.parent.location.origin === window.location.origin
  } catch {
    return false
  }
}

/** Forward, backward or no move, comparing slide first, then beat. */
export function direction(
  from: readonly [number, number] | null,
  to: readonly [number, number],
): EmbedDirection {
  if (!from) return null
  const d = to[0] - from[0] || to[1] - from[1]
  return d > 0 ? 'forward' : d < 0 ? 'backward' : null
}

/** Anything finite still moving: gsap, CSS animations/transitions, a view transition. */
function busy(): boolean {
  if (viewTransitionInFlight()) return true
  for (const a of gsap.globalTimeline.getChildren(false, true, true)) {
    if (a.isActive() && a.repeat() !== -1) return true
  }
  for (const a of document.getAnimations()) {
    if (a.playState !== 'running') continue
    if (a.effect?.getComputedTiming().endTime !== Infinity) return true
  }
  return false
}

export function installEmbed(): void {
  if (!sameOriginParent()) return
  const nav = useNav()
  const router = useRouter()
  const origin = window.location.origin

  const live = () => router.currentRoute.value.name === 'play' && !nav.isPrintMode.value

  function post(message: Record<string, unknown>): void {
    window.parent.postMessage(message, origin)
  }

  /** The current slide's story card, read off StoryCard's data attributes. */
  function card(): { lead: string; body: string } {
    const page = document.querySelector(`.slidev-page-${nav.currentSlideNo.value}`)
    const el = page?.querySelector<HTMLElement>('.od-story-card')
    return { lead: el?.dataset.lead ?? '', body: el?.dataset.body ?? '' }
  }

  let last: [number, number] | null = null
  let move = 0
  let requestId: number | undefined
  let cards: MutationObserver | undefined

  function state(settled: boolean, dir: EmbedDirection): void {
    post({
      type: 'decks:state',
      ...(requestId === undefined ? {} : { requestId }),
      slide: nav.currentSlideNo.value,
      slides: nav.total.value,
      beat: nav.clicks.value,
      beats: nav.clicksTotal.value,
      ...card(),
      settled,
      direction: dir,
    })
  }

  /** Post settled:false now, then settled:true once two quiet frames pass. */
  function report(dir: EmbedDirection): void {
    const token = ++move
    state(false, dir)
    const start = performance.now()
    let quiet = 0
    const tick = () => {
      if (token !== move) return
      quiet = busy() ? 0 : quiet + 1
      if (quiet >= 2 || performance.now() - start > SETTLE_CAP_MS) {
        state(true, dir)
        requestId = undefined
      }
      else requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  async function run(data: { cmd?: unknown; slide?: unknown; beat?: unknown }): Promise<void> {
    if (!live()) return
    switch (data.cmd) {
      case 'next':
        return nav.next()
      case 'prev':
        return nav.prev()
      case 'nextSlide':
        return nav.nextSlide()
      case 'prevSlide':
        return nav.prevSlide()
      case 'go': {
        const slide = Math.round(Number(data.slide ?? nav.currentSlideNo.value))
        const beat = Math.max(0, Math.round(Number(data.beat ?? 0)))
        if (!Number.isFinite(slide) || !Number.isFinite(beat)) return
        return nav.go(Math.min(Math.max(slide, 1), nav.total.value), beat)
      }
    }
  }

  function onMessage(event: MessageEvent): void {
    if (event.source !== window.parent || event.origin !== origin) return
    const data = event.data
    if (!data || data.type !== 'decks:cmd') return
    if (typeof data.requestId === 'number' && Number.isInteger(data.requestId)) requestId = data.requestId
    else requestId = undefined
    const before = [nav.currentSlideNo.value, nav.clicks.value] as const
    void run(data).then(async () => {
      await nextTick()
      // Watch reports changed positions; unchanged commands need an acknowledgement too.
      if (before[0] === nav.currentSlideNo.value && before[1] === nav.clicks.value) report(null)
    }).catch((error: unknown) => {
      console.error("Deck navigation failed", error)
      post({ type: 'decks:error', message: 'The deck could not navigate.', requestId })
      requestId = undefined
    })
  }

  const bridge = new URLSearchParams(window.location.search).has('decks-bridge')
  const onKey = (event: KeyboardEvent) => {
    post({ type: 'decks:interaction' })
    const target = event.target as HTMLElement | null
    if (target?.closest('input, textarea, select, [contenteditable], [role=slider], [data-decks-own-keys]')) return
    routeEmbedNavigation(event)
  }
  const onInteraction = (event: PointerEvent) => {
    post({ type: 'decks:interaction' })
    if ((event.target as HTMLElement | null)?.id !== 'slide-container' || event.button !== 0) return
    event.stopPropagation()
    post({ type: 'decks:navigate', cmd: event.clientX > window.innerWidth / 2 ? 'next' : 'prev' })
  }
  const onAttention = (event: PointerEvent | FocusEvent) => {
    const target = event.target instanceof Element ? event.target : null
    const interactive = target?.closest('button, a[href], input, textarea, select, [contenteditable], [tabindex]:not([tabindex="-1"]), [role="button"], [role="slider"], [data-mark-id], .oc-chart-root canvas, .od-graph3d-host canvas')
    if (!interactive || (event.relatedTarget instanceof Node && interactive.contains(event.relatedTarget))) return
    post({ type: 'decks:interaction' })
  }
  let controlledStyle: HTMLStyleElement | undefined
  if (bridge) {
    document.documentElement.dataset.decksControlled = ''
    controlledStyle = document.createElement('style')
    controlledStyle.textContent = 'html[data-decks-controlled] #slide-container > div:not(#slide-content) { display: none !important; }'
    document.head.append(controlledStyle)
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('pointerdown', onInteraction, true)
    window.addEventListener('pointerover', onAttention, true)
    window.addEventListener('focusin', onAttention, true)
  }
  window.addEventListener('message', onMessage)
  onScopeDispose(() => {
    window.removeEventListener('message', onMessage)
    window.removeEventListener('keydown', onKey, true)
    window.removeEventListener('pointerdown', onInteraction, true)
    window.removeEventListener('pointerover', onAttention, true)
    window.removeEventListener('focusin', onAttention, true)
    cards?.disconnect()
    controlledStyle?.remove()
    if (bridge) delete document.documentElement.dataset.decksControlled
  })

  onMounted(async () => {
    await router.isReady()
    await nextTick()
    if (!live()) return
    post({ type: 'decks:ready' })
    post({
      type: 'decks:meta',
      title: configs.title ?? '',
      slides: nav.total.value,
      // A slide's `title` frontmatter or first heading. `slide.title` is read
      // from the page file alone; a `title` in the manifest stanza (or, for
      // slide 1, the headmatter's deck title) only reaches the merged frontmatter.
      slideTitles: nav.slides.value.map((route) => {
        const slide = route.meta?.slide as
          | { title?: string; frontmatter?: { title?: unknown } }
          | undefined
        const fm = slide?.frontmatter?.title
        return slide?.title || (typeof fm === 'string' ? fm : '')
      }),
    })
    last = [nav.currentSlideNo.value, nav.clicks.value]
    report(null)

    // Lazy-mounted stages can publish their first card after navigation settles.
    let lastCard = JSON.stringify(card())
    let cardPosition = `${nav.currentSlideNo.value}:${nav.clicks.value}`
    cards = new MutationObserver(() => {
      const next = JSON.stringify(card())
      const position = `${nav.currentSlideNo.value}:${nav.clicks.value}`
      const moved = position !== cardPosition
      cardPosition = position
      if (next === lastCard || !live()) return
      lastCard = next
      if (!moved) report(null)
    })
    cards.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-lead', 'data-body'] })

    // flush: 'post' so the new slide's card has rendered its props.
    watch(
      () => [nav.currentSlideNo.value, nav.clicks.value] as const,
      (to) => {
        if (!live()) return
        const dir = direction(last, to)
        last = [to[0], to[1]]
        report(dir)
      },
      { flush: 'post' },
    )
  })
}
