import { ink, useTemplateMotion } from "@steamfield/decks/kit";
import { duration, type gsap, SplitText, stagger } from "@steamfield/decks/motion";
import { useLayoutEffect, useRef } from "react";
import { CLEAR, LEAN, punch, slam, snap } from "./ease";
import styles from "./LogoSting.module.css";

// The Decks mark on its 32-unit square (site/src/lib/brand.ts): two slides on the diagonal,
// cyan in front of violet. Here the back slide is whole and the front one carries its own gap,
// so the back can travel out from underneath.
const FRONT = "M5 12.75H20a3 3 0 0 1 3 3V24.25a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V15.75a3 3 0 0 1 3-3Z";
const DOT =
  "M12.5 16.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5a3.5 3.5 0 0 1-3.5-3.5a3.5 3.5 0 0 1 3.5-3.5Z";
const BACK = "M12 4.75H27a3 3 0 0 1 3 3v8.5a3 3 0 0 1-3 3H12a3 3 0 0 1-3-3v-8.5a3 3 0 0 1 3-3Z";
const GAP =
  "M5 11.25H20a4.5 4.5 0 0 1 4.5 4.5V24.25a4.5 4.5 0 0 1-4.5 4.5H5a4.5 4.5 0 0 1-4.5-4.5V15.75a4.5 4.5 0 0 1 4.5-4.5Z";

/**
 * The logo sting, in one overlapping move: a dot lands and is already opening into the front
 * slide as the back slide kicks out from behind it and the wordmark rises a letter at a time. With a `tagline`, the next click
 * draws a rule under the wordmark and brings the line up through a mask.
 */
export function LogoSting({ tagline, compact = false }: { tagline?: string; compact?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const front = useRef<SVGPathElement>(null);
  const back = useRef<SVGPathElement>(null);
  const wordmark = useRef<HTMLHeadingElement>(null);
  const rule = useRef<SVGLineElement>(null);
  const line = useRef<HTMLParagraphElement>(null);
  const letters = useRef<SplitText | null>(null);
  const words = useRef<SplitText | null>(null);
  useLayoutEffect(() => {
    if (!wordmark.current) return;
    const chars = SplitText.create(wordmark.current, { type: "chars", mask: "chars", tag: "span" });
    const parts = line.current
      ? SplitText.create(line.current, { type: "words", mask: "words", tag: "span" })
      : null;
    letters.current = chars;
    words.current = parts;
    return () => {
      chars.revert();
      parts?.revert();
      letters.current = null;
      words.current = null;
    };
  }, []);

  const reveal = (tl: gsap.core.Timeline) => {
    const start = tl.duration();
    tl.fromTo(
      rule.current,
      { drawSVG: "0%" },
      { drawSVG: "100%", duration: duration.slow, ease: slam },
      start,
    );
    // The line comes up while the rule is still drawing over it.
    tl.fromTo(
      words.current?.words ?? [],
      { yPercent: CLEAR, skewY: LEAN },
      { yPercent: 0, skewY: 0, duration: duration.slow, ease: snap, stagger: stagger / 2 },
      start + duration.quick / 2,
    );
  };

  useTemplateMotion(
    0,
    (tl) => {
      tl.fromTo(
        front.current,
        { scale: 0, transformOrigin: "50% 50%" },
        { scale: 1, duration: duration.base, ease: punch },
        0,
      );
      tl.fromTo(
        front.current,
        { morphSVG: DOT },
        { morphSVG: FRONT, duration: duration.base, ease: snap },
        duration.quick,
      );
      // The back slide waits exactly under the front one, then kicks out to its offset.
      tl.fromTo(
        back.current,
        { x: -7, y: 8 },
        { x: 0, y: 0, duration: duration.slow, ease: punch },
        duration.base,
      );
      tl.fromTo(
        wordmark.current,
        { letterSpacing: "0.08em" },
        { letterSpacing: "-0.06em", duration: duration.slow, ease: snap },
        duration.quick,
      );
      // The letters start while the mark is still opening, each leaning in and settling upright.
      tl.fromTo(
        letters.current?.chars ?? [],
        { yPercent: CLEAR, skewY: LEAN },
        { yPercent: 0, skewY: 0, duration: duration.slow, ease: snap, stagger },
        duration.quick,
      );
    },
    tagline ? [reveal] : [],
  );

  return (
    <div className={compact ? `${styles.sting} ${styles.compact}` : styles.sting} ref={root}>
      <div className={styles.lockup}>
        <svg className={styles.mark} viewBox="0 0 32 32" aria-hidden="true">
          <path ref={back} d={BACK} fill={ink("violet", 2)} />
          <path d={GAP} className={styles.gap} />
          <path ref={front} d={FRONT} fill={ink("cyan", 3)} />
        </svg>
        <h1 className={styles.wordmark} ref={wordmark}>
          Decks
        </h1>
      </div>
      {tagline && (
        <>
          <svg
            className={styles.rule}
            viewBox="0 0 100 2"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <line ref={rule} x1="0" y1="1" x2="100" y2="1" />
          </svg>
          <p className={styles.tagline} ref={line}>
            {tagline}
          </p>
        </>
      )}
    </div>
  );
}
