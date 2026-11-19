import { useTemplateMotion } from "@steamfield/decks/kit";
import { duration, type gsap, stagger } from "@steamfield/decks/motion";
import { useRef } from "react";
import { slam, snap } from "./ease";
import styles from "./NameTicker.module.css";

const PER_ROW = 3;
// How far, in design pixels, the rows drift on when the band takes over.
const DRIFT = 64;
const SHOWN = "inset(0% 0% 0% 0%)";

/**
 * Rows of names slam in from alternate sides and bleed off both edges. Each click wipes a
 * band across the middle (the first) or rolls the band's line over to the next one.
 */
export function NameTicker({
  names,
  lines,
}: {
  names: readonly string[];
  lines: readonly string[];
}) {
  const root = useRef<HTMLDivElement>(null);
  const band = useRef<HTMLDivElement>(null);
  const rows = Array.from({ length: Math.ceil(names.length / PER_ROW) }, (_, row) =>
    names.slice(row * PER_ROW, (row + 1) * PER_ROW),
  );
  const rowEls = () => Array.from(root.current?.querySelectorAll(`.${styles.row}`) ?? []);
  const lineEls = () => Array.from(band.current?.querySelectorAll("p") ?? []);

  function step(index: number) {
    return (tl: gsap.core.Timeline) => {
      const start = tl.duration();
      const next = lineEls()[index];
      if (!next) return;
      if (index === 0) {
        // The rows give way: they dim and drift on as the band crosses the canvas.
        rowEls().forEach((row, i) => {
          tl.fromTo(
            row,
            { opacity: 1, x: 0 },
            {
              opacity: 0.22,
              x: i % 2 ? DRIFT : -DRIFT,
              immediateRender: false,
              duration: duration.slow,
              ease: snap,
            },
            start,
          );
        });
        tl.fromTo(
          band.current,
          { clipPath: "inset(0% 100% 0% 0%)" },
          { clipPath: SHOWN, duration: duration.slow, ease: slam },
          start,
        );
        tl.fromTo(
          next,
          { yPercent: 110 },
          { yPercent: 0, duration: duration.base, ease: snap },
          start + duration.base,
        );
        return;
      }
      tl.fromTo(
        lineEls()[index - 1] ?? null,
        { yPercent: 0 },
        { yPercent: -110, immediateRender: false, duration: duration.base, ease: snap },
        start,
      );
      tl.fromTo(
        next,
        { yPercent: 110 },
        { yPercent: 0, duration: duration.base, ease: snap },
        start + duration.quick / 2,
      );
    };
  }

  useTemplateMotion(
    0,
    (tl) => {
      rowEls().forEach((row, i) => {
        tl.fromTo(
          row,
          { xPercent: i % 2 ? 100 : -100 },
          { xPercent: 0, duration: duration.slow, ease: snap },
          (i * stagger) / 2,
        );
      });
    },
    lines.map((_, index) => step(index)),
  );

  return (
    <div className={styles.ticker} ref={root}>
      <ul className={styles.rows} aria-label={`${names.length} motion templates`}>
        {rows.map((row, i) => (
          <li key={row[0]} className={styles.lane} data-side={i % 2 ? "end" : "start"}>
            <div className={styles.row}>
              {row.map((name) => (
                <span key={name}>{name}</span>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <div className={styles.band} ref={band}>
        <div className={styles.lines}>
          {lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
