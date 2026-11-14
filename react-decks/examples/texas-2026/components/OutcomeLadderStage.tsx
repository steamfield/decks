import {
  clamp01,
  DRAW,
  DUR,
  InkPing,
  SETTLE,
  StoryCard,
  StoryLayer,
  StoryLink,
  StoryStage,
  useStage,
} from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import { boardLabels, electionSource, evidenceLabels, sboe } from "../data/02-power-board";
import {
  additionalOffices,
  comparisonLabels,
  ladderLabels,
  outcomeLadder,
  reachedRung,
  senateMath,
} from "../data/03-outcome-ladder";
import { BallotOval } from "./BallotOval";
import { BOARD, changed, DASH, DIM, FRAME, neutral, OFF, ON, OVAL } from "./design";
import styles from "./OutcomeLadderStage.module.css";

const G = { x: 832, width: FRAME.right - 832, height: 88, groupHeight: 128 };
const rowY = (rung: number) => 180 + (rung - 1) * 100 + (rung > 5 ? 40 : OFF);
const shared = (rung: number) => rung === 2 || rung === outcomeLadder.length;
const groupWidth = (G.width - 2 * BOARD.gap) / 3;
const COPY = [
  {
    lead: "Each step adds offices or a chamber.",
    body: `Step ${outcomeLadder[0].rung} is no change. Step ${outcomeLadder.length} adds a Senate majority.`,
  },
  {
    lead: "Democrats won the governorship and the House.",
    body: "The governor can veto bills and appoint officials. The House votes on school bills.",
  },
  {
    lead: "Democrats also won the other statewide offices shown.",
    body: `The education-board majority depends on District ${sboe.district}.`,
  },
];
const descriptions = [
  outcomeLadder.map((rung) => `${rung.rung}: ${rung.outcome}.`).join(" "),
  "The governor and House rungs are filled for Democratic wins.",
  `The lieutenant governor, attorney general and comptroller are also filled. The ${comparisonLabels.currentElection} result marker reaches rung ${reachedRung.provisional}, pending the education-board result.`,
];

