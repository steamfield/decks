import { useId } from "react";
import styles from "./BallotOval.module.css";
import { changed, DASH, HATCH, neutral, OFF, ON, OVAL, risk } from "./design";

/** The fill grows radially inside a fixed outline. */
export function BallotOval({
  cx,
  cy,
  size = OVAL.size,
  state = "empty",
  meaning = "neutral",
  fill = ON,
  knockout = false,
  pending = false,
}: {
  cx: number;
  cy: number;
  size?: number;
  state?: "empty" | "filled" | "hatched";
  meaning?: "changed" | "risk" | "neutral";
  fill?: number;
  knockout?: boolean;
  pending?: boolean;
}) {
  const patternId = `tx-hatch-${useId()}`;
  const color = { changed, risk, neutral }[meaning]();
  const progress = Math.max(OFF, Math.min(ON, fill)) * (pending ? OVAL.pendingFill : ON);
  const rx = OVAL.rx * size;
  const ry = OVAL.ry * size;
  return (
    <g className="tx-oval" transform={`translate(${cx} ${cy})`} style={{ color }}>
      {state === "hatched" && (
        <defs>
          <pattern
            id={patternId}
            patternUnits="userSpaceOnUse"
            width={HATCH.spacing}
            height={HATCH.spacing}
          >
            <path d={HATCH.path} className="tx-hatch" />
          </pattern>
        </defs>
      )}
      {knockout && <ellipse className={styles.knockout} rx={rx} ry={ry} />}
      {state !== "empty" && (
        <ellipse
          className="tx-oval-fill"
          rx={rx}
          ry={ry}
          fill={state === "hatched" ? `url(#${patternId})` : color}
          transform={`scale(${progress})`}
        />
      )}
      <ellipse
        className="tx-oval-outline"
        rx={rx}
        ry={ry}
        strokeDasharray={pending ? DASH : undefined}
      />
    </g>
  );
}
