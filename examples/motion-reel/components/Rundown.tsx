import { ink, useTemplateMotion } from "@steamfield/decks/kit";
import { duration, type gsap, ShapeMorph, SplitText, stagger } from "@steamfield/decks/motion";
import { useLayoutEffect, useRef } from "react";
import { punch, snap } from "./ease";
import styles from "./Rundown.module.css";

// One flat plate per item, on a 400-unit square: a slide, a grid of slides, a page, a file.
const PLATES = [
  "M20 95H380V305H20Z",
  "M20 95H190V190H20ZM210 95H380V190H210ZM20 210H190V305H20ZM210 210H380V305H210Z",
  "M95 20H305V380H95Z",
  "M95 20H245L305 80V380H95Z",
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
      const timing = { immediateRender: false, duration: duration.base, ease: snap };
      tl.fromTo(from, { opacity: 1, x: "0.5em" }, { opacity: DIM, x: 0, ...timing }, start);
      tl.fromTo(from.firstElementChild, { scaleX: 1 }, { scaleX: 0, ...timing }, start);
      tl.fromTo(to, { opacity: DIM, x: 0 }, { opacity: 1, x: "0.5em", ...timing }, start);
      tl.fromTo(to.firstElementChild, { scaleX: 0 }, { scaleX: 1, ...timing }, start);
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
        { yPercent: 115 },
        { yPercent: 0, duration: duration.base, ease: snap, stagger },
        0,
      );
      tl.fromTo(
        root.current?.querySelectorAll(`.${styles.label}`) ?? [],
        { yPercent: 115 },
        { yPercent: 0, duration: duration.slow, ease: snap, stagger },
        0,
      );
      tl.fromTo(
        plate.current,
        { scale: 0 },
        { scale: 1, duration: duration.slow, ease: punch },
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
        <ol className={styles.items}>
          {items.map((item) => (
            <li key={item}>
              <span className={styles.marker} aria-hidden="true" />
              <span className={styles.mask}>
                <span className={styles.label}>{item}</span>
              </span>
            </li>
          ))}
        </ol>
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
