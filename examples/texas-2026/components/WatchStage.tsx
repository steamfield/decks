import { DUR, SETTLE, StoryCard, StoryLink, StoryStage, useStage } from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import {
  boardMeetings,
  collisionTimeline,
  decisionsToWatch,
  watchCount,
  watchDisplay,
  watchLabels,
} from "../data/14-watch";
import { OFF, ON } from "./design";
import styles from "./WatchStage.module.css";

const COPY = [
  {
    lead: "Each decision names who makes it.",
    body: "Some have legal deadlines. Others wait on a vote by elected officials.",
  },
  {
    lead: "Trustees must meet before the request deadline.",
    body: "Trustees need a public vote to request a different intervention.",
  },
];
const petition = collisionTimeline.find((event) => event.id === "petitions");
const request = collisionTimeline.find((event) => event.id === "trustees");
if (!petition || !request) throw new Error("WatchStage needs the petitions and trustees events");
const meeting = boardMeetings.find(
  (event) => event.date > request.date && event.kind === "Regular voting meeting",
);
if (!meeting) throw new Error(`WatchStage needs a regular voting meeting after ${request.date}`);
const date = (value: string) =>
  new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const ruleSource = { href: watchDisplay.rulesUrl, label: watchDisplay.rulesSource };
const petitionDate = petition.date;
const requestDate = request.date;
const meetingDate = meeting.date;
const meetingSource = meeting.source;

export function WatchStage() {
  const s = useTween({ topics: ON, civic: OFF });
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { topics: OFF, civic: ON, duration: DUR.color, ease: SETTLE });
      beat(1);
    },
  });
  const sources =
    clicks === 1
      ? [ruleSource, { href: meetingSource, label: watchDisplay.boardSource }]
      : [
          ruleSource,
          { href: watchDisplay.constitutionUrl, label: watchDisplay.constitution },
          { href: watchDisplay.legislatureUrl, label: watchDisplay.legislature },
        ];
  return (
    <StoryStage
      beats={beats}
      click={clicks}
      overlay={
        <>
          <h2 className="od-story-head">
            {watchCount} pending decisions will settle what changes.
          </h2>
          <div className={styles.topics} style={{ opacity: s.topics }} aria-hidden={clicks !== 0}>
            {decisionsToWatch.map((decision, i) => {
              const label = watchLabels[i];
              if (!label) throw new Error(`WatchStage has no label for ${decision.id}`);
              return (
                <div key={decision.id} className={styles.topic}>
                  <span className={styles.tick} />
                  <span className="tx-tag is-pending">{watchDisplay.pending}</span>
                  <strong>{label.name}</strong>
                  <span className={styles.actor}>{label.actor}</span>
                </div>
              );
            })}
          </div>
          <div className={styles.civic} style={{ opacity: s.civic }} aria-hidden={clicks !== 1}>
            <div className={styles.deadline}>
              <strong>{date(petitionDate)}</strong>
              <span>{watchDisplay.petition}</span>
              <span className="tx-tag is-pending">{watchDisplay.pending}</span>
            </div>
            <div className={styles.deadline}>
              <strong>{date(requestDate)}</strong>
              <span>{watchDisplay.request}</span>
              <span className="tx-tag is-pending">{watchDisplay.pending}</span>
            </div>
            <div className={styles.deadline}>
              <strong>{date(meetingDate)}</strong>
              <span>{watchDisplay.meeting}</span>
              <span className={styles.timing}>{watchDisplay.timing}</span>
            </div>
          </div>
          <div className={styles.sourceLinks}>
            {sources.map((source) => (
              <StoryLink key={source.href} href={source.href} label={source.label} />
            ))}
          </div>
        </>
      }
      card={<StoryCard anchor="left" hue="slate" lead={copy.lead} body={copy.body} />}
    />
  );
}
