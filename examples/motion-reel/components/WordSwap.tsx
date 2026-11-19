import { useTemplateMotion } from "@steamfield/decks/kit";
import { duration, type gsap, SplitText, stagger } from "@steamfield/decks/motion";
import { useLayoutEffect, useRef } from "react";
import { punch, snap } from "./ease";
import styles from "./WordSwap.module.css";

const SHOWN = "inset(0% 0% 0% 0%)";

/**
 * A sentence whose last words change on each click. The lead lines rise through per-word masks
 * while their tracking tightens; each swap wipes the old plate off the top as the next one
 * comes up from below, and the last plate lands with a scale punch.
 */
export function WordSwap({ lead, words }: { lead: readonly string[]; words: readonly string[] }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const split = useRef<SplitText | null>(null);
  useLayoutEffect(() => {
    const lines = heading.current?.querySelectorAll(`.${styles.lead}`);
    if (!lines?.length) return;
    const parts = SplitText.create(lines, { type: "words", mask: "words", tag: "span" });
    split.current = parts;
    return () => {
      parts.revert();
      split.current = null;
    };
  }, []);
  const plates = () => Array.from(heading.current?.querySelectorAll(`.${styles.plate}`) ?? []);

  function swap(index: number) {
    return (tl: gsap.core.Timeline) => {
      const from = plates()[index];
      const to = plates()[index + 1];
      if (!from || !to) return;
      const start = tl.duration();
      const last = index + 1 === words.length - 1;
      // The plate on screen was posed by an earlier tween, so its tweens must not render early.
      tl.fromTo(
        from,
        { clipPath: SHOWN },
        {
          clipPath: "inset(0% 0% 100% 0%)",
          immediateRender: false,
          duration: duration.base,
          ease: snap,
        },
        start,
      );
      tl.fromTo(
        from.firstElementChild,
        { yPercent: 0 },
        { yPercent: -70, immediateRender: false, duration: duration.base, ease: snap },
        start,
      );
      tl.fromTo(
        to,
        { clipPath: "inset(100% 0% 0% 0%)", scale: last ? 0.82 : 1 },
        {
          clipPath: SHOWN,
          scale: 1,
          duration: last ? duration.slow : duration.base,
          ease: last ? punch : snap,
        },
        start + duration.quick / 2,
      );
      tl.fromTo(
        to.firstElementChild,
        { yPercent: 70 },
        { yPercent: 0, duration: duration.base, ease: snap },
        start + duration.quick / 2,
      );
    };
  }

  useTemplateMotion(
    0,
    (tl) => {
      const first = plates()[0];
      const lines = heading.current?.querySelectorAll(`.${styles.lead}`) ?? [];
      tl.fromTo(
        lines,
        { letterSpacing: "0.04em" },
        { letterSpacing: "-0.055em", duration: duration.slow, ease: snap },
        0,
      );
      tl.fromTo(
        split.current?.words ?? [],
        { yPercent: 115 },
        { yPercent: 0, duration: duration.slow, ease: snap, stagger },
        0,
      );
      if (!first) return;
      tl.fromTo(
        first,
        { clipPath: "inset(0% 100% 0% 0%)" },
        { clipPath: SHOWN, duration: duration.base, ease: snap },
        duration.base,
      );
      tl.fromTo(
        first.firstElementChild,
        { xPercent: -40 },
        { xPercent: 0, duration: duration.slow, ease: snap },
        duration.base,
      );
    },
    words.slice(1).map((_, index) => swap(index)),
  );

  return (
    <h1 className={styles.swap} ref={heading} aria-label={`${lead.join(" ")} ${words.join(" ")}`}>
      {lead.map((line) => (
        <span key={line} className={styles.lead} aria-hidden="true">
          {line}
        </span>
      ))}
      <span className={styles.slot} aria-hidden="true">
        {words.map((word, index) => (
          <span key={word} className={styles.plate} data-tone={index % 3}>
            <span className={styles.word}>{word}</span>
          </span>
        ))}
      </span>
    </h1>
  );
}
