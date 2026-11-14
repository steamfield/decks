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
import {
  collisionTimeline,
  reportedAppealEstimate,
  timelineDisplay,
  timelineStatus,
} from "../data/07-collision-timeline";
import { CollisionTimeline } from "./CollisionTimeline";
import styles from "./CollisionTimelineStage.module.css";
import { DIM, OFF, ON } from "./design";

const events = collisionTimeline.map((event) =>
  event.id === "ratings"
    ? {
        ...event,
        date: reportedAppealEstimate.date,
        label: timelineDisplay.appeal,
        status: reportedAppealEstimate.status,
      }
    : event,
);
const ratings = collisionTimeline.find((event) => event.id === "ratings");
if (!ratings) throw new Error("CollisionTimelineStage needs the ratings event");
const dateLabel = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const COPY = [
  {
    lead: "The incumbent can still nominate a commissioner.",
    body: "The governor-elect takes office at inauguration.",
  },
  {
    lead: "Petitions are due before the governor's inauguration.",
    body: "They ask the state to close both schools. The superintendent validates them first.",
  },
  {
    lead: "Successful appeals could prevent board replacement.",
    body: `Final ratings are scheduled for ${dateLabel(ratings.date)}.`,
  },
  {
    lead: "Trustees can request closure or appointed managers.",
    body: "The request needs approval at a public board meeting.",
  },
  {
    lead: "The new governor can nominate a commissioner.",
    body: "The nominee needs Senate confirmation.",
  },
  {
    lead: timelineDisplay.question,
    body: "With valid petitions, that order would close both schools rather than replace the board.",
  },
];

export function CollisionTimelineStage() {
  const ink = useTween<Record<string, number>>(
    Object.fromEntries(events.map((event, i) => [event.id, i === 0 ? ON : OFF])),
  );
  const s = useTween({ position: Date.parse(collisionTimeline[0].date), governor: OFF });
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    beats: (tl, beat) => {
      beat(0);
      for (let i = 1; i < events.length; i++) {
        const event = events[i];
        const previous = events[i - 1];
        if (!event || !previous) throw new Error(`CollisionTimelineStage has no event at ${i}`);
        const at = tl.duration();
        tl.to(s, { position: Date.parse(event.date), duration: DUR.scale, ease: DRAW }, at);
        tl.to(ink, { [previous.id]: DIM, duration: DUR.color, ease: SETTLE }, at);
        tl.to(ink, { [event.id]: ON, duration: DUR.draw, ease: DRAW }, at + DUR.scale - DUR.draw);
        if (event.id === "inauguration")
          tl.to(s, { governor: ON, duration: DUR.color, ease: SETTLE }, at + DUR.scale - DUR.color);
        beat(i);
      }
    },
  });
  const current = events[Math.min(clicks, events.length - 1)] ?? collisionTimeline[0];
  const source =
    current.id === "election"
      ? { href: timelineDisplay.electionUrl, label: timelineDisplay.electionSource }
      : current.id === "inauguration"
        ? { href: timelineDisplay.inaugurationUrl, label: timelineDisplay.constitutionSource }
        : current.status === "reported"
          ? { href: timelineDisplay.reportUrl, label: timelineDisplay.estimateSource }
          : { href: timelineDisplay.ruleUrl, label: timelineDisplay.deadlineSource };
  return (
    <StoryStage
      beats={beats}
      click={clicks}
      stage={
        <CollisionTimeline
          domainEnd={collisionTimeline[5].date}
          ticks={events}
          state={events.map((event) => ({ ink: ink[event.id] ?? OFF, lift: OFF }))}
          position={s.position}
          governorProgress={s.governor}
        />
      }
      overlay={
        <>
          <h2 className="od-story-head">
            {timelineDisplay.deadlineMonth} deadlines come before inauguration.
          </h2>
          <div className={styles.screenReaderOnly}>
            {timelineDisplay.commissioner}: {timelineDisplay.commissionerName}.{" "}
            {current.status === "reported" ? "Approximately " : ""}
            {dateLabel(current.date)}, {current.date.slice(0, 4)}. {current.label}. {current.actor}.{" "}
            {current.status === "reported"
              ? timelineDisplay.reported
              : (timelineStatus[current.id] ?? timelineDisplay.pending)}
            .
          </div>
          <div className={styles.sources}>
            <StoryLink href={source.href} label={source.label} />
            {current.status === "reported" && (
              <StoryLink href={timelineDisplay.appealsUrl} label={timelineDisplay.appealsSource} />
            )}
          </div>
        </>
      }
      card={<StoryCard anchor="left" hue="amber" lead={copy.lead} body={copy.body} />}
    />
  );
}
