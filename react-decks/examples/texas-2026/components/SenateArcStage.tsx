import {
  DRAW,
  DUR,
  SETTLE,
  StoryCard,
  StoryLink,
  StoryStage,
  useStage,
} from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import { arcLabels, confirmation, holdover, senate, senateRules } from "../data/08-senate-arc";
import { BASELINE_Y, DIM, democrat, FRAME, OFF, ON, republican, SEAT_ARC_RADIUS } from "./design";
import { SeatArc } from "./SeatArc";
import styles from "./SenateArcStage.module.css";

const COPY = [
  {
    lead: "Republicans are expected to keep their majority.",
    body: `The confirmation threshold assumes all ${confirmation.present} senators attend.`,
  },
  {
    lead: "A nominee would need both parties' votes.",
    body: `That assumes all ${confirmation.present} attend and all ${senate.democratic} Democrats support the nominee.`,
  },
  {
    lead: `${holdover.name} serves until a successor qualifies.`,
    body: "Lawful removal or another applicable vacancy rule could alter his tenure.",
  },
  {
    lead: "Senators can change their chamber rules.",
    body: "The lieutenant governor's committee and agenda powers depend on rules senators can revise.",
  },
];
const ARC = { x: 960, y: BASELINE_Y, scale: 1, labelGap: 40, labelY: -50 };

export function SenateArcStage() {
  const s = useTween({ enter: OFF, confirm: OFF, incumbent: OFF, rules: OFF, arc: ON, tenure: ON });
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { enter: ON, duration: DUR.grow, ease: DRAW });
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { confirm: ON, duration: DUR.grow, ease: DRAW });
      beat(1);
      tl.to(s, { incumbent: ON, arc: DIM, duration: DUR.color, ease: SETTLE });
      beat(2);
      tl.to(s, { rules: ON, tenure: DIM, duration: DUR.color, ease: SETTLE });
      beat(3);
    },
  });
  const groups = [
    {
      label: arcLabels.democratic,
      seats: senate.democratic,
      filled: senate.democratic,
      color: democrat(),
    },
    {
      label: arcLabels.republican,
      seats: senate.republican,
      filled: senate.republican,
      color: republican(),
    },
  ];
  const thresholds = [
    { at: senate.majority, label: `${arcLabels.majority}: ${senate.majority}`, progress: ON },
    {
      at: confirmation.required,
      label: `${arcLabels.confirmation}: ${confirmation.required}`,
      progress: s.confirm,
    },
  ];
  const source =
    clicks >= 3
      ? arcLabels.rulesSource
      : clicks === 2
        ? arcLabels.holdoverSource
        : arcLabels.source;
  return (
    <StoryStage
      beats={beats}
      click={clicks}
      stage={
        <>
          <line
            className="tx-field-rule"
            x1={FRAME.left}
            x2={FRAME.right}
            y1={BASELINE_Y}
            y2={BASELINE_Y}
          />
          <g transform={`translate(${ARC.x} ${ARC.y})`} style={{ opacity: s.arc }}>
            <g transform={`scale(${ARC.scale})`}>
              <SeatArc
                groups={groups}
                progress={s.enter}
                thresholds={thresholds}
                highlight={{
                  from: senate.democratic,
                  to: confirmation.required,
                  progress: s.confirm,
                }}
              />
            </g>
            <g style={{ opacity: s.enter }}>
              <text
                className="od-stage-name"
                x={-SEAT_ARC_RADIUS * ARC.scale - ARC.labelGap}
                y={ARC.labelY}
                textAnchor="end"
              >
                {senate.democratic} {arcLabels.democratic}
              </text>
              <text
                className="od-stage-name"
                x={SEAT_ARC_RADIUS * ARC.scale + ARC.labelGap}
                y={ARC.labelY}
              >
                {senate.republican} {arcLabels.republican}
              </text>
            </g>
          </g>
        </>
      }
      overlay={
        <>
          <h2 className="od-story-head">
            With {confirmation.present} present, confirmation takes {confirmation.required} votes.
          </h2>
          <div
            className={styles.gap}
            aria-hidden={clicks < 1}
            style={{ opacity: s.confirm * s.arc }}
          >
            <strong>
              {confirmation.otherVotesNeeded} {arcLabels.gap}
            </strong>
            <span className="tx-tag is-scenario">{arcLabels.scenario}</span>
          </div>
          <div
            className={styles.office}
            aria-hidden={clicks < 2}
            style={{ opacity: s.incumbent * s.tenure }}
          >
            <strong>{holdover.name}</strong>
            <span className="tx-tag is-pending">{arcLabels.departureStatus}</span>
          </div>
          <div className={styles.rules} aria-hidden={clicks < 3} style={{ opacity: s.rules }}>
            <strong>{senateRules.affectedOffice}</strong>
            <span>{arcLabels.rules}</span>
            <span className="tx-tag is-pending">{arcLabels.ruleStatus}</span>
          </div>
          <StoryLink
            href={source}
            label={
              clicks >= 3 ? "Source: Texas Tribune, Senate rules" : "Source: Texas Constitution"
            }
          />
        </>
      }
      card={<StoryCard anchor="left" hue="amber" lead={copy.lead} body={copy.body} />}
    />
  );
}
