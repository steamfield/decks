/** Guide demo (slide 88-chart-steps): illustrative figures, authored for the Decks guide.
 * Not measured observations: night pages per month for one platform team, with linked
 * runbooks shipping in October. The slide labels them as illustrative.
 */
import {
  type ChartSteps,
  ink,
  scaleChartTheme,
  slideChartTheme,
  theme,
} from "@steamfield/decks/kit";
import type { ComponentProps } from "react";

type Specs = ComponentProps<typeof ChartSteps>["specs"];

const MONTHS = [
  { month: "Jul", pages: 52 },
  { month: "Aug", pages: 47 },
  { month: "Sep", pages: 55 },
  { month: "Oct", pages: 31 },
  { month: "Nov", pages: 22 },
  { month: "Dec", pages: 18 },
];
/** The month linked runbooks shipped; it and later months are highlighted on the last step. */
const SHIPPED = 3;

/** Three steps: July to September, then through December, then the months after runbooks. */
export function monthlyPages(scale: number): Specs {
  const { fonts } = slideChartTheme;
  const base = scaleChartTheme(
    { ...slideChartTheme, fonts: { ...fonts, sizes: { ...fonts.sizes, axisTick: 28, body: 26 } } },
    scale,
  );
  const labelColor = theme().text.secondary;
  return [MONTHS.slice(0, SHIPPED), MONTHS, MONTHS].map((data, step) => ({
    mark: "bar",
    data,
    encoding: {
      x: {
        field: "month",
        type: "nominal",
        sort: null,
        scale: { domain: MONTHS.map(({ month }) => month) },
        axis: { labelColor },
      },
      y: {
        field: "pages",
        type: "quantitative",
        scale: { domain: [0, 60] },
        axis: { title: "Night pages", labelColor, tickCount: 4 },
      },
      key: { field: "month", type: "nominal" },
      color: {
        condition: {
          test: {
            field: "month",
            oneOf: step === 2 ? MONTHS.slice(SHIPPED).map(({ month }) => month) : [],
          },
          value: ink("cyan", 3),
        },
        value: ink("slate", 3),
      },
    },
    legend: { show: false },
    responsive: false,
    watermark: false,
    labels: { density: "all", placement: "outside", fontSize: 28 * scale },
    theme: base,
    animation: { enter: false, update: true },
  }));
}
