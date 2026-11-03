/** Route navigation to an explicitly opted-in, same-origin showcase controller. */
export function routeEmbedNavigation(event: KeyboardEvent): boolean {
  if (typeof window === 'undefined' || window.parent === window) return false
  if (!new URLSearchParams(window.location.search).has('decks-bridge')) return false
  if (event.altKey || event.metaKey || event.ctrlKey) return false
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return false
  try {
    if (window.parent.location.origin !== window.location.origin) return false
  } catch {
    return false
  }
  event.preventDefault()
  event.stopImmediatePropagation()
  window.parent.postMessage({
    type: 'decks:navigate',
    cmd: event.key === 'ArrowRight'
      ? event.shiftKey ? 'nextSlide' : 'next'
      : event.shiftKey ? 'prevSlide' : 'prev',
  }, window.location.origin)
  return true
}
