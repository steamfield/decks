import { duration, ease, rise, stagger, useTween } from "@react-decks/motion";
import { useSlide } from "@react-decks/runtime";
import { useMemo, useRef } from "react";
import { ink, theme } from "../theme/theme";
import styles from "./bar-board.module.css";
import { numberFormat, useNumberLocale } from "./format-number";
import type { TemplateProps } from "./motion-template-props";
import { useTemplateMotion } from "./use-template-motion";

/**
 * The tick step: the smallest of 1, 2, 2.5 and 5 (times a power of ten) giving at most 5 steps,
 * and the fraction digits its multiples need, so a step of 0.025 labels 0.075 and not 0.08.
 */
function tickStep(top: number) {
  const rough = top / 5;
  const exponent = Math.floor(Math.log10(rough));
  const multiple = [1, 2, 2.5, 5, 10].find((each) => each * 10 ** exponent >= rough) ?? 10;
  const digits = -exponent + (multiple === 2.5 ? 1 : 0) - (multiple === 10 ? 1 : 0);
  return { step: multiple * 10 ** exponent, digits: Math.max(0, digits) };
}

/**
 * A ranked board. Click 1 wipes it across and grows the bars one after another, each starting
 * before the last has landed, with its value counting beside it. Click 2 turns the leading bar
 * (every bar tied for the lead) to the accent and dims the rest. Bars are lengths on an axis from
 * zero to the tick above the longest, so the picture and the numbers cannot disagree.
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
  if (source.length > 60)
    throw new Error(
      `bar-board source must be at most 60 characters, got ${JSON.stringify(source)}`,
    );
  for (const [prop, affix] of [
    ["prefix", prefix],
    ["suffix", suffix],
  ] as const)
    if (affix.length > 8)
      throw new Error(
        `bar-board ${prop} must be at most 8 characters, got ${JSON.stringify(affix)}`,
      );
  const top = rows[0]?.value ?? 0;
  if (top === 0)
    throw new Error(
      `bar-board rows need a largest value above 0, got rows[0] ${JSON.stringify(rows[0])}`,
    );
  // Every row tied for the lead shares the accent; rows are sorted, so they come first.
  const leaders = rows.filter((row) => row.value === top).length;
  const { step, digits } = tickStep(top);
  const ceiling = Math.ceil(top / step - 1e-9) * step;
  const ticks = Array.from({ length: Math.round(ceiling / step) + 1 }, (_, index) => index * step);
  const board = useRef<HTMLDivElement>(null);
  const credit = useRef<HTMLParagraphElement>(null);
  const counts = useTween(Object.fromEntries(rows.map((_, index) => [index, 0])));
  const { clicks } = useSlide();
  const locale = useNumberLocale();
  const formats = useMemo(() => rows.map((row) => numberFormat(row.value, locale)), [rows, locale]);
  const axisFormat = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: digits }),
    [digits, locale],
  );
  const format = (index: number, value: number) =>
    `${prefix}${formats[index]?.format(value) ?? ""}${suffix}`;
  // The value column is as wide as the longest finished value, so a full-length bar's value
  // stays on the board.
  const widest = rows
    .map((row, index) => format(index, row.value))
    .reduce((longest, next) => (next.length > longest.length ? next : longest));
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
        // Beat 2: the leaders' bars and values take the accent, and every other row steps back.
        const timing = { immediateRender: false, duration: duration.base, ease: ease.snap };
        tl.fromTo(
          parts(styles.bar).slice(0, leaders),
          { backgroundColor: plain },
          { backgroundColor: ink(accent, 3), ...timing },
          start,
        );
        tl.fromTo(
          parts(styles.value).slice(0, leaders),
          { color: theme().text.primary },
          { color: ink(accent, 3), ...timing },
          start,
        );
        tl.fromTo(
          parts(styles.row).slice(leaders),
          { opacity: 1 },
          { opacity: 0.4, ...timing, stagger: stagger / 2 },
          start,
        );
      },
    ],
  );

  return (
    <figure className={styles.figure}>
      <div className={styles.board} ref={board} style={{ borderLeftColor: ink(accent, 3) }}>
        <ul className={styles.rows}>
          {Array.from(rows.entries(), ([index, row]) => (
            <li
              // Two rows may share a label; the index keeps their keys apart.
              key={`${index}-${row.label}`}
              className={styles.row}
              aria-label={`${row.label}: ${format(index, row.value)}`}
              aria-current={index < leaders && clicks > at ? "true" : undefined}
            >
              <span className={styles.label} aria-hidden="true">
                {row.label}
              </span>
              <span className={styles.track} aria-hidden="true">
                <span className={styles.bar} style={{ backgroundColor: plain }} />
                <span className={styles.value}>{format(index, counts[index] ?? 0)}</span>
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
        <span className={styles.reserve} aria-hidden="true" data-value={widest} />
      </div>
      <figcaption className={styles.source}>
        <p ref={credit}>{source}</p>
      </figcaption>
    </figure>
  );
}
