import { duration, ease, stagger, useTween } from "@react-decks/motion";
import { useMemo, useRef } from "react";
import { ink } from "../theme/theme";
import { numberFormat, useNumberLocale } from "./format-number";
import styles from "./metric-grid.module.css";
import type { TemplateProps } from "./motion-template-props";
import { useTemplateMotion } from "./use-template-motion";

export function MetricGrid({ metrics, at = 0, accent = "cyan" }: TemplateProps<"metric-grid">) {
  if (!Number.isInteger(at) || at < 0)
    throw new Error(`metric-grid at must be a nonnegative integer, got ${at}`);
  if (metrics.length < 2 || metrics.length > 4)
    throw new Error(`metric-grid metrics must contain 2 to 4 tiles, got ${metrics.length}`);
  for (const [index, { value, label }] of metrics.entries()) {
    if (!Number.isFinite(value))
      throw new Error(`metric-grid metrics[${index}].value must be finite, got ${value}`);
    if (!label.trim())
      throw new Error(
        `metric-grid metrics[${index}].label must contain text, got ${JSON.stringify(label)}`,
      );
  }
  const figure = useRef<HTMLElement>(null);
  const tiles = useRef<(HTMLDivElement | null)[]>([]);
  const counts = useTween(Object.fromEntries(metrics.map((_, index) => [index, 0])));
  const locale = useNumberLocale();
  const formatted = useMemo(
    () => metrics.map((metric) => ({ ...metric, formatter: numberFormat(metric.value, locale) })),
    [metrics, locale],
  );
  const layout = (
    <figure className={styles.figure} ref={figure} style={{ color: ink(accent, 3) }}>
      {formatted.map(({ value, suffix = "", label, formatter }, index) => (
        <div
          key={JSON.stringify([
            label,
            metrics.slice(0, index).filter((metric) => metric.label === label).length,
          ])}
          ref={(el) => {
            tiles.current[index] = el;
          }}
          className={styles.tile}
        >
          <h2 aria-label={formatter.format(value) + suffix}>
            <span aria-hidden="true">
              {formatter.format(value * (counts[index] ?? 0)) + suffix}
            </span>
          </h2>
          <p className="od-body">{label}</p>
        </div>
      ))}
    </figure>
  );
  useTemplateMotion(at, (tl) => {
    // Beat 1: tiles lift in reading order. Each count starts as its tile rises.
    tl.fromTo(
      figure.current,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: duration.quick, ease: ease.enter },
      0,
    );
    tiles.current.forEach((tile, index) => {
      if (!tile) return;
      const start = index * stagger;
      tl.fromTo(
        tile,
        { yPercent: 18, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: duration.base, ease: ease.enter },
        start,
      );
      tl.fromTo(
        counts,
        { [index]: 0 },
        { [index]: 1, duration: duration.slow, ease: ease.enter },
        start,
      );
    });
  });
  return layout;
}
