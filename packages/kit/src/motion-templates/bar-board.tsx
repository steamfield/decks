import { duration, ease, rise, stagger, useTween } from "@react-decks/motion";
import { useMemo, useRef } from "react";
import { ink, theme } from "../theme/theme";
import styles from "./bar-board.module.css";
import { numberFormat, useNumberLocale } from "./format-number";
import type { TemplateProps } from "./motion-template-props";
import { useTemplateMotion } from "./use-template-motion";

/** The tick step: the smallest of 1, 2, 2.5 and 5 (times a power of ten) giving at most 5 steps. */
function tickStep(top: number) {
  const rough = top / 5;
  const power = 10 ** Math.floor(Math.log10(rough));
  return [1, 2, 2.5, 5, 10].map((multiple) => multiple * power).find((step) => step >= rough) ?? 0;
}

/**
 * A ranked board. Click 1 wipes it across and grows the bars one after another, each starting
 * before the last has landed, with its value counting beside it. Click 2 turns the leading bar
 * to the accent and dims the rest. Bars are lengths on an axis from zero to the tick above the
 * longest, so the picture and the numbers cannot disagree.
 */
export function BarBoard({
  rows,
  source,
  prefix = "",
  suffix = "",
  at = 0,
  accent = "cyan",
}: TemplateProps<"bar-board">) {
  if (!Number.isInteger(at) || at < 0)
    throw new Error(`bar-board at must be a nonnegative integer, got ${at}`);
  if (rows.length < 2 || rows.length > 6)
    throw new Error(`bar-board rows must have 2 to 6 rows, got ${JSON.stringify(rows)}`);
  rows.forEach((row, index) => {
    if (!row.label.trim())
      throw new Error(
        `bar-board rows[${index}].label must contain text, got ${JSON.stringify(row.label)}`,
      );
    if (row.label.length > 16)
      throw new Error(
        `bar-board rows[${index}].label must be at most 16 characters, got ${JSON.stringify(row.label)}`,
      );
    if (!Number.isFinite(row.value) || row.value < 0)
      throw new Error(
        `bar-board rows[${index}].value must be a finite number of at least 0, got ${row.value}`,
      );
    const above = rows[index - 1];
    if (above && row.value > above.value)
      throw new Error(
        `bar-board rows must be sorted largest first: rows[${index}] ${JSON.stringify(row.label)} (${row.value}) is larger than ${JSON.stringify(above.label)} (${above.value})`,
      );
  });
  if (!source.trim())
    throw new Error(`bar-board source must contain text, got ${JSON.stringify(source)}`);
  const top = rows[0]?.value ?? 0;
  if (top === 0) throw new Error("bar-board rows need a value above 0");
  const step = tickStep(top);
  const ceiling = Math.ceil(top / step - 1e-9) * step;
  const ticks = Array.from({ length: Math.round(ceiling / step) + 1 }, (_, index) => index * step);
  const board = useRef<HTMLDivElement>(null);
  const credit = useRef<HTMLParagraphElement>(null);
  const counts = useTween(Object.fromEntries(rows.map((_, index) => [index, 0])));
  const locale = useNumberLocale();
  const formats = useMemo(() => rows.map((row) => numberFormat(row.value, locale)), [rows, locale]);
  const axisFormat = useMemo(() => numberFormat(step, locale), [step, locale]);
  const format = (index: number, value: number) =>
    `${prefix}${formats[index]?.format(value) ?? ""}${suffix}`;
  const plain = theme().text.muted;
  const parts = (name: string | undefined) =>
    Array.from(board.current?.querySelectorAll(`.${name}`) ?? []);

  useTemplateMotion(
    at,
    (tl) => {
      tl.fromTo(
        board.current,
        { clipPath: "inset(0% 100% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: duration.base, ease: ease.slam },
        0,
      );
      tl.fromTo(
        credit.current,
        { yPercent: rise.clear },
        { yPercent: 0, duration: duration.slow, ease: ease.snap },
        duration.quick,
      );
      // The first bar starts once the wipe has uncovered the board, so nothing grows behind its
      // edge; the rest follow, overlapping, within one total spread so six rows land as fast as
      // two. Bars and counters encode values, so they settle on snap and never overshoot.
      const spread = Math.min(duration.base, stagger * 3 * (rows.length - 1));
      const bars = parts(styles.bar);
      const values = parts(styles.value);
      rows.forEach((row, index) => {
        const start = duration.base + (spread * index) / (rows.length - 1);
        tl.fromTo(
          bars[index] ?? null,
          { width: "0%" },
          { width: `${(row.value / ceiling) * 100}%`, duration: duration.slow, ease: ease.snap },
          start,
        );
        tl.fromTo(
          counts,
          { [index]: 0 },
          { [index]: row.value, duration: duration.slow, ease: ease.snap },
          start,
        );
        tl.fromTo(
          values[index] ?? null,
          { opacity: 0 },
          { opacity: 1, duration: duration.quick, ease: ease.snap },
          start,
        );
      });
    },
    [
      (tl) => {
        const start = tl.duration();
        // Beat 2: the leader takes the accent, and every other row steps back.
        const timing = { immediateRender: false, duration: duration.base, ease: ease.snap };
        const rowsOnBoard = parts(styles.row);
        tl.fromTo(
          parts(styles.bar)[0] ?? null,
          { backgroundColor: plain },
          { backgroundColor: ink(accent, 3), ...timing },
          start,
        );
        tl.fromTo(
          rowsOnBoard.slice(1),
          { opacity: 1 },
          { opacity: 0.4, ...timing, stagger: stagger / 2 },
          start,
        );
      },
    ],
  );

  return (
    <figure className={styles.figure}>
      <div className={styles.board} ref={board}>
        <ul className={styles.rows}>
          {rows.map((row, index) => (
            <li
              key={row.label}
              className={styles.row}
              aria-label={`${row.label}: ${format(index, row.value)}`}
            >
              <span className={styles.label} aria-hidden="true">
                {row.label}
              </span>
              <span className={styles.track} aria-hidden="true">
                <span className={styles.bar} style={{ backgroundColor: plain }} />
                <span className={styles.value}>
                  {
                    // snap settles from a hair past 1, so the count is held at its value.
                    format(index, Math.min(row.value, counts[index] ?? 0))
                  }
                </span>
              </span>
            </li>
          ))}
        </ul>
        <div className={styles.axis} aria-hidden="true">
          {ticks.map((tick) => (
            <span key={tick} style={{ left: `${(tick / ceiling) * 100}%` }}>
              {axisFormat.format(tick)}
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
