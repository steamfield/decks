import { useTemplateMotion } from "@steamfield/decks/kit";
import { duration, type gsap, SplitText, stagger } from "@steamfield/decks/motion";
import { useLayoutEffect, useRef } from "react";
import { CLEAR, LEAN, leave, punch, slam, snap } from "./ease";
import styles from "./WordSwap.module.css";

/**
 * A sentence whose last words change on each click. The lead lines rise through per-word masks
 * while their tracking closes. A swap is one sweep from left to right: the old plate shrinks
 * off to the right as its letters lift away, and the next plate grows in from the left with its
 * letters rising onto it one at a time. Nothing clips the plate's letters, so none is ever cut.
 */
export function WordSwap({ lead, words }: { lead: readonly string[]; words: readonly string[] }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const leadWords = useRef<SplitText | null>(null);
  const letters = useRef<SplitText[]>([]);
  useLayoutEffect(() => {
    const root = heading.current;
    if (!root) return;
    const parts = SplitText.create(root.querySelectorAll(`.${styles.lead}`), {
      type: "words",
      mask: "words",
      tag: "span",
    });
    const chars = Array.from(root.querySelectorAll(`.${styles.word}`), (word) =>
      SplitText.create(word, { type: "chars", tag: "span" }),
    );
    leadWords.current = parts;
    letters.current = chars;
    return () => {
      parts.revert();
      for (const split of chars) split.revert();
      leadWords.current = null;
      letters.current = [];
    };
  }, []);
  const plates = () => Array.from(heading.current?.querySelectorAll(`.${styles.plate}`) ?? []);

  /** The plate grows in from the left and its letters rise onto it, starting together. */
  function arrive(tl: gsap.core.Timeline, index: number, at: number, accent: boolean) {
    const plate = plates()[index];
    if (!plate) return;
    tl.fromTo(
      plate.firstElementChild,
      { scaleX: 0, transformOrigin: "left center" },
      {
        scaleX: 1,
        transformOrigin: "left center",
        duration: accent ? duration.slow : duration.base,
        ease: accent ? punch : slam,
      },
      at,
    );
    tl.fromTo(
      letters.current[index]?.chars ?? [],
      { opacity: 0, yPercent: 24, skewY: LEAN },
      {
        opacity: 1,
        yPercent: 0,
        skewY: 0,
        duration: duration.base,
        ease: accent ? punch : snap,
        stagger: stagger / 3,
      },
      at + duration.quick / 2,
    );
  }

  function swap(index: number) {
    return (tl: gsap.core.Timeline) => {
      const from = plates()[index];
      if (!from) return;
      const start = tl.duration();
      // The plate on screen was posed by an earlier tween, so its exit must not render early.
      const exit = { immediateRender: false, duration: duration.base, ease: leave };
      tl.fromTo(
        from.firstElementChild,
        { scaleX: 1, transformOrigin: "right center" },
        { scaleX: 0, transformOrigin: "right center", ...exit },
        start,
      );
      tl.fromTo(
        letters.current[index]?.chars ?? [],
        { opacity: 1, yPercent: 0 },
        { opacity: 0, yPercent: -45, ...exit, duration: duration.quick, stagger: stagger / 4 },
        start,
      );
      arrive(tl, index + 1, start + duration.quick / 2, index + 1 === words.length - 1);
    };
  }

  useTemplateMotion(
    0,
    (tl) => {
      const lines = heading.current?.querySelectorAll(`.${styles.lead}`) ?? [];
      tl.fromTo(
        lines,
        { letterSpacing: "0em" },
        { letterSpacing: "-0.055em", duration: duration.slow, ease: snap },
        0,
      );
      tl.fromTo(
        leadWords.current?.words ?? [],
        { yPercent: CLEAR, skewY: LEAN },
        { yPercent: 0, skewY: 0, duration: duration.slow, ease: snap, stagger },
        0,
      );
      // The plate starts before the last lead word lands, so the sentence arrives in one move.
      arrive(tl, 0, duration.quick, false);
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
            <span className={styles.fill} />
            <span className={styles.word}>{word}</span>
          </span>
        ))}
      </span>
    </h1>
  );
}
