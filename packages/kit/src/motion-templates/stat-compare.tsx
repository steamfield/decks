import { duration, ease, useTween } from "@react-decks/motion";
import { useMemo, useRef } from "react";
import { ink } from "../theme/theme";
import { numberFormat, useNumberLocale } from "./format-number";
import type { TemplateProps } from "./motion-template-props";
import styles from "./stat-compare.module.css";
import { useTemplateMotion } from "./use-template-motion";

export function StatCompare({
  from,
  to,
  label,
  suffix = "",
  at = 0,
  accent = "cyan",
}: TemplateProps<"stat-compare">) {
  if (!Number.isInteger(at) || at < 0)
    throw new Error(`stat-compare at must be a nonnegative integer, got ${at}`);
  if (!label.trim())
    throw new Error(`stat-compare label must contain text, got ${JSON.stringify(label)}`);
  if (!Number.isFinite(from)) throw new Error(`stat-compare from must be finite, got ${from}`);
  if (!Number.isFinite(to)) throw new Error(`stat-compare to must be finite, got ${to}`);
  const figure = useRef<HTMLElement>(null);
  const arrow = useRef<SVGPolylineElement>(null);
  const tip = useRef<SVGPolylineElement>(null);
  const destination = useRef<HTMLHeadingElement>(null);
  const change = useRef<HTMLElement>(null);
  const count = useTween({ progress: 0 });
  const value = count.progress === 1 ? to : from + (to - from) * count.progress;
  const locale = useNumberLocale();
  const formatter = useMemo(() => numberFormat(to, locale), [to, locale]);
  const baseline = useMemo(() => numberFormat(from, locale).format(from), [from, locale]);
  const delta = to - from;
  const signed = useMemo(() => numberFormat(delta, locale, true).format(delta), [delta, locale]);
  const format = (n: number) => formatter.format(n) + suffix;
  const layout = (
    <figure className={styles.figure} ref={figure} style={{ color: ink(accent, 3) }}>
      <div className={styles.row}>
        <h2>
          {baseline}
          {suffix}
        </h2>
        <svg
          viewBox="0 0 100 50"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
        >
          <polyline ref={arrow} points="2,25 96,25" />
          <polyline ref={tip} points="75,4 96,25 75,46" />
        </svg>
        <h2 ref={destination} aria-label={format(to)}>
          <span aria-hidden="true">{format(value)}</span>
        </h2>
        <strong ref={change}>
          {signed}
          {suffix === "%" ? " pp" : suffix}
        </strong>
      </div>
      <figcaption className="od-body">{label}</figcaption>
    </figure>
  );
  useTemplateMotion(at, (tl) => {
    // Beat 1: read the starting value, follow the arrow, then see the signed difference.
    tl.fromTo(
      figure.current,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: duration.quick, ease: ease.snap },
      0,
    );
    tl.fromTo(
      arrow.current,
      { drawSVG: "0%" },
      { drawSVG: "100%", duration: duration.base, ease: ease.snap },
      duration.quick,
    );
    tl.fromTo(
      tip.current,
      { drawSVG: "0%" },
      { drawSVG: "100%", duration: duration.quick, ease: ease.snap },
      duration.base,
    );
    tl.fromTo(
      destination.current,
      { opacity: 0 },
      { opacity: 1, duration: duration.quick, ease: ease.snap },
      duration.base,
    );
    tl.fromTo(
      count,
      { progress: 0 },
      { progress: 1, duration: duration.slow, ease: ease.snap },
      duration.base,
    );
    tl.fromTo(
      change.current,
      { opacity: 0, yPercent: 40 },
      { opacity: 1, yPercent: 0, duration: duration.base, ease: ease.snap },
      duration.slow,
    );
  });
  return layout;
}
