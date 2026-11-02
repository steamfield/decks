import type { ThemeConfig } from '@opendata-ai/openchart-core'

/**
 * Shared chart theme for Slidev decks. Import and spread into your chart spec
 * instead of copy-pasting the theme block per slide.
 *
 * Usage in a page's <script setup>:
 *   import { slideChartTheme } from 'slidev-addon-decks/chart-theme'
 *   const spec = { ..., theme: slideChartTheme, ... }
 *
 * Per-slide overrides via spread:
 *   theme: { ...slideChartTheme, spacing: { ...slideChartTheme.spacing, xAxisHeight: 60 } }
 */
export const slideChartTheme = {
  colors: {
    background: 'transparent',
    text: '#a1a1aa',
    gridline: 'rgba(255,255,255,0.05)',
    axis: 'rgba(255,255,255,0.12)',
  },
  fonts: {
    family: 'Inter, sans-serif',
    mono: 'Inter, sans-serif',
    sizes: { title: 30, subtitle: 22, body: 21, small: 18, axisTick: 20, metricLabel: 16, metricValue: 38 },
  },
  spacing: {
    xAxisHeight: 52,
    xAxisLabelPadding: 4,
  },
  chrome: {
    eyebrow: { color: '#06b6d4' },
    title: { color: '#f7f8f8' },
    subtitle: { color: '#a1a1aa' },
    source: { color: '#71717a' },
    byline: { color: '#71717a' },
  },
} as const satisfies ThemeConfig

/**
 * Compact variant for charts rendered inside a DemoWindow / scripted-demo
 * card, where the chart shares the slide with chat turns and gets a fraction
 * of the canvas. Use instead of hand-shrinking slideChartTheme per component.
 */
export const demoChartTheme = {
  ...slideChartTheme,
  fonts: {
    ...slideChartTheme.fonts,
    sizes: { ...slideChartTheme.fonts.sizes, title: 21, subtitle: 16, body: 16, small: 14, axisTick: 15 },
  },
} as const satisfies ThemeConfig

type ChartTheme = {
  fonts: { sizes: Record<string, number> }
  spacing: { xAxisHeight: number; xAxisLabelPadding: number }
}

/**
 * A theme's pixel sizes multiplied by `scale`. OpenChart sizes text in CSS
 * pixels, so a chart inside a story frame passes `useFrameScale()` here to
 * keep its type in proportion with the frame below 1920 wide.
 */
export function scaleChartTheme<T extends ChartTheme>(theme: T, scale: number): T {
  return {
    ...theme,
    fonts: {
      ...theme.fonts,
      sizes: Object.fromEntries(Object.entries(theme.fonts.sizes).map(([k, v]) => [k, v * scale])),
    },
    spacing: {
      ...theme.spacing,
      xAxisHeight: theme.spacing.xAxisHeight * scale,
      xAxisLabelPadding: theme.spacing.xAxisLabelPadding * scale,
    },
  }
}

export const slideChartAnimation = {
  enter: { duration: 900, ease: 'smooth' as const },
  annotationDelay: 350,
} as const
