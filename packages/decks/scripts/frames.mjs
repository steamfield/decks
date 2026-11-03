// Frame naming for the snap harness. Plain JS so the `decks` bin runs it under
// Node from node_modules (Node will not strip types there); frames.d.mts gives
// tsc and the tests its types.

/** `s<slide>-c<clicks>.png` for a slide URL, so a directory sorts in deck order. */
export function frameName(url) {
  const u = slideLocation(url)
  const slide = u.pathname.replace(/^\//, '') || '1'
  const clicks = u.searchParams.get('clicks') ?? '0'
  return `s${slide.padStart(2, '0')}-c${clicks}.png`
}

/**
 * The slide part of a deck URL. A deck with `routerMode: hash` keeps its route
 * after the `#` (`/#/4?clicks=2`), so that is read as the path and query.
 */
export function slideLocation(url) {
  const u = new URL(url)
  return u.hash.startsWith('#/') ? new URL(u.hash.slice(1), u.origin) : u
}

/** `url` rewritten to hash routing: `/4?clicks=2` becomes `/#/4?clicks=2`. */
export function hashUrl(url) {
  const u = new URL(url)
  return `${u.origin}/#${u.pathname}${u.search}`
}
