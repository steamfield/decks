import { duration, ease, useTween } from "@react-decks/motion";
import { useMemo, useRef } from "react";
import { ink } from "../theme/theme";
import { numberFormat, useNumberLocale } from "./format-number";
import type { TemplateProps } from "./motion-template-props";
import styles from "./stat-burst.module.css";
import { useTemplateMotion } from "./use-template-motion";

export function StatBurst({
  value,
  label,
  suffix = "",
  at = 0,
  accent = "cyan",
}: TemplateProps<"stat-burst">) {
  if (!Number.isInteger(at) || at < 0)
    throw new Error(`stat-burst at must be a nonnegative integer, got ${at}`);
  if (!label.trim())
    throw new Error(`stat-burst label must contain text, got ${JSON.stringify(label)}`);
  if (!Number.isFinite(value)) throw new Error(`stat-burst value must be finite, got ${value}`);
  const figure = useRef<HTMLElement>(null);
  const ring = useRef<SVGCircleElement>(null);
  const caption = useRef<HTMLElement>(null);
  const count = useTween({ progress: 0 });
  const locale = useNumberLocale();
  const formatter = useMemo(() => numberFormat(value, locale), [value, locale]);
  const format = (n: number) => formatter.format(n) + suffix;
  const layout = (
    <figure className={styles.figure} ref={figure} style={{ color: ink(accent, 3) }}>
      <div className={styles.dial}>
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle
            ref={ring}
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <h2 aria-label={format(value)}>
          <span aria-hidden="true">{format(count.progress * value)}</span>
        </h2>
      </div>
      <figcaption className="od-body" ref={caption}>
        {label}
      </figcaption>
    </figure>
  );
  useTemplateMotion(at, (tl) => {
    // Beat 1: the ring traces the count. The label lifts into place as the number lands.
    tl.fromTo(
      figure.current,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: duration.quick, ease: ease.snap },
      0,
    );
    tl.fromTo(count, { progress: 0 }, { progress: 1, duration: duration.slow, ease: ease.snap }, 0);
    tl.fromTo(
      ring.current,
      { drawSVG: "0%" },
      { drawSVG: "100%", duration: duration.slow, ease: ease.snap },
      0,
    );
    tl.fromTo(
      caption.current,
      { opacity: 0, yPercent: 40 },
      { opacity: 1, yPercent: 0, duration: duration.base, ease: ease.snap },
      duration.slow - duration.quick,
    );
  });
  return layout;
}
