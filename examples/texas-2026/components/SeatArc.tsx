import { clamp01, type InkStep, parliament } from "@steamfield/decks/kit";
import { neutral, OFF, ON, PARLIAMENT, SEAT_ARC_RADIUS } from "./design";
import styles from "./SeatArc.module.css";

export function SeatArc({
  groups,
  progress = ON,
  thresholds = [],
  highlight,
}: {
  groups: readonly {
    label: string;
    seats: number;
    filled: number;
    step?: InkStep;
    progress?: number;
    color?: string;
  }[];
  progress?: number;
  thresholds?: readonly { at: number; label: string; progress: number }[];
  highlight?: { from: number; to: number; progress: number };
}) {
  const positions = parliament.layout(
    groups.reduce((sum, group) => sum + group.seats, OFF),
    {
      radius: SEAT_ARC_RADIUS,
      rows: PARLIAMENT.rowCount,
      rowGap: PARLIAMENT.rowGap,
    },
  ).seats;
  let start = OFF;
  const seats = groups.flatMap((group) => {
    const groupStart = start;
    start += group.seats;
    return Array.from({ length: group.seats }, (_, i) => ({
      ...positions[groupStart + i],
      index: groupStart + i,
      label: group.label,
      color: group.color ?? neutral(group.step ?? 2),
      fill: clamp01(group.filled * clamp01(group.progress ?? ON) - i),
    }));
  });
  const thresholdPoint = (at: number, radius: number) => {
    const angle = parliament.thresholdAngle(positions, at);
    return { x: Math.cos(angle) * radius, y: -Math.sin(angle) * radius };
  };
  const ruleStart = SEAT_ARC_RADIUS + PARLIAMENT.seatRadius + PARLIAMENT.rulePadding;
  const ruleEnd = ruleStart + PARLIAMENT.tickLength;
  const revealAt = (index: number) => clamp01(clamp01(progress) * positions.length - index);
  const highlightAt = (index: number) =>
    highlight && index >= highlight.from && index < highlight.to
      ? clamp01(highlight.progress)
      : OFF;
  return (
    <g>
      {seats.map((seat) => (
        <g
          key={seat.index}
          data-seat={seat.index}
          data-group={seat.label}
          style={{ opacity: revealAt(seat.index) }}
        >
          <circle cx={seat.x} cy={seat.y} r={PARLIAMENT.seatRadius * seat.fill} fill={seat.color} />
          <circle
            className={styles.highlight}
            cx={seat.x}
            cy={seat.y}
            r={PARLIAMENT.ringRadius}
            style={{ opacity: highlightAt(seat.index), stroke: neutral(4) }}
          />
        </g>
      ))}
      {thresholds.map((threshold) => (
        <g key={threshold.at} style={{ opacity: clamp01(threshold.progress), color: neutral(3) }}>
          <line
            className={styles.threshold}
            x1={thresholdPoint(threshold.at, ruleStart).x}
            y1={thresholdPoint(threshold.at, ruleStart).y}
            x2={
              thresholdPoint(
                threshold.at,
                ruleStart + (ruleEnd - ruleStart) * clamp01(threshold.progress),
              ).x
            }
            y2={
              thresholdPoint(
                threshold.at,
                ruleStart + (ruleEnd - ruleStart) * clamp01(threshold.progress),
              ).y
            }
          />
          <text
            className={`od-stage-note ${styles.label}`}
            x={thresholdPoint(threshold.at, PARLIAMENT.labelRadius).x}
            y={thresholdPoint(threshold.at, PARLIAMENT.labelRadius).y}
            textAnchor="middle"
          >
            {threshold.label}
          </text>
        </g>
      ))}
    </g>
  );
}
