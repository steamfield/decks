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
import { triggeringCampuses } from "../data/05-two-campuses";
import { appealGate, petition, triggerDisplay, trusteeRequest } from "../data/06-trigger-tree";
import { DIM, OFF, ON } from "./design";
import styles from "./TriggerTreeStage.module.css";

const COPY = [
  {
    lead: "The appeals could prevent mandatory intervention.",
    body: `The rule counts ${triggerDisplay.countWord} failing ratings, with unrated years pausing the count.`,
  },
  {
    lead: "A replacement board governs every campus.",
    body: "Closure applies to the campus whose ratings triggered intervention.",
  },
  {
    lead: "Parents petitioned to close both schools.",
    body: "A valid petition generally sets the remedy. Trustees can ask the commissioner for the other one.",
  },
  {
    lead: "A monitor alone does not satisfy the rule.",
    body: "A monitor or conservator can accompany board replacement or campus closure.",
  },
];

export function TriggerTreeStage() {
  const s = useTween({ branches: OFF, inputs: OFF, rootDim: ON, branchDim: ON, inputDim: ON });
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { branches: ON, rootDim: DIM, duration: DUR.grow, ease: DRAW });
      beat(1);
      tl.to(s, { inputs: ON, branchDim: DIM, duration: DUR.grow, ease: DRAW });
      beat(2);
      tl.to(s, { inputDim: DIM, duration: DUR.card, ease: SETTLE });
      beat(3);
    },
  });
  return (
    <StoryStage
      beats={beats}
      click={clicks}
      stage={
        <>
          <g style={{ opacity: s.rootDim }}>
            <text className="od-stage-name" x="960" y="304" textAnchor="middle">
              {triggeringCampuses.map((c) => c.name.replace(" Middle School", "")).join(" / ")}
            </text>
            <path d="M960 316 V340" className={styles.wire} />
            <rect x="720" y="340" width="480" height="96" className="tx-pending-box" />
            <text className="od-stage-name" x="960" y="379" textAnchor="middle">
              {appealGate.label}
            </text>
          </g>
          <g style={{ opacity: s.branches * s.branchDim }}>
            <path
              d="M960 436 V500 H650 V552 M960 500 H1270 V552"
              className={styles.wire}
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset={ON - s.branches}
            />
            <rect x="432" y="552" width="436" height="108" className={styles.node} />
            <text className="od-stage-name" x="650" y="596" textAnchor="middle">
              {triggerDisplay.board}
            </text>
            <text className="od-stage-note" x="650" y="634" textAnchor="middle">
              {triggerDisplay.boardEffect}
            </text>
            <rect x="1052" y="552" width="436" height="108" className={styles.node} />
            <text className="od-stage-name" x="1270" y="614" textAnchor="middle">
              {triggerDisplay.closure}
            </text>
          </g>
          <g style={{ opacity: s.inputs * s.inputDim }}>
            <path
              d="M412 500 H650 M1508 500 H1270"
              className={`${styles.wire} ${styles.pending}`}
            />
            <rect x="112" y="444" width="300" height="108" className="tx-pending-box" />
            <rect x="1508" y="444" width="300" height="108" className="tx-pending-box" />
            <text className="od-stage-name" x="262" y="484" textAnchor="middle">
              {trusteeRequest.label}
            </text>
            <text className="od-stage-name" x="1658" y="484" textAnchor="middle">
              {petition.label}
            </text>
          </g>
        </>
      }
      overlay={
        <>
          <h2 className="od-story-head">
            {triggerDisplay.countWord.charAt(0).toUpperCase() + triggerDisplay.countWord.slice(1)}{" "}
            failing ratings leave the state {triggerDisplay.remedyCountWord} choices.
          </h2>
          <div className={`vt-campus-pair ${styles.campusPair}`}>
            <svg viewBox="0 0 156 56" aria-hidden="true">
              <rect width="56" height="56" />
              <rect x="100" width="56" height="56" />
            </svg>
          </div>
          <span className={`tx-tag is-pending ${styles.gateTag}`} style={{ opacity: s.rootDim }}>
            {triggerDisplay.appealsPending}
          </span>
          <div className={styles.inputTags} style={{ opacity: s.inputs * s.inputDim }}>
            <span className="tx-tag is-pending">{triggerDisplay.pending}</span>
            <span className="tx-tag is-pending">{triggerDisplay.validationPending}</span>
          </div>
          <StoryLink href={triggerDisplay.sourceUrl} label={triggerDisplay.source} />
        </>
      }
      card={<StoryCard anchor="left" hue="amber" lead={copy.lead} body={copy.body} />}
    />
  );
}
