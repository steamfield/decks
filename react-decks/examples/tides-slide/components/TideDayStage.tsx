import {
  DUR,
  ink,
  StoryCard,
  StoryLayer,
  StoryLink,
  StoryStage,
  xScale as scale,
  useStage,
} from "@react-decks/kit";
import { useTween } from "@react-decks/motion";
import { useRef } from "react";
import { DAYS_LABEL, HIGHS, HOURLY } from "../data/boston-days";
import labels from "../data/tide-labels.json";
import { InkChip } from "./InkChip";
import { InkLine, type LineHandle } from "./InkLine";
import { InkRule, type RuleHandle } from "./InkRule";

const X_DOMAIN: [number, number] = [0, 47];
const Y_DOMAIN: [number, number] = [0, 3.6];
const X_RANGE: [number, number] = [220, 1700];
const Y_RANGE: [number, number] = [620, 230];
const sx = scale(X_DOMAIN, X_RANGE);
const sy = scale(Y_DOMAIN, Y_RANGE);
const DOTS = HIGHS.map((h) => ({ x: sx(h.x), y: sy(h.y) }));
const CHIP_X = ((DOTS[0]?.x ?? 0) + (DOTS[1]?.x ?? 0)) / 2 - 90;
const TICKS = [
  { x: sx(0), text: "Jun 11, 00:00" },
  { x: sx(24), text: "Jun 12, 00:00" },
  { x: sx(47), text: "23:00" },
];
const COPY = [
  {
    lead: "Water level, hour by hour, for two days.",
    body: `NOAA prediction for Boston Harbor, ${DAYS_LABEL}, in meters above mean lower low water.`,
  },
  {
    lead: `High tides arrive ${labels.HIGH_GAP_LABEL} apart.`,
    body: `That is the average gap between every Boston high tide from ${labels.WINDOW_LABEL}.`,
  },
  {
    lead: "The schedule follows the Moon.",
    body: `Two tides take ${labels.LUNAR_DAY_LABEL}, the time Earth needs to turn back under the Moon.`,
  },
];

export function TideDayStage() {
  const line = useRef<LineHandle>(null);
  const rule = useRef<RuleHandle>(null);
  const s = useTween({ dots: 0, chip: 0 });
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      rule.current?.addDraw(tl, 0);
    },
    beats: (tl, beat) => {
      beat(0);
      line.current?.addDraw(tl);
      beat(1);
      tl.to(s, { dots: 1, duration: DUR.opacity });
      tl.to(s, { chip: 1, duration: DUR.card });
      beat(2);
    },
  });
  return (
    <StoryStage
      beats={beats}
      click={clicks}
      stage={
        <g>
          <InkLine
            ref={line}
            series={HOURLY}
            xDomain={X_DOMAIN}
            yDomain={Y_DOMAIN}
            xRange={X_RANGE}
            yRange={Y_RANGE}
          />
          {DOTS.map((d) => (
            <circle
              key={d.x}
              cx={d.x}
              cy={d.y}
              r="11"
              fill={ink("cyan", 4)}
              style={{ opacity: s.dots }}
            />
          ))}
          {TICKS.map((t) => (
            <text key={t.text} className="od-stage-label" x={t.x} y={672} textAnchor="middle">
              {t.text}
            </text>
          ))}
        </g>
      }
      overlay={
        <>
          <StoryLayer>
            <InkRule ref={rule} x1={220} x2={1700} y={620} />
          </StoryLayer>
          <h2 className="od-story-head">Boston gets two high tides a day.</h2>
          <InkChip x={CHIP_X} y={sy(3.45)} text={labels.HIGH_GAP_LABEL} progress={s.chip} />
          <StoryLink
            href="https://tidesandcurrents.noaa.gov/stationhome.html?id=8443970"
            label="NOAA CO-OPS, station 8443970"
          />
        </>
      }
      card={<StoryCard lead={copy.lead} body={copy.body} />}
    />
  );
}
