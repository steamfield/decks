import { duration, ease } from "@react-decks/motion";
import { useRef } from "react";
import { ink } from "../theme/theme";
import type { TemplateProps } from "./motion-template-props";
import styles from "./myth-fact.module.css";
import { useTemplateMotion } from "./use-template-motion";

export function MythFact({ myth, fact, at = 0, accent = "cyan" }: TemplateProps<"myth-fact">) {
  if (!Number.isSafeInteger(at) || at < 0)
    throw new Error(`myth-fact: at must be a non-negative whole number, got ${at}`);
  for (const [field, value] of Object.entries({ myth, fact }))
    if (!value.trim())
      throw new Error(`myth-fact: ${field} must contain text, got ${JSON.stringify(value)}`);

  const claim = useRef<HTMLHeadingElement>(null);
  const strike = useRef<HTMLSpanElement>(null);
  const answer = useRef<HTMLHeadingElement>(null);
  const layout = (
    <div className={styles.statements} style={{ "--accent": ink(accent, 3) }}>
      <h2 ref={claim}>
        <span ref={strike} className={styles.strike}>
          {myth}
        </span>
      </h2>
      <h2 ref={answer}>
        <span className={styles.fact}>{fact}</span>
      </h2>
    </div>
  );

  useTemplateMotion(
    at,
    (tl) => {
      // Beat 1: the original claim rises into view.
      tl.fromTo(
        claim.current,
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: duration.slow, ease: ease.enter },
      );
    },
    [
      (tl) => {
        // Beat 2: a stroke crosses the words as the correction rises beneath them.
        tl.fromTo(
          strike.current,
          { backgroundSize: "0% 0.06em", opacity: 1 },
          {
            backgroundSize: "100% 0.06em",
            opacity: 0.6,
            duration: duration.slow,
            ease: ease.enter,
          },
        );
        tl.fromTo(
          answer.current,
          { autoAlpha: 0, y: 24 },
          { autoAlpha: 1, y: 0, duration: duration.slow, ease: ease.enter },
          `<${duration.quick}`,
        );
      },
    ],
  );
  return layout;
}
