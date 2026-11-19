import {
  ChartSteps,
  ink,
  StoryCard,
  StoryStage,
  scaleChartTheme,
  slideChartTheme,
  theme,
  useFrameScale,
  useStage,
} from "@steamfield/decks/kit";
import type { ComponentProps } from "react";
import {
  AFTER,
  AFTER_LAST_CHANGE,
  BEFORE,
  BEFORE_LAST_CHANGE,
  TREND_HEADLINE,
  TREND_SOURCE,
  TREND_STEPS,
  WEEKS,
} from "../data/build-times";
import { CHANGES } from "../data/changes";
import styles from "./TrendStage.module.css";

type Specs = ComponentProps<typeof ChartSteps>["specs"];

const [cache, parallel, image] = CHANGES;

const COPY = [
  {
    lead: `Weeks 1 to ${(cache?.week ?? 1) - 1}: about ${BEFORE} minutes a build.`,
    body: "The median CI build each week, every branch.",
  },
  {
    lead: `Caching and parallel tests cut it to ${BEFORE_LAST_CHANGE}.`,
    body: `The cache shipped in week ${cache?.week}, parallel tests in week ${parallel?.week}.`,
  },
  {
    lead: `A smaller image brought it to ${AFTER}.`,
    body: `It shipped in week ${image?.week}, and the median has held since.`,
  },
];

function trendSpecs(scale: number): Specs {
  const { fonts } = slideChartTheme;
  const base = scaleChartTheme(
    { ...slideChartTheme, fonts: { ...fonts, sizes: { ...fonts.sizes, axisTick: 26, body: 24 } } },
    scale,
  );
  const labelColor = theme().text.secondary;
  return TREND_STEPS.map((data, step) => ({
    mark: "bar",
    data,
    encoding: {
      x: {
        field: "week",
        type: "nominal",
        sort: null,
        scale: { domain: WEEKS.map(({ week }) => week) },
        axis: { labelColor },
      },
      y: {
        field: "minutes",
        type: "quantitative",
        scale: { domain: [0, 16] },
        axis: { title: "Median build, minutes", labelColor, tickCount: 4 },
      },
      key: { field: "week", type: "nominal" },
      color: {
        condition: {
          test: { field: "week", oneOf: step === 2 ? AFTER_LAST_CHANGE : [] },
          value: ink("amber", 3),
        },
        value: ink("slate", 2),
      },
    },
    legend: { show: false },
    responsive: false,
    watermark: false,
    labels: { density: "all", placement: "outside", format: ".1f", fontSize: 24 * scale },
    theme: base,
    animation: { enter: false, update: true },
  }));
}

/** Slide 03-trend: the weekly median, stepped from before the first change to after the last. */
export function TrendStage() {
  const scale = useFrameScale();
  // ChartSteps animates the bars from the slide's click itself, so the stage's own timeline only
  // marks the beats the card copy follows.
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    beats: (_tl, beat) => {
      for (let n = 0; n < COPY.length; n++) beat(n);
    },
  });
  return (
    <StoryStage
      beats={beats}
      click={clicks}
      overlay={
        <>
          <h2 className="od-story-head is-wide">{TREND_HEADLINE}</h2>
          <div className={`${styles.chart} od-enter-b`}>
            <ChartSteps specs={trendSpecs(scale)} at={1} />
          </div>
          <p className={`${styles.source} od-enter-c`}>{TREND_SOURCE}</p>
        </>
      }
      card={<StoryCard hue="amber" lead={copy.lead} body={copy.body} />}
    />
  );
}
