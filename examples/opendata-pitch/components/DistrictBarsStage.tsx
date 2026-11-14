import {
  type BarsHandle,
  DUR,
  type InkBarRow,
  InkBars,
  InkChip,
  InkRule,
  ink,
  SETTLE,
  StoryCard,
  StoryLayer,
  StoryLink,
  StoryStage,
  Underline,
  useStage,
} from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import { useRef } from "react";
import { BARS_BASELINE_Y, BASELINE_X } from "../data/baseline";
import {
  ARTICLE_URL,
  BAR_BAND,
  BAR_X,
  NO_SAT_IDS,
  SAT_DOMAIN,
  SAT_ROWS,
  STAAR_DOMAIN,
  STAAR_ROWS,
} from "../data/tea-districts";

const AUSTIN_INK = ink("rose", 3);
const SAT_PITCH = (BAR_BAND[1] - BAR_BAND[0]) / SAT_ROWS.length;
const rankOf = (rows: InkBarRow[], id: string) =>
  [...rows].sort((a, b) => b.value - a.value).findIndex((r) => r.id === id) + 1;
const ordinal = (n: number) => {
  const teen = n % 100 > 10 && n % 100 < 14;
  const suffix = teen ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n}${suffix}`;
};
const FINDING_CHIP = `Austin: ${ordinal(rankOf(STAAR_ROWS, "austin"))} of ${STAAR_ROWS.length} on STAAR, ${ordinal(rankOf(SAT_ROWS, "austin"))} of ${SAT_ROWS.length} on the SAT`;
const CHIP_X =
  BAR_X[0] + ((BAR_X[1] - BAR_X[0]) * (875 - SAT_DOMAIN[0])) / (SAT_DOMAIN[1] - SAT_DOMAIN[0]) + 90;
const CHIP_Y = BAR_BAND[0] + SAT_PITCH * 5;
const COPY = [
  {
    lead: "Roma is 90% low-income and triples Austin.",
    body: "Economically disadvantaged students meeting grade level on STAAR math, 2024-25.",
  },
  {
    lead: "Austin is last of the ten.",
    body: "22% of Austin's low-income students met grade level; Roma's 64% is nearly triple.",
  },
  {
    lead: "The SAT flips it.",
    body: "Same low-income students, same year. Three Valley districts beat Austin on the SAT, three trail it.",
  },
  {
    lead: "STAAR and the SAT disagree.",
    body: "One of these tests is measuring something that college readiness does not follow from.",
  },
];

export function DistrictBarsStage() {
  const bars = useRef<BarsHandle>(null);
  const s = useTween({ metric: 0, chip: 0, underline: 0, finding: 0 });
  const { clicks, playCount, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => bars.current?.addGrow(tl),
    beats: (tl, beat) => {
      beat(0);
      bars.current?.addRecolor(tl, "austin", AUSTIN_INK, `+=${DUR.opacity}`);
      tl.to(s, { underline: 1, duration: DUR.card, ease: SETTLE }, "<");
      beat(1);
      bars.current?.addExit(tl, NO_SAT_IDS);
      bars.current?.addReorder(tl, SAT_ROWS, SAT_DOMAIN, `+=${DUR.opacity}`);
      tl.to(s, { metric: 1, duration: DUR.scale, ease: SETTLE }, "<");
      tl.to(s, { chip: 1, duration: DUR.card, ease: SETTLE }, `-=${DUR.card}`);
      beat(2);
      tl.to(s, { chip: 0, duration: DUR.opacity, ease: SETTLE });
      tl.to(s, { finding: 1, duration: DUR.card, ease: SETTLE }, `-=${DUR.opacity}`);
      beat(3);
    },
  });
  const axis =
    s.metric >= 0.5
      ? { metric: "Mean SAT total, Class of 2024", start: "800", end: "1000" }
      : { metric: "STAAR math, 2024-25", start: "0", end: "70%" };
  return (
    <StoryStage
      beats={beats}
      click={clicks}
      stage={
        <>
          <g key={playCount}>
            <text
              className="od-stage-label"
              x={BAR_X[0] - 40}
              y={BARS_BASELINE_Y - 28}
              textAnchor="end"
            >
              {axis.metric}
            </text>
            <text
              className="od-stage-label"
              x={BAR_X[0]}
              y={BARS_BASELINE_Y - 28}
              textAnchor="start"
            >
              {axis.start}
            </text>
            <text className="od-stage-label" x={BAR_X[1]} y={BARS_BASELINE_Y - 28} textAnchor="end">
              {axis.end}
            </text>
          </g>
          <InkBars
            ref={bars}
            seed="tea-districts"
            hue="emerald"
            step={3}
            rows={STAAR_ROWS}
            domain={STAAR_DOMAIN}
            xRange={BAR_X}
            yBand={BAR_BAND}
            thickness={24}
            sort="desc"
          />
        </>
      }
      overlay={
        <>
          <StoryLayer className="vt-baseline">
            <InkRule
              x1={BASELINE_X[0]}
              x2={BASELINE_X[1]}
              y={BARS_BASELINE_Y}
              seed="story-baseline"
            />
          </StoryLayer>
          <h2 className="od-story-head">They had the data. They could not get at it.</h2>
          <InkChip
            x={CHIP_X}
            y={CHIP_Y}
            text="Roma drops out: 0.7% take the SAT"
            hue="rose"
            wide
            progress={s.chip}
          />
          <InkChip x={CHIP_X} y={CHIP_Y} text={FINDING_CHIP} hue="rose" wide progress={s.finding} />
          <StoryLink href={ARTICLE_URL} />
        </>
      }
      card={
        <StoryCard
          anchor="left"
          hue="emerald"
          lead={copy.lead}
          body={copy.body}
          leadContent={
            clicks === 1 ? (
              <>
                Austin is{" "}
                <Underline hue="amber" step={3}>
                  last
                </Underline>{" "}
                of the ten.
              </>
            ) : undefined
          }
        />
      }
    />
  );
}
