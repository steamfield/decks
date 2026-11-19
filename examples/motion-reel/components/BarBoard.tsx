import { ink, theme, useTemplateMotion } from "@steamfield/decks/kit";
import { duration, stagger, useTween } from "@steamfield/decks/motion";
import { useRef } from "react";
import styles from "./BarBoard.module.css";
import { CLEAR, punch, slam, snap } from "./ease";

const TICK_EVERY = 5;

/**
 * A ranked bar chart drawn by the reel itself, so every bar keeps the reel's timing. Click 1
 * wipes the board across and grows the bars one after another, each starting before the last
 * has landed and running a little past its length before settling, with its value counting up
 * beside it. Click 2 turns the leading bar to the signal colour and dims the rest.
 *
 * Bars are lengths on a shared axis that starts at zero; a bar's width is its value over the
 * axis ceiling, so the picture and the numbers cannot disagree.
 */
export function BarBoard({
  rows,
  source,
}: {
  rows: readonly { group: string; templates: number }[];
  source: string;
}) {
  const board = useRef<HTMLDivElement>(null);
  const credit = useRef<HTMLParagraphElement>(null);
  const counts = useTween(Object.fromEntries(rows.map((_, index) => [index, 0])));
  const top = Math.max(...rows.map((row) => row.templates));
  // The ceiling is the next tick above the longest bar, with room for its value beside it.
  const ceiling = (Math.floor(top / TICK_EVERY) + 1) * TICK_EVERY;
  const ticks = Array.from({ length: ceiling / TICK_EVERY + 1 }, (_, index) => index * TICK_EVERY);
  const plain = theme().text.primary;
  const lead = ink("amber", 3);
  const rest = ink("slate", 1);
  const bars = () => Array.from(board.current?.querySelectorAll(`.${styles.bar}`) ?? []);
  const values = () => Array.from(board.current?.querySelectorAll(`.${styles.value}`) ?? []);

  useTemplateMotion(
    1,
    (tl) => {
      tl.fromTo(
        board.current,
        { clipPath: "inset(0% 100% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: duration.slow, ease: slam },
        0,
      );
      tl.fromTo(
        credit.current,
        { yPercent: CLEAR },
        { yPercent: 0, duration: duration.slow, ease: snap },
        duration.quick,
      );
      rows.forEach((row, index) => {
        // The first bar waits for the wipe to uncover it; each next one starts three staggers
        // later, before the one above has settled: in sequence, but overlapping.
        const at = duration.base + index * stagger * 3;
        tl.fromTo(
          bars()[index] ?? null,
          { width: "0%" },
          { width: `${(row.templates / ceiling) * 100}%`, duration: duration.slow, ease: punch },
          at,
        );
        tl.fromTo(
          counts,
          { [index]: 0 },
          { [index]: row.templates, duration: duration.slow, ease: snap },
          at,
        );
        tl.fromTo(
          values()[index] ?? null,
          { opacity: 0, yPercent: 40 },
          { opacity: 1, yPercent: 0, duration: duration.base, ease: snap },
          at,
        );
      });
    },
    [
      (tl) => {
        const start = tl.duration();
        rows.forEach((_, index) => {
          const tone = index === 0 ? lead : rest;
          const timing = { immediateRender: false, duration: duration.base, ease: snap };
          tl.fromTo(
            bars()[index] ?? null,
            { backgroundColor: plain },
            { backgroundColor: tone, ...timing },
            start + index * stagger,
          );
          tl.fromTo(
            values()[index] ?? null,
            { color: plain },
            { color: tone, ...timing },
            start + index * stagger,
          );
        });
        // The finding gets the accent: its value steps up once and settles.
        tl.fromTo(
          values()[0] ?? null,
          { scale: 1 },
          { scale: 1.25, immediateRender: false, duration: duration.slow, ease: punch },
          start,
        );
      },
    ],
  );

  return (
    <figure className={styles.figure}>
      <div className={styles.board} ref={board}>
        <ul className={styles.rows} style={{ color: plain }}>
          {rows.map((row, index) => (
            <li key={row.group} aria-label={`${row.group}: ${row.templates}`}>
              <span className={styles.group} aria-hidden="true">
                {row.group}
              </span>
              <span className={styles.track} aria-hidden="true">
                <span className={styles.bar} style={{ backgroundColor: plain }} />
                <span className={styles.value}>{Math.round(counts[index] ?? 0)}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className={styles.axis} aria-hidden="true">
          {ticks.map((tick) => (
            <span key={tick} style={{ left: `${(tick / ceiling) * 100}%` }}>
              {tick}
            </span>
          ))}
        </div>
      </div>
      <figcaption className={styles.source}>
        <p ref={credit}>{source}</p>
      </figcaption>
    </figure>
  );
}
