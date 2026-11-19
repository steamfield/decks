import { TRACE } from "@steamfield/decks/kit";
import { duration, ease, SplitText, stagger, useTimeline } from "@steamfield/decks/motion";
import { useRef } from "react";
import { Block, Fish } from "./Fish";
import styles from "./LiftProof.module.css";

const closed = "M620 35 Q363 29 202 -4 L230 253 Q378 311 620 315 Z";
const edge = "M620 35 Q600 16 603 5 L606 279 Q610 300 620 315 Z";
const open = "M620 35 Q921 32 1220 37 L1218 316 Q918 311 620 315 Z";

export function LiftProof() {
  const sheet = useRef<SVGPathElement>(null);
  const print = useRef<SVGGElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  useTimeline((tl, beat) => {
    beat(0);
    if (!sheet.current || !print.current || !label.current) return;
    const words = SplitText.create(label.current, { type: "words", mask: "words", tag: "span" });
    tl.fromTo(
      sheet.current,
      { morphSVG: closed },
      { morphSVG: edge, duration: duration.base, ease: ease.exit },
    );
    tl.to(sheet.current, { morphSVG: open, duration: duration.slow, ease: TRACE });
    tl.fromTo(
      print.current,
      { scaleX: 0, svgOrigin: "620 35" },
      { scaleX: 1, duration: duration.slow, ease: TRACE },
      "<",
    );
    tl.fromTo(
      words.words,
      { yPercent: 110 },
      { yPercent: 0, duration: duration.base, ease: ease.enter, stagger },
      "<",
    );
    beat(1);
    return () => words.revert();
  });
  return (
    <div className={styles.table}>
      <svg
        viewBox="0 -10 1240 360"
        role="img"
        aria-label="The sheet lifts from the left-facing block. The printed fish faces right."
      >
        <g transform="translate(17 36)">
          <Block>
            <Fish cut="var(--od-recess)" />
          </Block>
        </g>
        <path
          ref={sheet}
          d={closed}
          fill="var(--od-paper)"
          stroke="var(--od-bench)"
          strokeWidth="2"
        />
        <g ref={print}>
          <g transform="translate(1230 36) scale(-1 1)">
            <Fish />
          </g>
        </g>
      </svg>
      <div className={styles.labels}>
        <span>Block</span>
        <span ref={label}>Pulled print</span>
      </div>
    </div>
  );
}
