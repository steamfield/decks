/**
 * Four step ink ramps, one per accent hue in tokens.css.
 *
 * Step 1 is the floor: it is the darkest ink that still carries an argument,
 * so it has to clear 3:1 against the canvas. Steps 2 and 3 are the token
 * values, step 4 is the highlight used for the current beat.
 */

export const CANVAS = '#09090b'

export const RAMPS = {
  cyan: ['#0e7490', '#06b6d4', '#22d3ee', '#67e8f9'],
  amber: ['#d97706', '#f59e0b', '#fbbf24', '#fcd34d'],
  rose: ['#e11d48', '#f43f5e', '#fb7185', '#fda4af'],
  emerald: ['#059669', '#10b981', '#34d399', '#6ee7b7'],
  violet: ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd'],
  slate: ['#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'],
} as const

export type Hue = keyof typeof RAMPS
export type InkStep = 1 | 2 | 3 | 4

export const HUES = Object.keys(RAMPS) as Hue[]

/** Ink for a hue at step 1..4. Out of range steps clamp. */
export function ink(hue: Hue, step: InkStep = 2): string {
  const ramp = RAMPS[hue]
  const i = Math.min(ramp.length, Math.max(1, Math.round(step))) - 1
  return ramp[i]
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ]
}

function channel(v: number): number {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

/** WCAG relative luminance of a hex color. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG contrast ratio between two hex colors. Always >= 1. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const hi = Math.max(la, lb)
  const lo = Math.min(la, lb)
  return (hi + 0.05) / (lo + 0.05)
}
