import {
  DRAW,
  DUR,
  type GrowHandle,
  InkNumber,
  SETTLE,
  StoryCard,
  StoryLink,
  StoryStage,
  useStage,
} from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import { useRef } from "react";
import { aisdBudget, hb2, hb2Labels, hb2SenateVote, recapture, sameSession } from "../data/11-hb2";
import { DIM, OFF, ON } from "./design";
import styles from "./HB2Stage.module.css";
import { SeatArc } from "./SeatArc";

const billions = (hb2.additionalFunding / 1e9).toFixed(1);
const gap = `$${aisdBudget.preReductionGap / 1e6}M`;
const returned = `$${recapture.displayMillions}M`;
const shortYear = (year: string) => `${year.slice(0, 4)}–${year.slice(-2)}`;
const COPY = [
  {
    lead: `${hb2.bill} added $${billions}B for public schools.`,
    body: `It pays for teacher pay and special education in the ${hb2.period.replace("state fiscal biennium", "state budget")}.`,
  },
  {
    lead: `Every senator voted yes, ${hb2SenateVote.yes} to ${hb2SenateVote.no}.`,
    body: `That session also passed vouchers. ${sameSession.governor2025} and ${sameSession.ltGovernor2025}, who set its agenda, have now lost.`,
  },
  {
    lead: `${hb2Labels.district} still had to cut its budget.`,
    body: `It faced a ${gap} gap before ${shortYear(aisdBudget.schoolYear)} cuts and budgeted ${returned} in property taxes for the state in ${shortYear(recapture.schoolYear)}.`,
  },
];
const VOTE = { x: 1330, y: 660, compactY: 400, compactScale: 0.5 };
const groups = [{ label: hb2Labels.senate, seats: hb2SenateVote.yes, filled: hb2SenateVote.yes }];
const sources = [
  { href: "https://www.senate.texas.gov/news.php?id=20250523a", label: hb2Labels.fundingSource },
  {
    href: "https://capitol.texas.gov/tlodocs/89R/billtext/html/HB00002F.htm",
    label: hb2Labels.voteSource,
  },
  { href: "https://www.austinisd.org/budget/process", label: hb2Labels.budgetSource },
];

export function HB2Stage() {
  const amount = useRef<GrowHandle>(null);
  const s = useTween({
    funding: ON,
    vote: OFF,
    seats: OFF,
    budget: OFF,
    voteY: VOTE.y,
    voteScale: ON,
  });
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      amount.current?.addGrow(tl);
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { funding: DIM, vote: ON, duration: DUR.color, ease: SETTLE });
      tl.to(s, { seats: ON, duration: DUR.scale, ease: DRAW }, "<");
      beat(1);
      tl.to(s, {
        vote: DIM,
        voteY: VOTE.compactY,
        voteScale: VOTE.compactScale,
        duration: DUR.grow,
        ease: SETTLE,
      });
      tl.to(s, { budget: ON, duration: DUR.color, ease: SETTLE }, "<");
      beat(2);
    },
  });
  const source = sources[clicks];
  if (!source) throw new Error(`HB2Stage: no source for click ${clicks}`);
  return (
    <StoryStage
      className={styles.stage}
      beats={beats}
      click={clicks}
      stage={
        <g transform={`translate(${VOTE.x} ${s.voteY})`} style={{ opacity: s.vote }}>
          <g transform={`scale(${s.voteScale})`}>
            <SeatArc groups={groups} progress={s.seats} />
          </g>
          <text className="od-stage-name" x="0" y="50" textAnchor="middle">
            {hb2Labels.senate}
            {clicks < beats - 1 && (
              <tspan>
                : {hb2SenateVote.yes} yes · {hb2SenateVote.no} no
              </tspan>
            )}
          </text>
        </g>
      }
      overlay={
        <>
          <h2 className="od-story-head">Both parties already vote for school funding.</h2>
          <div className={styles.funding} style={{ opacity: s.funding }}>
            <InkNumber
              ref={amount}
              value={billions}
              prefix="$"
              suffix="B"
              hue="slate"
              label={`${hb2Labels.state} school funding added`}
            />
            <div className={styles.period}>
              {hb2.period.replace("state fiscal biennium", "state budget")}
            </div>
          </div>
          <div className={styles.budget} style={{ opacity: s.budget }}>
            <div className={styles.budgetItem}>
              <div className={styles.figure}>{gap}</div>
              <div className={styles.label}>Gap before reductions</div>
              <div className={styles.period}>
                {hb2Labels.district} · {shortYear(aisdBudget.schoolYear)}
              </div>
            </div>
            <div className={styles.budgetItem}>
              <div className={styles.figure}>{returned}</div>
              <div className={styles.label}>Property taxes budgeted for return</div>
              <div className={styles.period}>{shortYear(recapture.schoolYear)} budget estimate</div>
              {recapture.actualPaymentStatus === "pending" && (
                <span className={`tx-tag is-pending ${styles.tag}`}>Actual payment pending</span>
              )}
            </div>
          </div>
          <div className={styles.sourceLinks}>
            {clicks === beats - 1 && (
              <StoryLink
                href="https://www.austinisd.org/announcements/2026/06/23/superintendents-update-approved-2026-27-budget-en-espanol"
                label="Budget reductions"
              />
            )}
            <StoryLink href={source.href} label={source.label} />
          </div>
        </>
      }
      card={
        <StoryCard
          anchor="left"
          hue={clicks === beats - 1 ? "amber" : "slate"}
          lead={copy.lead}
          body={copy.body}
        />
      }
    />
  );
}
