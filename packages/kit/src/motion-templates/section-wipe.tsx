import { duration, ease, SplitText, stagger } from "@react-decks/motion";
import { useLayoutEffect, useRef } from "react";
import { ink } from "../theme/theme";
import type { TemplateProps } from "./motion-template-props";
import { riseWords } from "./rise-words";
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
  const splits = useRef<SplitText[]>([]);
  useLayoutEffect(() => {
    // The heading takes the label SplitText gives it; the numeral is a plain block, which may not
    // carry a name, so its words stay readable instead.
    const parts = (
      [
        [numeral.current, "none"],
        [heading.current, "auto"],
      ] as const
    ).flatMap(([part, aria]) =>
      part ? [SplitText.create(part, { type: "words", mask: "words", tag: "span", aria })] : [],
    );
    splits.current = parts;
    return () => {
      for (const split of parts) split.revert();
      splits.current = [];
    };
  }, []);
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
    // A sheet of colour crosses the canvas and clears the far edge. The number rises through its
    // mask as the sheet starts to clear, and the title's words follow it up.
    const covered = "inset(0% 0% 0% 0%)";
    tl.fromTo(
      panel.current,
      { clipPath: "inset(0% 100% 0% 0%)" },
      { clipPath: covered, duration: duration.base, ease: ease.slam },
    );
    tl.fromTo(
      panel.current,
      { clipPath: covered },
      {
        clipPath: "inset(0% 0% 0% 100%)",
        duration: duration.slow,
        ease: ease.slam,
        immediateRender: false,
      },
    );
    const [digits, words] = splits.current;
    const parts = [
      [numeral.current, digits?.words ?? [], duration.base],
      [heading.current, words?.words ?? [], duration.base + stagger],
    ] as const;
    for (const [part, split, start] of parts) {
      tl.fromTo(
        part,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: duration.quick, ease: ease.snap },
        start,
      );
      riseWords(tl, part, split, start);
    }
  });
  return layout;
}
