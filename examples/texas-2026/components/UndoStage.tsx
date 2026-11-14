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
import { earlyRemoval, replaceManager, undoLabels } from "../data/09-undo";
import { BallotOval } from "./BallotOval";
import { BASELINE_Y, changed, DIM, FRAME, neutral, OFF, ON, risk } from "./design";
import styles from "./UndoStage.module.css";

const COPY = [
  {
    lead: "The commissioner may replace individual board managers.",
    body: "Elected trustees' authority stays suspended while the appointed board serves.",
  },
  {
    lead: "The ratings must come from the same campus.",
    body: `The campus that triggered the appointment must earn ${earlyRemoval.acceptableRatings} acceptable ratings in consecutive school years.`,
  },
  {
    lead: "The commissioner can then consider early removal.",
    body: "The ratings condition must be met first. The law sets no fixed return date.",
  },
];
// The lower rule encodes a condition, not elapsed time.
const LANE = {
  x: FRAME.left,
  right: FRAME.right,
  quick: 976,
  top: 340,
  bottom: 590,
  ratingStart: 800,
  ratingGap: 648,
};
const RATINGS = Array.from(
  { length: earlyRemoval.acceptableRatings },
  (_, i) => LANE.ratingStart + i * LANE.ratingGap,
);

export function UndoStage() {
  const s = useTween({ replace: OFF, removal: OFF, ratings: OFF, earlier: ON });
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { replace: ON, duration: DUR.draw, ease: DRAW });
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { removal: ON, earlier: DIM, duration: DUR.grow, ease: DRAW });
      beat(1);
      tl.to(s, { ratings: ON, duration: DUR.scale, ease: SETTLE });
      beat(2);
    },
  });
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
          <g style={{ opacity: s.earlier }}>
            <text className="od-stage-name" x={LANE.x} y={LANE.top - 80}>
              {replaceManager.label}
            </text>
            <line
              className={styles.lane}
              x1={LANE.x}
              x2={LANE.quick}
              y1={LANE.top}
              y2={LANE.top}
              stroke={neutral()}
            />
            <line
              className={`${styles.lane} ${styles.active}`}
              x1={LANE.x}
              x2={LANE.x + (LANE.quick - LANE.x) * s.replace}
              y1={LANE.top}
              y2={LANE.top}
              stroke={changed()}
            />
            <BallotOval
              cx={LANE.quick}
              cy={LANE.top}
              state="filled"
              meaning="changed"
              fill={s.replace}
              knockout
            />
            <text
              className="od-stage-name"
              x={LANE.quick + 72}
              y={LANE.top + 9}
              style={{ opacity: s.replace }}
            >
              {replaceManager.timing}
            </text>
            <text className="od-stage-note" x={LANE.x} y={LANE.top + 70}>
              {replaceManager.actor}
            </text>
          </g>
          <g>
            <text className="od-stage-name" x={LANE.x} y={LANE.bottom - 90}>
              {earlyRemoval.label}
            </text>
            <text className="od-stage-note" x={LANE.x} y={LANE.bottom - 48}>
              {earlyRemoval.scope}
            </text>
            <line
              className={styles.lane}
              x1={LANE.x}
              x2={LANE.right}
              y1={LANE.bottom}
              y2={LANE.bottom}
              stroke={neutral()}
            />
            <line
              className={`${styles.lane} ${styles.active}`}
              x1={LANE.x}
              x2={LANE.x + (LANE.right - LANE.x) * s.removal}
              y1={LANE.bottom}
              y2={LANE.bottom}
              stroke={risk()}
            />
            {RATINGS.map((x) => (
              <g key={x} style={{ opacity: s.ratings }}>
                <BallotOval cx={x} cy={LANE.bottom} state="empty" meaning="risk" knockout />
                <text className="od-stage-name" x={x} y={LANE.bottom + 68} textAnchor="middle">
                  {undoLabels.acceptable}
                </text>
              </g>
            ))}
          </g>
        </>
      }
      overlay={
        <>
          <h2 className="od-story-head">Early removal needs consecutive acceptable ratings.</h2>
          <div
            className={styles.ratingsLabel}
            aria-hidden={clicks < 2}
            style={{ opacity: s.ratings }}
          >
            {undoLabels.consecutive}
          </div>
          <div className={styles.decision} aria-hidden={clicks < 2} style={{ opacity: s.ratings }}>
            <span className="tx-tag is-pending">{undoLabels.removalStatus}</span>
          </div>
          <StoryLink
            href={undoLabels.source}
            label="Source: Texas Education Code, appointed boards"
          />
        </>
      }
      card={<StoryCard anchor="left" hue="amber" lead={copy.lead} body={copy.body} />}
    />
  );
}
