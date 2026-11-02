/**
 * The six marker filters, injected once per document.
 *
 * Grain is subtracted from alpha (feTurbulence into luminanceToAlpha into a
 * feComposite arithmetic pass with a negative k3), then non lite variants warp
 * the result with a low frequency displacement map. Seeds are fixed so nothing
 * shimmers on repaint.
 *
 * The defs live on document.body rather than inside a slide, because some
 * Slidev routes mount global layers once per slide and a duplicated filter id
 * silently wins or loses depending on paint order.
 */

export const DEFS_ID = 'od-story-defs'

export const FILTER_IDS = {
  marker: 'mk-marker',
  markerLite: 'mk-marker-lite',
  dry: 'mk-dry',
  dryLite: 'mk-dry-lite',
  rule: 'mk-rule',
  ruleLite: 'mk-rule-lite',
  /** Soft same hue glow for clean strokes. Not a marker filter. */
  glow: 'mk-glow',
} as const

export type FilterId = (typeof FILTER_IDS)[keyof typeof FILTER_IDS]

/** `url(#id)` for the filter attribute. */
export function filterUrl(id: string): string {
  return `url(#${id})`
}

interface FilterSpec {
  id: string
  /** How much grain is bitten out of the alpha channel. Negative. */
  dryness: number
  /** Displacement amplitude in user units. Zero on the lite variants. */
  displace: number
  /** Fixed turbulence seed. */
  seed: number
}

const SPECS: FilterSpec[] = [
  { id: FILTER_IDS.rule, dryness: -0.12, displace: 0.6, seed: 3 },
  { id: FILTER_IDS.ruleLite, dryness: -0.12, displace: 0, seed: 3 },
  { id: FILTER_IDS.marker, dryness: -0.3, displace: 2.6, seed: 7 },
  { id: FILTER_IDS.markerLite, dryness: -0.3, displace: 0, seed: 7 },
  { id: FILTER_IDS.dry, dryness: -0.55, displace: 1.8, seed: 11 },
  { id: FILTER_IDS.dryLite, dryness: -0.55, displace: 0, seed: 11 },
]

/** Blur a copy of the source under itself at reduced alpha. */
const GLOW_MARKUP =
  `<filter id="${FILTER_IDS.glow}" x="-10%" y="-10%" width="120%" height="120%" ` +
  `color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse">` +
  `<feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur"/>` +
  `<feComponentTransfer in="blur" result="halo"><feFuncA type="linear" slope="0.55"/></feComponentTransfer>` +
  `<feMerge><feMergeNode in="halo"/><feMergeNode in="SourceGraphic"/></feMerge>` +
  `</filter>`

function filterMarkup(spec: FilterSpec): string {
  const grain =
    `<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" ` +
    `seed="${spec.seed}" result="grain"/>` +
    `<feColorMatrix in="grain" type="luminanceToAlpha" result="grainAlpha"/>` +
    `<feComposite in="SourceGraphic" in2="grainAlpha" operator="arithmetic" ` +
    `k1="0" k2="1" k3="${spec.dryness}" k4="0" result="dried"/>`

  const warp =
    spec.displace === 0
      ? ''
      : `<feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" ` +
        `seed="${spec.seed + 1}" result="warp"/>` +
        `<feDisplacementMap in="dried" in2="warp" scale="${spec.displace}" ` +
        `xChannelSelector="R" yChannelSelector="G"/>`

  return (
    `<filter id="${spec.id}" x="-20%" y="-20%" width="140%" height="140%" ` +
    `color-interpolation-filters="sRGB" filterUnits="objectBoundingBox">` +
    grain +
    warp +
    `</filter>`
  )
}

/**
 * Inject the hidden defs svg if it is not already there. Safe to call from any
 * component on every mount, and a no op without a document (SSR, node tests).
 */
export function ensureStoryDefs(): void {
  if (typeof document === 'undefined') return
  if (document.getElementById(DEFS_ID)) return

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('id', DEFS_ID)
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('width', '0')
  svg.setAttribute('height', '0')
  svg.style.position = 'absolute'
  svg.style.width = '0'
  svg.style.height = '0'
  svg.style.overflow = 'hidden'
  svg.style.pointerEvents = 'none'
  svg.innerHTML = `<defs>${SPECS.map(filterMarkup).join('')}${GLOW_MARKUP}</defs>`

  document.body.appendChild(svg)
}

/** Filter markup as a string. Exported for tests and for static rendering. */
export function storyDefsMarkup(): string {
  return `<defs>${SPECS.map(filterMarkup).join('')}${GLOW_MARKUP}</defs>`
}
