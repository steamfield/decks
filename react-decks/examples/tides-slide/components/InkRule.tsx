import { DRAW, DUR, type gsap, ink } from "@react-decks/kit";
import { type Ref, useImperativeHandle, useRef } from "react";

export interface RuleHandle {
  addDraw(tl: gsap.core.Timeline, position?: gsap.Position): gsap.core.Timeline;
}
export function InkRule({
  x1,
  x2,
  y,
  ref,
}: {
  x1: number;
  x2: number;
  y: number;
  ref: Ref<RuleHandle>;
}) {
  const root = useRef<SVGGElement>(null);
  useImperativeHandle(
    ref,
    () => ({
      addDraw: (tl, at) =>
        tl.fromTo(
          root.current,
          { "--od-clip": "100%" },
          { "--od-clip": "0%", duration: DUR.draw, ease: DRAW },
          at,
        ),
    }),
    [],
  );
  return (
    <g ref={root} className="od-ink-rule" style={{ color: ink("slate", 1), opacity: 0.55 }}>
      <line
        x1={x1}
        x2={x2}
        y1={y}
        y2={y}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </g>
  );
}
