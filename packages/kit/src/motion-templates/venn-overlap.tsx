import { duration, ease } from "@react-decks/motion";
import { useRef } from "react";
import { ink } from "../theme/theme";
import type { TemplateProps } from "./motion-template-props";
import { useTemplateMotion } from "./use-template-motion";
import styles from "./venn-overlap.module.css";

export function VennOverlap({
  sets,
  overlap,
  at = 0,
  accent = "cyan",
}: TemplateProps<"venn-overlap">) {
  if (!Number.isSafeInteger(at) || at < 0) throw new Error(`venn-overlap: invalid at ${at}`);
  if (sets.length !== 2 && sets.length !== 3)
    throw new Error(`venn-overlap: invalid sets ${JSON.stringify(sets)}`);
  sets.forEach((label, i) => {
    if (!label.trim()) throw new Error(`venn-overlap: invalid sets[${i}] ${JSON.stringify(label)}`);
  });
  if (!overlap.trim()) throw new Error(`venn-overlap: invalid overlap ${JSON.stringify(overlap)}`);

  const regions = useRef<HTMLDivElement>(null);
  const shared = useRef<HTMLHeadingElement>(null);
  const layout = (
    <div className={`od-body ${styles.diagram} ${sets.length === 3 ? styles.three : ""}`}>
      <div ref={regions} style={{ color: ink(accent, 3) }}>
        {Array.from(sets.entries(), ([i, label]) => (
          <div key={`${i}-${label}`} className={styles.region}>
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <circle
                cx="50"
                cy="50"
                r="49"
                fill="currentColor"
                fillOpacity={0.1 + i * 0.06}
                stroke="currentColor"
                strokeWidth="0.45"
              />
            </svg>
            <p className="od-body">{label}</p>
          </div>
        ))}
      </div>
      <h2 ref={shared} className={styles.shared}>
        {overlap}
      </h2>
    </div>
  );
  useTemplateMotion(at, (tl) => {
    if (!regions.current) return;
    // Show the separate sets before the circles carry their labels towards the centre.
    tl.fromTo(
      regions.current.children,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: duration.quick, ease: ease.enter },
    );
    const spread = sets.length === 3 ? 70 : 40;
    Array.from(regions.current.children).forEach((region, i) => {
      tl.fromTo(
        region,
        { xPercent: [-spread, spread, 0][i], yPercent: i === 2 ? 8 : 0 },
        { xPercent: 0, yPercent: 0, duration: duration.slow, ease: ease.enter },
        duration.quick,
      );
    });
    // Name the shared region as the outlines come to rest.
    tl.fromTo(
      shared.current,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: duration.base, ease: ease.enter },
      duration.slow,
    );
  });
  return layout;
}
