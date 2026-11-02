/**
 * Four step ink ramps, one per accent hue, from the deck theme
 * (`theme/default.json`, or the deck's `theme.json` over it).
 *
 * Step 1 is the floor: it is the darkest ink that still carries an argument,
 * so it has to clear 3:1 against the canvas. Steps 2 and 3 are the accent
 * values, step 4 is the highlight used for the current beat.
 */
import theme from '#decks/theme'
import { HUE_NAMES, type Hue, type Ramp } from '../theme/resolve'

export const CANVAS: string = theme.surfaces.canvas

export const RAMPS: Readonly<Record<Hue, Ramp>> = theme.ramps

export type { Hue }
export type InkStep = 1 | 2 | 3 | 4

export const HUES: Hue[] = [...HUE_NAMES]

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
