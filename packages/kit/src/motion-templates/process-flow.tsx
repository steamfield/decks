import { duration, ease, type gsap } from "@react-decks/motion";
import { useRef } from "react";
import { ink } from "../theme/theme";
import type { TemplateProps } from "./motion-template-props";
import styles from "./process-flow.module.css";
import { useTemplateMotion } from "./use-template-motion";

export function ProcessFlow({ steps, at = 0, accent = "cyan" }: TemplateProps<"process-flow">) {
  if (!Number.isSafeInteger(at) || at < 0)
    throw new Error(`process-flow: at must be a non-negative whole number, got ${at}`);
  if (steps.length === 0 || steps.length > 5)
    throw new Error(`process-flow: steps must contain 1 to 5 entries, got ${steps.length}`);
  for (const [index, label] of steps.entries())
    if (!label.trim())
      throw new Error(
        `process-flow: steps[${index}] must contain text, got ${JSON.stringify(label)}`,
      );

  const list = useRef<HTMLOListElement>(null);
  const layout = (
    <ol ref={list} className={styles.flow} style={{ color: ink(accent, 3) }}>
      {Array.from(steps.entries(), ([i, label]) => (
        <li key={`step-${i + 1}`}>
          {i > 0 && <span className={styles.connector} aria-hidden="true" />}
          <div className={styles.box}>
            <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            <strong>{label}</strong>
          </div>
        </li>
      ))}
    </ol>
  );

  const lightStep = (index: number) => (tl: gsap.core.Timeline) => {
    const item = list.current?.children[index];
    const box = item?.lastElementChild;
    if (!box) return;
    // Each new connection draws towards the next box before its label lights up.
    if (index > 0)
      tl.fromTo(
        item.firstElementChild,
        { scaleX: 0 },
        { scaleX: 1, duration: duration.base, ease: ease.snap },
      );
    tl.fromTo(
      box,
      { autoAlpha: 0, y: 16 },
      { autoAlpha: 1, y: 0, duration: duration.slow, ease: ease.snap },
      index > 0 ? `<${duration.quick}` : ">",
    );
  };
  useTemplateMotion(
    at,
    lightStep(0),
    steps.slice(1).map((_, i) => lightStep(i + 1)),
  );
  return layout;
}
