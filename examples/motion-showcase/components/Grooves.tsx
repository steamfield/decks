import { duration, ease, useTimeline } from "@steamfield/decks/motion";
import { useId, useRef } from "react";
import { Fish } from "./Fish";
import styles from "./Grooves.module.css";

export function Grooves() {
  return (
    <svg
      className={styles.face}
      width="1200"
      height="620"
      viewBox="0 0 1200 620"
      role="img"
      aria-label="Blue ink surrounds the uninked gill cut."
    >
      <g transform="translate(0 35) scale(2)">
        <Fish cut="var(--od-recess)" />
      </g>
    </svg>
  );
}

export function GrooveSection() {
  const id = useId();
  const opening = useRef<SVGCircleElement>(null);
  const guide = useRef<SVGPathElement>(null);
  useTimeline((tl, beat) => {
    beat(0);
    if (!opening.current || !guide.current) return;
    tl.fromTo(
      guide.current,
      { drawSVG: "50% 50%" },
      { drawSVG: "0% 100%", duration: duration.base, ease: ease.draw },
      duration.base,
    );
    beat(1);
    tl.fromTo(
      opening.current,
      { attr: { r: 0 } },
      { attr: { r: 1000 }, duration: duration.slow, ease: ease.draw },
    );
    beat(2);
  });
  return (
    <svg
      className={styles.section}
      viewBox="0 0 1000 620"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="In cross section, blue ink coats the raised surfaces on either side of the dry groove."
    >
      <defs>
        <clipPath id={id}>
          <circle ref={opening} cx="500" cy="310" r="0" />
        </clipPath>
      </defs>
      <path ref={guide} d="M400 310H600" fill="none" stroke="var(--od-paper)" strokeWidth="4" />
      <g clipPath={`url(#${id})`}>
        <path fill="var(--od-paper)" d="M0 0H1000V620H0Z" />
        <path fill="var(--od-lino)" d="M0 300H445Q455 420 500 440Q545 420 555 300H1000V620H0Z" />
        <path d="M0 300H445 M555 300H1000" fill="none" stroke="var(--od-blue)" strokeWidth="16" />
        <path
          d="M445 306Q455 420 500 440Q545 420 555 306"
          fill="none"
          stroke="var(--od-recess)"
          strokeWidth="5"
        />
        <text x="500" y="196" textAnchor="middle" fill="var(--od-text)">
          Cross section
        </text>
      </g>
    </svg>
  );
}
