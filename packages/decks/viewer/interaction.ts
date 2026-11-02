import type { Router } from 'vue-router'
import { createTypographySizing } from './typography'
import { constrain, fittedView, zoomAt } from './zoom'

/** Scoped to the audience view; presenter, overview, editor and PDF keep their controls. */
export function installViewer(router: Router) {
  const root = document.documentElement
  const typography = createTypographySizing()
  let textScale = 1
  let view = fittedView()
  let active = false
  let gestureStart = 1
  let gesturing = false
  const reset = document.createElement('button')
  reset.className = 'od-viewer-reset'
  reset.type = 'button'
  reset.hidden = true
  reset.title = 'Reset text size and slide zoom (Command/Ctrl + 0)'
  document.body.append(reset)

  function paint() {
    root.style.setProperty('--od-viewer-scale', String(view.scale))
    root.style.setProperty('--od-viewer-x', `${view.x}px`)
    root.style.setProperty('--od-viewer-y', `${view.y}px`)
    reset.hidden = !active || (view.scale === 1 && textScale === 1)
    reset.textContent = [view.scale !== 1 ? `Zoom ${Math.round(view.scale * 100)}%` : '', textScale !== 1 ? `Text ${Math.round(textScale * 100)}%` : '', 'Reset'].filter(Boolean).join(' · ')
  }
  function resetView() { view = fittedView(); textScale = 1; typography.set(textScale, active); paint() }
  function available(target: EventTarget | null) {
    return active && !document.querySelector('.slidev-overview') && !(target instanceof Element
      && target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"], .monaco-editor'))
  }
  function zoom(scale: number, x = innerWidth / 2, y = innerHeight / 2) {
    view = zoomAt(view, scale, x, y, innerWidth, innerHeight)
    paint()
  }
  function keydown(event: KeyboardEvent) {
    if (!available(event.target) || !(event.metaKey || event.ctrlKey) || event.altKey) return
    if (!['+', '=', '-', '0'].includes(event.key)) return
    event.preventDefault()
    event.stopImmediatePropagation()
    if (event.key === '0') resetView()
    else {
      // Keyboard sizing changes real font metrics and line wrapping. Pinch
      // magnification is independent and never changes these layout metrics.
      textScale = Math.max(0.75, Math.min(1.5, Math.round((textScale + (event.key === '-' ? -0.1 : 0.1)) * 100) / 100))
      typography.set(textScale, active)
      paint()
    }
  }
  function wheel(event: WheelEvent) {
    if (!available(event.target)) return
    if (event.ctrlKey) {
      // Chromium/Firefox trackpad pinch is a ctrl-wheel event. A nonpassive
      // listener prevents applying native browser zoom on top of slide zoom.
      event.preventDefault()
      event.stopImmediatePropagation()
      if (!gesturing) zoom(view.scale * Math.exp(-event.deltaY * 0.01), event.clientX, event.clientY)
    }
    else if (view.scale > 1 && event.target instanceof Element && event.target.closest('#slide-container')) {
      // Keep scrolling inside code blocks and other scrollable slide content.
      for (let el: Element | null = event.target; el && el.id !== 'slide-container'; el = el.parentElement) {
        const css = getComputedStyle(el)
        if (/(auto|scroll)/.test(css.overflowY) && el.scrollHeight > el.clientHeight
          || /(auto|scroll)/.test(css.overflowX) && el.scrollWidth > el.clientWidth) return
      }
      event.preventDefault()
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1
      view = constrain({ ...view, x: view.x - event.deltaX * unit, y: view.y - event.deltaY * unit }, innerWidth, innerHeight)
      paint()
    }
  }
  // Safari exposes trackpad pinch through GestureEvent instead of ctrl-wheel.
  function gesture(event: Event) {
    if (!available(event.target)) return
    event.preventDefault()
    if (event.type === 'gesturestart') { gestureStart = view.scale; gesturing = true }
    else if (event.type === 'gestureend') gesturing = false
    else {
      const e = event as Event & { scale: number; clientX: number; clientY: number }
      zoom(gestureStart * e.scale, e.clientX || innerWidth / 2, e.clientY || innerHeight / 2)
    }
  }
  function resize() {
    typography.resize()
    view = constrain(view, innerWidth, innerHeight)
    paint()
  }
  function route() {
    active = router.currentRoute.value.name === 'play' && !root.classList.contains('print')
    root.toggleAttribute('data-od-viewer', active)
    if (!active) resetView()
    else { typography.set(textScale, active); paint() }
  }
  const stopRoute = router.afterEach(route)
  route()
  reset.addEventListener('click', resetView)
  window.addEventListener('keydown', keydown, true)
  window.addEventListener('wheel', wheel, { capture: true, passive: false })
  window.addEventListener('resize', resize)
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) window.addEventListener(type, gesture, { passive: false })
  return () => {
    stopRoute()
    typography.dispose()
    reset.remove()
    root.removeAttribute('data-od-viewer')
    for (const prop of ['scale', 'x', 'y']) root.style.removeProperty(`--od-viewer-${prop}`)
    window.removeEventListener('keydown', keydown, true)
    window.removeEventListener('wheel', wheel, true)
    window.removeEventListener('resize', resize)
    for (const type of ['gesturestart', 'gesturechange', 'gestureend']) window.removeEventListener(type, gesture)
  }
}
