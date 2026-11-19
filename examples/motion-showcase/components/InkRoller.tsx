import { TRACE } from "@steamfield/decks/kit";
import { duration, useTimeline } from "@steamfield/decks/motion";
import { useId, useRef } from "react";
import { Block, Fish } from "./Fish";

export function InkRoller() {
  const mask = useId();
  const pass = useRef<SVGPathElement>(null);
  const roller = useRef<SVGGElement>(null);
  useTimeline((tl, beat) => {
    beat(0);
    if (!pass.current || !roller.current) return;
    const track = pass.current;
    const timing = { duration: duration.slow, ease: TRACE };
    tl.fromTo(track, { drawSVG: "0%" }, { drawSVG: "100%", ...timing });
    tl.to(roller.current, { motionPath: { path: track }, ...timing }, "<");
    beat(1);
  });
  return (
    <svg
      viewBox="-28 -48 725 365"
      role="img"
      aria-label="A hand roller lays blue ink over the raised fish."
    >
      <defs>
        <mask
          style={{ maskType: "alpha" }}
          id={mask}
          maskUnits="userSpaceOnUse"
          x="-30"
          y="-30"
          width="700"
          height="350"
        >
          <path
            ref={pass}
            d="M0 0 H610"
            transform="translate(0 133)"
            stroke="currentColor"
            strokeWidth="228"
          />
        </mask>
      </defs>
      <Block>
        <Fish body="var(--od-lino)" cut="var(--od-recess)" />
        <g mask={`url(#${mask})`}>
          <Fish cut="var(--od-recess)" />
        </g>
      </Block>
      <g ref={roller}>
        <g transform="translate(0 133)">
          <path
            d="M0 -119 H27 V119 H0 M27 0 H45"
            fill="none"
            stroke="var(--od-text)"
            strokeWidth="5"
          />
          <rect x="-15" y="-114" width="31" height="228" rx="5" fill="var(--od-text)" />
          <path d="M-8 -106 V106" stroke="var(--od-blue)" strokeWidth="6" />
          <rect x="40" y="-8" width="31" height="16" rx="6" fill="var(--od-edge)" />
        </g>
      </g>
    </svg>
  );
}