export function OutcomeLadderStage() {
  // Carry the previous board through the slide transition, then draw the comparison.
  const s = useTween({ carry: ON, reveal: OFF, climb: OFF, ping: OFF });
  const outline = () => Math.max(s.carry, s.reveal);
  const lit = (rung: number) =>
    rung > 1 && rung <= reachedRung.provisional
      ? Math.max(s.carry, clamp01(s.climb - rung + 2))
      : OFF;
  const emphasis = (rung: number) => {
    if (rung === 1) return s.reveal * (ON - (ON - DIM) * clamp01(s.climb));
    const earlier = rung < reachedRung.provisional ? clamp01(s.climb - rung + 1) : OFF;
    return (
      outline() *
      (ON - (ON - DIM) * Math.max(s.carry, rung === outcomeLadder.length ? OFF : earlier))
    );
  };
  const rowInk = (rung: number) =>
    `color-mix(in srgb, ${changed()} ${lit(rung) * 100}%, ${neutral(2)})`;
  const cursorY = () => {
    const rung = Math.min(reachedRung.provisional, 1 + s.climb);
    const lower = Math.floor(rung);
    return rowY(lower) + (rowY(Math.ceil(rung)) - rowY(lower)) * (rung - lower) + G.height / 2;
  };
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { carry: OFF, duration: DUR.color, ease: SETTLE });
      tl.to(s, { reveal: ON, duration: DUR.grow, ease: DRAW });
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { climb: 2, duration: DUR.grow, ease: DRAW });
      beat(1);
      tl.to(s, { climb: reachedRung.provisional - 1, ping: ON, duration: DUR.grow, ease: DRAW });
      beat(2);
    },
  });
  return (
    <StoryStage
      beats={beats}
      click={clicks}
      overlay={
        <>
          <h2 className="od-story-head">
            Only a Senate majority would have done better.
            <span className={styles.headDetail}>
              Democrats fell {senateMath.netFlipsNeeded} Senate seats short.
            </span>
          </h2>
          <p className={styles.description}>{descriptions[clicks]}</p>
          <div className="tx-baseline" />
          {[false, true].map((morph) => (
            <StoryLayer key={String(morph)} className={morph ? "vt-power-board" : undefined}>
              {outcomeLadder.map(
                (rung, i) =>
                  shared(rung.rung) === morph && (
                    <g
                      key={rung.rung}
                      data-rung={rung.rung}
                      style={{ opacity: emphasis(rung.rung) }}
                    >
                      {rung.rung === reachedRung.provisional ? (
                        additionalOffices.map((office, j) => (
                          <g
                            key={office.office}
                            transform={`translate(${G.x + j * (groupWidth + BOARD.gap)} ${rowY(rung.rung)})`}
                            style={{
                              opacity:
                                j < additionalOffices.length - 1 ? ON - (ON - DIM) * s.carry : ON,
                            }}
                          >
                            <rect
                              className={`tx-office-box ${styles.rung}`}
                              width={groupWidth * outline()}
                              height={G.groupHeight}
                              style={{ stroke: rowInk(rung.rung) }}
                              strokeDasharray={
                                j === additionalOffices.length - 1 ? DASH : undefined
                              }
                            />
                            {j === additionalOffices.length - 1 ? (
                              <text className={`od-stage-note ${styles.office}`} x="112" y="32">
                                {boardLabels.education.map((line, k) => (
                                  <tspan key={line} x="112" dy={k ? 26 : OFF}>
                                    {line}
                                  </tspan>
                                ))}
                              </text>
                            ) : (
                              <text className={`od-stage-note ${styles.office}`} x="112" y="32">
                                {office.office}
                              </text>
                            )}
                            <text className="od-stage-note" x={BOARD.pad} y="100">
                              {office.lever}
                            </text>
                            <BallotOval
                              cx={BOARD.pad + OVAL.rx}
                              cy={G.height / 2}
                              state="filled"
                              meaning={lit(rung.rung) === OFF ? "neutral" : "changed"}
                              fill={lit(rung.rung)}
                              pending={j === additionalOffices.length - 1}
                            />
                            {j === additionalOffices.length - 1 && (
                              <foreignObject x="160" y="80" width="144" height="42">
                                <span className={`tx-tag is-pending ${styles.tag}`}>
                                  {evidenceLabels.pending}
                                </span>
                              </foreignObject>
                            )}
                          </g>
                        ))
                      ) : (
                        <>
                          <rect
                            className={`tx-office-box ${styles.rung}`}
                            x={G.x}
                            y={rowY(rung.rung)}
                            width={G.width * outline()}
                            height={G.height}
                            style={{ stroke: rowInk(rung.rung) }}
                          />
                          <BallotOval
                            cx={G.x + BOARD.pad + OVAL.rx}
                            cy={rowY(rung.rung) + G.height / 2}
                            state="filled"
                            meaning={lit(rung.rung) > OFF ? "changed" : "neutral"}
                            fill={rung.rung === outcomeLadder.length ? s.carry : lit(rung.rung)}
                          />
                          <text className="od-stage-name" x={G.x + 124} y={rowY(rung.rung) + 32}>
                            {ladderLabels[i]?.office}
                          </text>
                          <text className="od-stage-note" x={G.x + 124} y={rowY(rung.rung) + 61}>
                            {ladderLabels[i]?.lever}
                          </text>
                        </>
                      )}
                      <text
                        className={`od-stage-note ${styles.rungNumber}`}
                        x={G.x - BOARD.pad}
                        y={rowY(rung.rung) + G.height / 2 + 8}
                      >
                        {rung.rung}
                      </text>
                    </g>
                  ),
              )}
              {!morph && (
                <path
                  className={styles.cursor}
                  d={`M ${G.x - 12} ${cursorY() - 12} l 18 12 l -18 12`}
                  style={{ opacity: s.reveal }}
                />
              )}
              {!morph && (
                <foreignObject
                  x={G.x - 308}
                  y={rowY(reachedRung.provisional) + 24}
                  width="280"
                  height="48"
                  style={{ opacity: clamp01(s.climb - 2) }}
                >
                  <span
                    className={`tx-tag is-pending ${styles.tag}`}
                  >{`${comparisonLabels.currentElection} result: ${evidenceLabels.pending}`}</span>
                </foreignObject>
              )}
              {!morph && (
                <InkPing
                  x={G.x - 3}
                  y={rowY(reachedRung.provisional) + G.height / 2}
                  r={OVAL.ry}
                  progress={s.ping}
                />
              )}
            </StoryLayer>
          ))}
          <StoryLink href={electionSource} label={comparisonLabels.officialSource} />
        </>
      }
      card={<StoryCard anchor="left" lead={copy.lead} body={copy.body} />}
    />
  );
}
