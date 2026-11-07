/**
 * Theme resolution: merge a deck's `theme.json` over `default.json`, resolve
 * `{path.to.token}` aliases, validate, and render the CSS custom properties.
 *
 * Pure functions with no Node or Vite imports, so the Vite plugin in
 * `vite.config.mts`, `default.ts` and the tests all share one code path.
 */

export const HUE_NAMES = ['cyan', 'amber', 'rose', 'emerald', 'violet', 'slate'] as const
export type Hue = (typeof HUE_NAMES)[number]
export type Ramp = readonly [string, string, string, string]

export interface BrandLogo {
  /** The SVG `viewBox`, e.g. "0 0 32 32". */
  'view-box': string
  /** Inner SVG markup, rendered inside an `<svg>` the component owns. */
  svg: string
}

export interface Theme {
  surfaces: Record<'canvas' | 'canvas-cover' | 'surface' | 'surface-raised' | 'muted', string>
  text: Record<'primary' | 'secondary' | 'muted' | 'faint' | 'dim' | 'highlight', string>
  borders: Record<'default' | 'subtle' | 'rule' | 'axis', string>
  ramps: Record<Hue, Ramp>
  accents: Record<
    | 'cyan'
    | 'cyan-bright'
    | 'cyan-soft'
    | 'blue'
    | 'blue-soft'
    | 'violet'
    | 'violet-dim'
    | 'emerald'
    | 'amber'
    | 'amber-soft'
    | 'rose'
    | 'pink'
    | 'slate',
    string
  >
  glows: Record<'primary' | 'secondary' | 'amber' | 'violet' | 'emerald' | 'rose', string>
  categorical: string[]
  /** `serif` defaults to `{fonts.sans}`; the story headline and cover title read it. */
  fonts: Record<'sans' | 'serif' | 'mono', string>
  /**
   * Shape values the addon CSS reads as `--od-<key>`. `radius` and `hairline`
   * are CSS lengths (card corners, card and chip borders); `card-width` is the
   * story card's width in `--lw` frame units; `dim` is the opacity of a
   * de-emphasized mark (`InkLine` with `ghost`).
   */
  shape: Record<'radius' | 'hairline' | 'card-width' | 'dim', string>
  chart: Record<
    'text' | 'gridline' | 'axis' | 'eyebrow' | 'title' | 'subtitle' | 'source' | 'graph-label',
    string
  >
  'qr-white': string
  brand: {
    name: string
    /** Shown right-aligned on the cover row; `null` shows nothing. */
    url: string | null
    'wordmark-gradient': string
    /** `null` renders no mark. */
    logo: BrandLogo | null
  }
}

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }

function isObject(v: unknown): v is Record<string, Json> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Objects merge key by key; arrays and scalars in `over` replace `base`. */
export function deepMerge(base: Json, over: Json): Json {
  if (!isObject(base) || !isObject(over)) return over === undefined ? base : over
  const out: Record<string, Json> = { ...base }
  for (const [k, v] of Object.entries(over)) out[k] = k in base ? deepMerge(base[k], v) : v
  return out
}

const ALIAS = /\{([\w.-]+)\}/g

/**
 * Resolve `{group.token}` aliases (the W3C design-token alias form) anywhere
 * in a string value. A numeric segment into a ramp is the 1-based ink step,
 * so `{ramps.cyan.2}` is the same color as `ink('cyan', 2)`.
 */
export function resolveAliases(raw: Json): Json {
  const lookup = (path: string, seen: string[]): string => {
    if (seen.includes(path)) throw new Error(`theme: alias cycle ${[...seen, path].join(' -> ')}`)
    let node: Json = raw
    for (const seg of path.split('.')) {
      if (Array.isArray(node)) node = node[Number(seg) - 1]
      else if (isObject(node)) node = node[seg]
      else node = undefined as unknown as Json
      if (node === undefined) throw new Error(`theme: unknown alias {${path}}`)
    }
    if (typeof node !== 'string') throw new Error(`theme: alias {${path}} is not a string`)
    return expand(node, [...seen, path])
  }
  const expand = (s: string, seen: string[]): string =>
    s.replace(ALIAS, (_, path: string) => lookup(path, seen))
  const walk = (v: Json): Json => {
    if (typeof v === 'string') return expand(v, [])
    if (Array.isArray(v)) return v.map(walk)
    if (isObject(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]))
    return v
  }
  return walk(raw)
}

const HEX = /^#[0-9a-f]{6}$/i

/** Throws on a theme the components cannot render: missing hues, bad ramps, non-hex glows. */
export function validateTheme(t: Theme): Theme {
  for (const hue of HUE_NAMES) {
    const ramp = t.ramps?.[hue]
    if (!Array.isArray(ramp) || ramp.length !== 4 || !ramp.every((c) => HEX.test(c)))
      throw new Error(`theme: ramps.${hue} must be four #rrggbb colors`)
  }
  if (!HEX.test(t.surfaces.canvas)) throw new Error('theme: surfaces.canvas must be #rrggbb')
  for (const [k, v] of Object.entries(t.glows))
    if (!HEX.test(v))
      throw new Error(`theme: glows.${k} must be #rrggbb (it is used as an rgb triplet)`)
  if (!Array.isArray(t.categorical) || t.categorical.length === 0)
    throw new Error('theme: categorical must be a non-empty array')
  for (const k of ['card-width', 'dim'] as const)
    if (!/^\d*\.?\d+$/.test(String(t.shape?.[k])))
      throw new Error(`theme: shape.${k} must be a unitless number as a string, e.g. "0.4"`)
  return t
}

/** `default` merged with an optional override, aliases resolved, validated. */
export function resolveTheme(defaults: unknown, override?: unknown): Theme {
  const merged = override === undefined ? defaults : deepMerge(defaults as Json, override as Json)
  return validateTheme(resolveAliases(merged as Json) as unknown as Theme)
}

function rgbTriplet(hex: string): string {
  const h = hex.slice(1)
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(', ')
}

/**
 * The `:root` custom properties for a resolved theme. Ramps, the categorical
 * palette, chart colors and brand text are read from JS (`#decks/theme`), not
 * from CSS, so they are not emitted here.
 */
export function themeCss(t: Theme): string {
  const vars: [string, string][] = []
  for (const [k, v] of Object.entries(t.surfaces)) vars.push([k, v])
  for (const [k, v] of Object.entries(t.text))
    vars.push([k === 'primary' ? 'text' : `text-${k}`, v])
  for (const [k, v] of Object.entries(t.accents)) vars.push([k, v])
  for (const [k, v] of Object.entries(t.borders))
    vars.push([k === 'default' ? 'border' : `border-${k}`, v])
  for (const [k, v] of Object.entries(t.glows)) vars.push([`glow-${k}-rgb`, rgbTriplet(v)])
  for (const [k, v] of Object.entries(t.fonts)) vars.push([`font-${k}`, v])
  for (const [k, v] of Object.entries(t.shape)) vars.push([k, v])
  vars.push(['qr-white', t['qr-white']])
  vars.push(['wordmark-gradient', t.brand['wordmark-gradient']])
  const lines = vars.map(([k, v]) => `  --od-${k}: ${v};`)
  lines.push(
    '  --slidev-theme-background: var(--od-canvas);',
    '  --slidev-theme-color: var(--od-text);',
    '  --slidev-theme-primary: var(--od-cyan);',
    '  --slidev-theme-code-background: var(--od-surface);',
  )
  return `/* Generated from theme/default.json and the deck's theme.json. */\n:root {\n${lines.join('\n')}\n}\n`
}
