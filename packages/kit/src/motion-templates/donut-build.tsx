import { duration, ease, type gsap, useTween } from "@react-decks/motion";
import { useMemo, useRef } from "react";
import { ink, theme } from "../theme/theme";
import styles from "./donut-build.module.css";
import { numberFormat, useNumberLocale } from "./format-number";
import type { TemplateProps } from "./motion-template-props";
import { useTemplateMotion } from "./use-template-motion";

/** The gap left between two segments, as a percentage of the ring. */
const GAP = 0.8;

/**
 * A ring that builds one segment per click. The whole ring is the sum of the segments; each
 * click draws the next segment in the accent, returns the one before it to a neutral, and
 * counts the centre up to the running total.
 */
export function DonutBuild({
  segments,
  prefix = "",
  suffix = "",
  at = 0,
  accent = "cyan",
}: TemplateProps<"donut-build">) {
  if (!Number.isInteger(at) || at < 0)
    throw new Error(`donut-build at must be a nonnegative integer, got ${at}`);
  if (segments.length < 2 || segments.length > 5)
    throw new Error(
      `donut-build segments must have 2 to 5 segments, got ${JSON.stringify(segments)}`,
    );
  segments.forEach((segment, index) => {
    if (!segment.label.trim())
      throw new Error(
        `donut-build segments[${index}].label must contain text, got ${JSON.stringify(segment.label)}`,
      );
    if (segment.label.length > 16)
      throw new Error(
        `donut-build segments[${index}].label must be at most 16 characters, got ${JSON.stringify(segment.label)}`,
      );
    if (!Number.isFinite(segment.value) || segment.value <= 0)
      throw new Error(
        `donut-build segments[${index}].value must be a finite number above 0, got ${segment.value}`,
      );
  });
  const sums = segments.map((_, index) =>
    segments.slice(0, index + 1).reduce((sum, segment) => sum + segment.value, 0),
  );
  const whole = sums[sums.length - 1] ?? 0;
  const dial = useRef<HTMLDivElement>(null);
  const ring = useRef<SVGSVGElement>(null);
  const legend = useRef<HTMLOListElement>(null);
  // How far each segment has drawn, 0 to 1; the centre sums the drawn share of each value.
  const drawn = useTween(Object.fromEntries(segments.map((_, index) => [index, 0])));
  const locale = useNumberLocale();
  const formats = useMemo(
    () => segments.map((segment) => numberFormat(segment.value, locale)),
    [segments, locale],
  );
  // The centre shows every running total in one format: the one with the most decimals.
  const centre = useMemo(() => {
    return segments
      .map((_, index) =>
        numberFormat(
          segments.slice(0, index + 1).reduce((sum, segment) => sum + segment.value, 0),
          locale,
        ),
      )
      .reduce((best, next) =>
        (next.resolvedOptions().maximumFractionDigits ?? 0) >
        (best.resolvedOptions().maximumFractionDigits ?? 0)
          ? next
          : best,
      );
  }, [segments, locale]);
  const neutral = theme().text.muted;
  const lit = ink(accent, 3);
  const arcs = () => Array.from(ring.current?.querySelectorAll("circle") ?? []).slice(1);

  function reveal(index: number) {
    return (tl: gsap.core.Timeline) => {
      const start = tl.duration();
      const from = ((sums[index - 1] ?? 0) / whole) * 100;
      const to = Math.max(from, ((sums[index] ?? 0) / whole) * 100 - GAP);
      // An arc's sweep and the centre's number encode values, so both settle on snap.
      tl.fromTo(
        arcs()[index] ?? null,
        { drawSVG: `${from}% ${from}%` },
        { drawSVG: `${from}% ${to}%`, duration: duration.slow, ease: ease.snap },
        start,
      );
      tl.fromTo(
        drawn,
        { [index]: 0 },
        { [index]: 1, duration: duration.slow, ease: ease.snap },
        start,
      );
      tl.fromTo(
        legend.current?.children.item(index) ?? null,
        { autoAlpha: 0, x: "-0.4em" },
        { autoAlpha: 1, x: 0, duration: duration.base, ease: ease.snap },
        start + duration.quick,
      );
      // The newest segment holds the accent; the one before it steps back to the neutral.
      if (index > 0)
        tl.fromTo(
          arcs()[index - 1] ?? null,
          { stroke: lit },
          { stroke: neutral, immediateRender: false, duration: duration.base, ease: ease.snap },
          start,
        );
    };
  }

  useTemplateMotion(
    at,
    (tl) => {
      tl.fromTo(
        dial.current,
        { autoAlpha: 0, scale: 0.92 },
        { autoAlpha: 1, scale: 1, duration: duration.base, ease: ease.snap },
        0,
      );
      reveal(0)(tl);
    },
    segments.slice(1).map((_, index) => reveal(index + 1)),
  );

  return (
    <figure className={styles.figure}>
      <div className={styles.dial} ref={dial}>
        <svg ref={ring} viewBox="0 0 100 100" aria-hidden="true">
          <circle className={styles.track} cx="50" cy="50" r="40" />
          {segments.map((segment) => (
            <circle
              key={segment.label}
              className={styles.arc}
              cx="50"
              cy="50"
              r="40"
              style={{ stroke: lit }}
              transform="rotate(-90 50 50)"
            />
          ))}
        </svg>
        <h2>
          {
            // snap settles from a hair past 1, so each segment's share is held at its value.
            `${prefix}${centre.format(
              segments.reduce(
                (sum, segment, index) => sum + segment.value * Math.min(1, drawn[index] ?? 0),
                0,
              ),
            )}${suffix}`
          }
        </h2>
      </div>
      <ol className={`od-body ${styles.legend}`} ref={legend}>
        {segments.map((segment, index) => (
          <li key={segment.label}>
            <span>{segment.label}</span>
            <span className={styles.value}>
              {`${prefix}${formats[index]?.format(segment.value) ?? ""}${suffix}`}
            </span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
