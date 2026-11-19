import { useTemplateMotion } from "@steamfield/decks/kit";
import { duration, SplitText, stagger } from "@steamfield/decks/motion";
import { useLayoutEffect, useRef } from "react";
import { CLEAR, LEAN, snap } from "./ease";
import styles from "./RiseLine.module.css";

/**
 * A headline whose words rise through their own masks as the slide arrives. Each word comes up
 * leaning and settles upright while the line's tracking closes, so the sentence lands as one
 * gesture.
 */
export function RiseLine({ children }: { children: string }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const split = useRef<SplitText | null>(null);
  useLayoutEffect(() => {
    if (!heading.current) return;
    const words = SplitText.create(heading.current, { type: "words", mask: "words", tag: "span" });
    split.current = words;
    return () => {
      words.revert();
      split.current = null;
    };
  }, []);
  useTemplateMotion(0, (tl) => {
    tl.fromTo(
      heading.current,
      { letterSpacing: "-0.02em" },
      { letterSpacing: "-0.055em", duration: duration.slow, ease: snap },
      0,
    );
    tl.fromTo(
      split.current?.words ?? [],
      { yPercent: CLEAR, skewY: LEAN },
      { yPercent: 0, skewY: 0, duration: duration.slow, ease: snap, stagger: stagger / 2 },
      0,
    );
  });
  return (
    <h2 className={styles.line} ref={heading}>
      {children}
    </h2>
  );
}
