import { duration, ease, type gsap, stagger } from "@react-decks/motion";
import { useRef } from "react";
import { ink } from "../theme/theme";
import styles from "./comparison-split.module.css";
import type { TemplateProps } from "./motion-template-props";
import { useTemplateMotion } from "./use-template-motion";

export function ComparisonSplit({
  left,
  right,
  at = 0,
  accent = "cyan",
}: TemplateProps<"comparison-split">) {
  if (!Number.isSafeInteger(at) || at < 0)
    throw new Error(`comparison-split: at must be a non-negative whole number, got ${at}`);
  for (const [name, side] of [
    ["left", left],
    ["right", right],
  ] as const) {
    if (!side.title.trim())
      throw new Error(
        `comparison-split: ${name}.title must contain text, got ${JSON.stringify(side.title)}`,
      );
    if (side.points.length === 0 || side.points.length > 4)
      throw new Error(
        `comparison-split: ${name}.points must contain 1 to 4 entries, got ${side.points.length}`,
      );
    for (const [index, point] of side.points.entries())
      if (!point.trim())
        throw new Error(
          `comparison-split: ${name}.points[${index}] must contain text, got ${JSON.stringify(point)}`,
        );
  }

  const before = useRef<HTMLDivElement>(null);
  const after = useRef<HTMLDivElement>(null);
  const divider = useRef<HTMLDivElement>(null);
  const panel = (side: typeof left) => (
    <>
      <h2>{side.title}</h2>
      <ul>
        {Array.from(side.points.entries(), ([i, point]) => (
          <li key={`point-${i + 1}`}>{point}</li>
        ))}
      </ul>
    </>
  );
  const layout = (
    <div className={styles.split} style={{ "--accent": ink(accent, 3) }}>
      <div ref={before}>{panel(left)}</div>
      <div className={styles.divider} aria-hidden="true" ref={divider} />
      <div ref={after}>{panel(right)}</div>
    </div>
  );

  const land = (tl: gsap.core.Timeline, side: HTMLDivElement, position?: string) =>
    tl.fromTo(
      side.querySelectorAll("h2, li"),
      { autoAlpha: 0, y: 22 },
      { autoAlpha: 1, y: 0, duration: duration.base, ease: ease.enter, stagger },
      position,
    );
  useTemplateMotion(
    at,
    (tl) => {
      // Beat 1: the first heading lands just ahead of its points.
      if (before.current) land(tl, before.current);
    },
    [
      (tl) => {
        // Beat 2: the divider slides in, the first side recedes and the second takes focus.
        if (!before.current || !divider.current || !after.current) return;
        tl.fromTo(
          divider.current,
          { autoAlpha: 0, yPercent: 18 },
          { autoAlpha: 1, yPercent: 0, duration: duration.base, ease: ease.enter },
        );
        tl.fromTo(
          before.current,
          { opacity: 1 },
          { opacity: 0.65, duration: duration.base, ease: ease.enter },
          "<",
        );
        land(tl, after.current, `<${duration.quick}`);
      },
    ],
  );
  return layout;
}
