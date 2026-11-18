import { duration, ease } from "@react-decks/motion";
import { useRef } from "react";
import { ink } from "../theme/theme";
import type { TemplateProps } from "./motion-template-props";
import styles from "./section-wipe.module.css";
import { useTemplateMotion } from "./use-template-motion";

export function SectionWipe({
  number,
  title,
  at = 0,
  accent = "cyan",
}: TemplateProps<"section-wipe">) {
  if (!Number.isSafeInteger(at) || at < 0) throw new Error(`section-wipe: invalid at ${at}`);
  if (!number.trim()) throw new Error(`section-wipe: invalid number ${JSON.stringify(number)}`);
  if (!title.trim()) throw new Error(`section-wipe: invalid title ${JSON.stringify(title)}`);
  const panel = useRef<HTMLDivElement>(null);
  const numeral = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const layout = (
    <div className={`od-body ${styles.section}`}>
      <div
        ref={panel}
        aria-hidden="true"
        className={styles.panel}
        style={{ backgroundColor: ink(accent, 3) }}
      />
      <div className={styles.number} ref={numeral}>
        {number}
      </div>
      <h2 ref={heading}>{title}</h2>
    </div>
  );
  useTemplateMotion(at, (tl) => {
    // A sheet of colour crosses the canvas and clears the far edge as the number and title land.
    const covered = "inset(0% 0% 0% 0%)";
    tl.fromTo(
      panel.current,
      { clipPath: "inset(0% 100% 0% 0%)" },
      { clipPath: covered, duration: duration.base, ease: ease.enter },
    );
    tl.fromTo(
      panel.current,
      { clipPath: covered },
      {
        clipPath: "inset(0% 0% 0% 100%)",
        duration: duration.slow,
        ease: ease.enter,
        immediateRender: false,
      },
    );
    tl.fromTo(
      numeral.current,
      { autoAlpha: 0, yPercent: 22 },
      { autoAlpha: 1, yPercent: 0, duration: duration.slow, ease: ease.enter },
      duration.base,
    );
    tl.fromTo(
      heading.current,
      { autoAlpha: 0, yPercent: 25 },
      { autoAlpha: 1, yPercent: 0, duration: duration.slow, ease: ease.enter },
      duration.base + duration.quick,
    );
  });
  return layout;
}
