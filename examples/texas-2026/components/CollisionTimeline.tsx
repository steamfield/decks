import {
  InkTimeline,
  InkTimelineCursor,
  type TickState,
  type TimelineTick,
  xScale,
} from "@steamfield/decks/kit";
import { collisionTimeline, timelineDisplay, timelineStatus } from "../data/07-collision-timeline";
import styles from "./CollisionTimeline.module.css";
import { changed, DIM, neutral, OFF, ON } from "./design";

const RANGE: [number, number] = [400, 1740];
const DISTRICT_ROWS = [310, 400, 490] as const;
const GOVERNOR_Y = 580;
const COMMISSIONER_Y = 672;
const start = Date.parse(collisionTimeline[0].date);
const inauguration = collisionTimeline.find((event) => event.id === "inauguration");
if (!inauguration) throw new Error("CollisionTimeline needs the inauguration event");
const inaugurationDate = Date.parse(inauguration.date);
const dateLabel = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const row = (id: string) =>
  id === "election" || id === "inauguration"
    ? GOVERNOR_Y
    : id === "order"
      ? COMMISSIONER_Y
      : id === "petitions"
        ? DISTRICT_ROWS[0]
        : id === "ratings"
          ? DISTRICT_ROWS[1]
          : DISTRICT_ROWS[2];

export function CollisionTimeline({
  domainEnd,
  ticks,
  position = start,
  state,
  governorProgress = OFF,
}: {
  domainEnd: string;
  ticks: readonly { id: string; date: string; label: string; status: string }[];
  position?: number;
  state?: TickState[];
  governorProgress?: number;
}) {
  const domain: [number, number] = [start, Date.parse(domainEnd)];
  const scale = xScale(domain, RANGE);
  const states = state ?? ticks.map(() => ({ ink: ON, lift: OFF }));
  const marks = ticks.map((tick, i) => ({
    ...tick,
    x: scale(Date.parse(tick.date)),
    y: row(tick.id),
    ink: states[i]?.ink ?? ON,
    left: Date.parse(tick.date) > domain[0] + (domain[1] - domain[0]) * 0.7,
    dateLabel: `${tick.status === "reported" ? "≈ " : ""}${dateLabel(tick.date)}`,
    statusLabel:
      tick.status === "reported"
        ? timelineDisplay.reported
        : (timelineStatus[tick.id] ?? timelineDisplay.pending),
  }));
  const ordered = [...ticks].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  const next = ordered.findIndex((tick) => Date.parse(tick.date) >= position);
  let cursorY: number;
  if (next <= 0) cursorY = row((next === 0 ? ordered[0] : ordered.at(-1))?.id ?? "election");
  else {
    const before = ordered[next - 1];
    const after = ordered[next];
    if (!before || !after) throw new Error(`CollisionTimeline has no ticks around ${position}`);
    const progress =
      (position - Date.parse(before.date)) / (Date.parse(after.date) - Date.parse(before.date));
    cursorY = row(before.id) + (row(after.id) - row(before.id)) * progress;
  }
  const date = new Date(start);
  date.setUTCDate(1);
  const months: TimelineTick[] = [];
  while (date.getTime() <= domain[1]) {
    months.push({
      id: date.toISOString(),
      at: Math.max(start, date.getTime()),
      label: date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
    });
    date.setUTCMonth(date.getUTCMonth() + 1);
  }
  const monthStates = months.map(() => ({ ink: ON, lift: OFF }));
  const yearLabel = [
    ...new Set([collisionTimeline[0].date.slice(0, 4), domainEnd.slice(0, 4)]),
  ].join(" / ");
  return (
    <g className={styles.timeline}>
      <text className="od-stage-note" x={RANGE[1]} y="186" textAnchor="end">
        {yearLabel}
      </text>
      <InkTimeline
        ticks={months}
        state={monthStates}
        domain={domain}
        range={RANGE}
        y={206}
        hue="slate"
        labelSize={26}
        labelRows={1}
        labelOffset={36}
        tickHeight={20}
      />
      <g style={{ opacity: DIM }}>
        {[...DISTRICT_ROWS, GOVERNOR_Y, COMMISSIONER_Y].map((y) => (
          <line
            key={y}
            x1={RANGE[0]}
            x2={RANGE[1]}
            y1={y}
            y2={y}
            stroke={neutral()}
            className={styles.row}
          />
        ))}
        <path d="M378 310 H366 V490 H378" className={styles.districtBracket} />
      </g>
      <text className="od-stage-name" x="112" y="409">
        {timelineDisplay.district}
      </text>
      <text className="od-stage-name" x="112" y={GOVERNOR_Y + 9}>
        {timelineDisplay.governor}
      </text>
      <text className="od-stage-name" x="112" y={COMMISSIONER_Y + 9}>
        {timelineDisplay.commissioner}
      </text>
      <text className="od-stage-note" x={RANGE[0]} y={COMMISSIONER_Y - 18}>
        {timelineDisplay.commissionerName}
      </text>
      <line
        x1={scale(inaugurationDate)}
        x2={RANGE[1]}
        y1={GOVERNOR_Y}
        y2={GOVERNOR_Y}
        stroke={changed()}
        style={{ opacity: governorProgress }}
        className={styles.row}
      />
      {marks.map((mark) => (
        <g key={mark.id} style={{ opacity: mark.ink }}>
          <line
            x1={mark.x}
            x2={mark.x}
            y1={mark.y - 14}
            y2={mark.y + 14}
            className={`${styles.eventTick} ${mark.status === "reported" ? styles.reported : ""}`}
          />
          <text
            className="od-stage-note"
            x={mark.left ? mark.x : mark.x - 18}
            y={mark.y - (mark.left ? 40 : 8)}
            textAnchor={mark.left ? "middle" : "end"}
          >
            {mark.dateLabel}
          </text>
          <text
            className="od-stage-name"
            x={mark.x + (mark.left ? -18 : 18)}
            y={mark.y - 8}
            textAnchor={mark.left ? "end" : "start"}
          >
            {mark.id === "order" ? timelineDisplay.orderTick : mark.label}
          </text>
          <foreignObject
            x={mark.left ? mark.x - 278 : mark.x + 18}
            y={mark.y + 10}
            width="260"
            height="42"
          >
            <div className={mark.left ? styles.alignEnd : undefined}>
              <span
                className={`tx-tag ${mark.status === "reported" ? "is-reported" : "is-pending"}`}
              >
                {mark.statusLabel}
              </span>
            </div>
          </foreignObject>
        </g>
      ))}
      <InkTimelineCursor
        position={position}
        domain={domain}
        range={RANGE}
        y={cursorY}
        hue="amber"
      />
    </g>
  );
}
