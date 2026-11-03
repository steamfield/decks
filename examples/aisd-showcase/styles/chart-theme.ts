import { computed } from 'vue'
import { scaleChartTheme, slideChartTheme } from 'slidev-addon-decks/chart-theme'
import { useFrameScale } from 'slidev-addon-decks/story'

/** This deck's larger chart type, scaled with the story frame. */
const AISD_CHART_THEME = {
  ...slideChartTheme,
  fonts: {
    ...slideChartTheme.fonts,
    sizes: { ...slideChartTheme.fonts.sizes, subtitle: 26, body: 26, small: 22, axisTick: 26 },
  },
  spacing: { ...slideChartTheme.spacing, xAxisHeight: 64, xAxisLabelPadding: 8 },
}

export function useAisdChartTheme() {
  const chartScale = useFrameScale()
  const chartTheme = computed(() => scaleChartTheme(AISD_CHART_THEME, chartScale.value))
  return { chartTheme, chartScale }
}
