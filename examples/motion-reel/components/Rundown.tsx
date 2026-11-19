import { ink, useTemplateMotion } from "@steamfield/decks/kit";
import {
  duration,
  ease,
  type gsap,
  rise,
  ShapeMorph,
  SplitText,
  stagger,
} from "@steamfield/decks/motion";
import { useLayoutEffect, useRef } from "react";
import styles from "./Rundown.module.css";

// One flat plate per item, on a 400-unit square: a slide, a grid of slides, a page, a file.
const PLATES = [
  "M20 95H380V305H20Z",
  "M20 95H190V190H20ZM210 95H380V190H210ZM20 210H190V305H20ZM210 210H380V305H210Z",
  "M80 40H260L320 40V360H80Z",
  "M80 40H260L320 100V360H80Z",
];
const FILLS = [ink("cyan", 3), ink("violet", 2), ink("amber", 3), ink("slate", 4)];
const DIM = 0.26;

/**
 * A broadcast rundown: every item is on screen, one is live. Each click moves the marker to
 * the next item while the plate beside the list morphs into its shape.
 */
export function Rundown({ lead, items }: { lead: string; items: readonly string[] }) {
  const root = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLParagraphElement>(null);
  const plate = useRef<SVGSVGElement>(null);
  const marker = useRef<HTMLSpanElement>(null);
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
  const rows = () => Array.from(root.current?.querySelectorAll("li") ?? []);

  function advance(index: number) {
    return (tl: gsap.core.Timeline) => {
      const from = rows()[index];
      const to = rows()[index + 1];
      if (!from || !to) return;
      const start = tl.duration();
      // Rows rest in the pose the stylesheet gives them, so no tween here may render early.
      const timing = { immediateRender: false, duration: duration.base, ease: ease.snap };
      // One marker travels down the list; the row it leaves falls back as the next steps out.
      tl.fromTo(
        marker.current,
        { yPercent: index * 100 },
        { yPercent: (index + 1) * 100, ...timing, duration: duration.slow, ease: ease.punch },
        start,
      );
      tl.fromTo(
        from,
        { opacity: 1, x: "0.5em" },
        { opacity: DIM, x: 0, ...timing, ease: ease.leave },
        start,
      );
      tl.fromTo(
        to,
        { opacity: DIM, x: 0 },
        { opacity: 1, x: "0.5em", ...timing, duration: duration.slow, ease: ease.punch },
        start + duration.quick / 2,
      );
      // The plate dips as it starts to change shape and comes back up as the morph lands.
      tl.fromTo(
        plate.current,
        { scale: 1 },
        { scale: 0.9, ...timing, duration: duration.quick, ease: ease.leave },
        start,
      );
      tl.fromTo(
        plate.current,
        { scale: 0.9 },
        { scale: 1, ...timing, duration: duration.slow, ease: ease.punch },
        start + duration.quick,
      );
      tl.fromTo(
        plate.current,
        { fill: FILLS[index % FILLS.length] },
        { fill: FILLS[(index + 1) % FILLS.length], ...timing, duration: duration.slow },
        start,
      );
    };
  }

  useTemplateMotion(
    0,
    (tl) => {
      tl.fromTo(
        split.current?.words ?? [],
        { yPercent: rise.clear },
        { yPercent: 0, duration: duration.base, ease: ease.snap, stagger },
        0,
      );
      tl.fromTo(
        root.current?.querySelectorAll(`.${styles.label}`) ?? [],
        { yPercent: rise.clear, skewY: rise.lean },
        { yPercent: 0, skewY: 0, duration: duration.slow, ease: ease.snap, stagger },
        0,
      );
      tl.fromTo(
        marker.current,
        { scaleX: 0 },
        { scaleX: 1, duration: duration.base, ease: ease.punch },
        duration.base,
      );
      tl.fromTo(
        plate.current,
        { scale: 0 },
        { scale: 1, duration: duration.slow, ease: ease.punch },
        duration.quick,
      );
    },
    items.slice(1).map((_, index) => advance(index)),
  );

  return (
    <div className={styles.rundown} ref={root}>
      <div>
        <p className={styles.lead} ref={heading}>
          {lead}
        </p>
        <div className={styles.items}>
          <span className={styles.marker} ref={marker} aria-hidden="true" />
          <ol>
            {items.map((item) => (
              <li key={item}>
                <span className={styles.mask}>
                  <span className={styles.label}>{item}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <svg
        className={styles.plate}
        ref={plate}
        viewBox="0 0 400 400"
        aria-hidden="true"
        style={{ fill: FILLS[0] }}
      >
        <ShapeMorph at={1} paths={PLATES} />
      </svg>
    </div>
  );
}
