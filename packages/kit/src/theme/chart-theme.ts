import type { ThemeConfig } from "@opendata-ai/openchart-core";
import { DUR } from "./easings";
import { theme } from "./theme";

export const slideChartTheme = {
  get colors() {
    const { chart } = theme();
    return {
      background: "transparent",
      text: chart.text,
      gridline: chart.gridline,
      axis: chart.axis,
    };
  },
  get fonts() {
    const { fonts } = theme();
    return {
      family: fonts.sans,
      mono: fonts.mono,
      sizes: {
        title: 30,
        subtitle: 22,
        body: 21,
        small: 18,
        axisTick: 20,
        metricLabel: 16,
        metricValue: 38,
      },
    };
  },
  spacing: { xAxisHeight: 52, xAxisLabelPadding: 4 },
  get chrome() {
    const { chart } = theme();
    return {
      eyebrow: { color: chart.eyebrow },
      title: { color: chart.title },
      subtitle: { color: chart.subtitle },
      source: { color: chart.source },
      byline: { color: chart.source },
    };
  },
} satisfies ThemeConfig;

export function scaleChartTheme<
  T extends {
    fonts: { sizes: Record<string, number> };
    spacing: { xAxisHeight: number; xAxisLabelPadding: number };
  },
>(value: T, scale: number): T {
  return {
    ...value,
    fonts: {
      ...value.fonts,
      sizes: Object.fromEntries(
        Object.entries(value.fonts.sizes).map(([key, size]) => [key, size * scale]),
      ),
    },
    spacing: {
      ...value.spacing,
      xAxisHeight: value.spacing.xAxisHeight * scale,
      xAxisLabelPadding: value.spacing.xAxisLabelPadding * scale,
    },
  };
}

/** The chart library takes milliseconds; the values are the deck's own duration tokens. */
export const slideChartAnimation = {
  enter: { duration: DUR.scale * 1000, ease: "smooth" },
  annotationDelay: DUR.eraseDelay * 1000,
} as const;
