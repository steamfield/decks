import {
  DRAW,
  DUR,
  FILTER_IDS,
  filterUrl,
  type gsap,
  ink,
  xScale as scale,
} from "@react-decks/kit";
import { useTween } from "@react-decks/motion";
import { type Ref, useImperativeHandle } from "react";
import { type Point, polylinePath } from "./line-path";

export interface LineHandle {
  addDraw(tl: gsap.core.Timeline, position?: gsap.Position): gsap.core.Timeline;
}

export function InkLine({
  series,
  xDomain,
  yDomain,
  xRange,
  yRange,
  ref,
}: {
  series: Point[];
  xDomain: [number, number];
  yDomain: [number, number];
  xRange: [number, number];
  yRange: [number, number];
  ref: Ref<LineHandle>;
}) {
  const draw = useTween({ t: 1 });
  useImperativeHandle(
    ref,
    () => ({
      addDraw: (tl, at) => tl.fromTo(draw, { t: 0 }, { t: 1, duration: DUR.grow, ease: DRAW }, at),
    }),
    [draw],
  );
  const sx = scale(xDomain, xRange);
  const sy = scale(yDomain, yRange);
  const path = polylinePath(series.map((p) => ({ x: sx(p.x), y: sy(p.y) })));
  return (
    <g className="od-ink-line-root" style={{ color: ink("cyan", 3) }}>
      <g className="od-ink-line" style={{ "--od-clip": `${(1 - draw.t) * 100}%` }}>
        <g className="od-ink-body" filter={filterUrl(FILTER_IDS.glow)}>
          <path
            d={path}
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </g>
    </g>
  );
}
