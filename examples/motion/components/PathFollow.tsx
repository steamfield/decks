import { duration, ease, useTimeline } from "@steamfield/decks/motion";
import { useRef } from "react";

export function PathFollow() {
  const route = useRef<SVGPathElement>(null);
  const marker = useRef<SVGCircleElement>(null);
  useTimeline((tl, beat) => {
    beat(0);
    const path = route.current;
    if (!path || !marker.current) return;
    const timing = { duration: duration.slow, ease: ease.draw };
    tl.fromTo(path, { drawSVG: "0%" }, { drawSVG: "50%", ...timing });
    tl.to(marker.current, { motionPath: { path, end: 0.5 }, ...timing }, "<");
    beat(1);
    tl.to(path, { drawSVG: "100%", ...timing });
    tl.to(marker.current, { motionPath: { path, start: 0.5, end: 1 }, ...timing }, "<");
    beat(2);
  });
  return (
    <svg className="scene" viewBox="0 0 1500 520" role="img" aria-label="Two legs of the route">
      <g transform="translate(90 300)">
        <path
          ref={route}
          d="M0 0 C240 0 270 -165 470 -165 S790 95 980 95 S1200 -65 1320 -65"
          fill="none"
          stroke="var(--gallery-accent)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <circle ref={marker} r="20" fill="var(--gallery-warm)" />
      </g>
    </svg>
  );
}
