import { TRACE } from "@steamfield/decks/kit";
import { duration, gsap, useTimeline } from "@steamfield/decks/motion";
import { useRef } from "react";
import { Block, channels, Fish } from "./Fish";

export function Carve() {
  const cuts = useRef<SVGGElement>(null);
  const gouge = useRef<SVGGElement>(null);
  useTimeline((tl, beat) => {
    beat(0);
    if (!cuts.current || !gouge.current) return;
    const tool = gouge.current;
    const initial = gsap.set(tool, {
      svgOrigin: "0 0",
      smoothOrigin: false,
      x: 149,
      y: 99,
      rotation: -133,
    });
    const tracks = cuts.current.querySelectorAll("path");
    channels.forEach(({ d, x, y }, i) => {
      if (i > 0) {
        const track = tracks.item(i);
        const tangent = track.getPointAtLength(1);
        const away = (Math.atan2(tangent.y - y, tangent.x - x) * 180) / Math.PI + 180;
        tl.to(tool, { y: "-=20", opacity: 0.4, duration: duration.quick });
        tl.to(tool, { x, y: y - 20, rotation: `${away}_short`, duration: duration.base });
        tl.to(tool, { y, opacity: 1, duration: duration.quick });
      }
      const timing = { duration: duration.slow, ease: TRACE };
      tl.fromTo(tracks.item(i), { drawSVG: "0%" }, { drawSVG: "100%", ...timing });
      tl.to(tool, { motionPath: { path: d, autoRotate: 180 }, ...timing }, "<");
      beat(i + 1);
    });
    return () => initial.revert();
  });
  return (
    <svg
      viewBox="-28 -48 725 365"
      role="img"
      aria-label="A gouge cuts grooves along the gill, flank and fin."
    >
      <Block>
        <Fish body="var(--od-lino)" cut="var(--od-recess)" carved={false} />
        <g ref={cuts} fill="none" stroke="var(--od-recess)" strokeWidth="4" strokeLinecap="round">
          {channels.map(({ d }) => (
            <path key={d} d={d} />
          ))}
        </g>
      </Block>
      <g ref={gouge}>
        <g>
          <path
            d="M0 0 L12 -4 H39 V4 H12 Z"
            fill="var(--od-paper)"
            stroke="var(--od-text)"
            strokeWidth="1.3"
          />
          <path
            d="M35 -6 Q39 -14 55 -12 L81 -9 Q91 -7 90 0 Q90 9 82 10 L52 12 Q40 12 35 6 Z"
            fill="var(--od-text)"
          />
          <path d="M46 -5 Q57 -9 80 -5" stroke="var(--od-lino)" fill="none" strokeWidth="2" />
        </g>
      </g>
    </svg>
  );
}
