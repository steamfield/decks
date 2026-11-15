import { xScale } from "../geometry/scales";
import { ink } from "../theme/theme";
import type { Hue } from "../theme/theme-resolve";
import { STROKE } from "./ink-style";

export function InkTimelineCursor({
  position,
  domain,
  range,
  y,
  hue,
}: {
  position: number;
  domain: [number, number];
  range: [number, number];
  y: number;
  hue: Hue;
}) {
  const x = xScale(domain, range)(position);
  return (
    <g className="timeline-cursor" style={{ color: ink(hue, 3) }}>
      <line x1={range[0]} x2={x} y1={y} y2={y} stroke="currentColor" strokeWidth={STROKE.faint} />
      <circle
        cx={x}
        cy={y}
        r={9}
        className="cursor-dot"
        stroke="currentColor"
        strokeWidth={STROKE.tick}
      />
    </g>
  );
}
