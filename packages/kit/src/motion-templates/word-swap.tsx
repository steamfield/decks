import { duration, ease, type gsap, rise, SplitText, stagger } from "@react-decks/motion";
import { useSlide } from "@react-decks/runtime";
import { useLayoutEffect, useRef } from "react";
import { ink, theme } from "../theme/theme";
import { HUE_NAMES, type Hue } from "../theme/theme-resolve";
import type { TemplateProps } from "./motion-template-props";
import { riseWords } from "./rise-words";
import { useTemplateMotion } from "./use-template-motion";
import styles from "./word-swap.module.css";

/**
 * A sentence whose last phrase changes on each click. The lead lines rise through their masks;
 * the phrase sits on a plate. On a swap the old plate lifts away and fades, and the next grows in
 * from the left with its letters rising onto it. Nothing clips a plate's letters, so none is ever
 * cut. The last plate takes the accent; with the `palette` tone each plate before it takes the
 * next of the theme's hues, skipping the accent, and with `neutral` they take the muted surface.
 */
export function WordSwap({
  lead,
  words,
  tone = "palette",
  at = 0,
  accent = "cyan",
}: TemplateProps<"word-swap">) {
  if (!Number.isInteger(at) || at < 0)
    throw new Error(`word-swap at must be a nonnegative integer, got ${at}`);
  if (lead.length < 1 || lead.length > 2)
    throw new Error(`word-swap lead must have 1 or 2 lines, got ${JSON.stringify(lead)}`);
  if (words.length < 2 || words.length > 5)
    throw new Error(`word-swap words must have 2 to 5 phrases, got ${JSON.stringify(words)}`);
  for (const [prop, list, limit] of [
    ["lead", lead, 18],
    ["words", words, 16],
  ] as const)
    list.forEach((text, index) => {
      if (!text.trim())
        throw new Error(
          `word-swap ${prop}[${index}] must contain text, got ${JSON.stringify(text)}`,
        );
      if (text.length > limit)
        throw new Error(
          `word-swap ${prop}[${index}] must be at most ${limit} characters, got ${JSON.stringify(text)}`,
        );
    });
  const { clicks } = useSlide();
  // The phrase on the plate for this click; before `at` the heading is still hidden.
  const current = words[Math.min(Math.max(clicks - at, 0), words.length - 1)];
  const heading = useRef<HTMLHeadingElement>(null);
  const leads = useRef<HTMLSpanElement>(null);
  const leadWords = useRef<SplitText | null>(null);
  const letters = useRef<SplitText[]>([]);
  useLayoutEffect(() => {
    const root = heading.current;
    if (!root) return;
    const parts = SplitText.create(root.querySelectorAll(`.${styles.lead}`), {
      type: "words",
      mask: "words",
      tag: "span",
      aria: "none",
    });
    const chars = Array.from(root.querySelectorAll(`.${styles.word}`), (word) =>
      SplitText.create(word, { type: "chars", tag: "span", aria: "none" }),
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
  const last = words.length - 1;
  // Slate is the theme's grey, so the palette is the coloured hues in theme order. Every ramp's
  // step 3 is lighter than its step 1, which clears 3:1 on the canvas, so canvas-coloured letters
  // stay readable on any coloured plate.
  const hues = HUE_NAMES.filter((hue) => hue !== "slate" && hue !== accent);
  const hueOf = (index: number): Hue | undefined =>
    index === last ? accent : tone === "palette" ? hues[index % hues.length] : undefined;
  const plates = () => Array.from(heading.current?.querySelectorAll(`.${styles.plate}`) ?? []);

  /** The plate grows in from the left and its letters rise onto it, starting together. */
  function arrive(tl: gsap.core.Timeline, index: number, start: number) {
    const plate = plates()[index];
    if (!plate) return;
    tl.fromTo(
      plate.firstElementChild,
      { scaleX: 0, transformOrigin: "left center" },
      {
        scaleX: 1,
        transformOrigin: "left center",
        // The accent plate encodes no value, so it may land past its edge once and settle.
        duration: index === last ? duration.slow : duration.base,
        ease: index === last ? ease.punch : ease.slam,
      },
      start,
    );
    tl.fromTo(
      letters.current[index]?.chars ?? [],
      { opacity: 0, yPercent: 24, skewY: rise.lean },
      {
        opacity: 1,
        yPercent: 0,
        skewY: 0,
        duration: duration.base,
        ease: ease.snap,
        stagger: stagger / 3,
      },
      start + duration.quick / 2,
    );
  }

  function swap(index: number) {
    return (tl: gsap.core.Timeline) => {
      const from = plates()[index];
      if (!from) return;
      const start = tl.duration();
      // The exit moves the plate itself, never its fill or letters: with `at` 0 the arrival
      // replays on every return to the slide, and it poses the first plate's fill and letters,
      // so an exit on those would be undone and the first phrase would show under the current.
      // The plate on screen was posed by an earlier tween, so its exit must not render early.
      tl.fromTo(
        from,
        { opacity: 1, yPercent: 0 },
        {
          opacity: 0,
          yPercent: -45,
          immediateRender: false,
          duration: duration.quick,
          ease: ease.leave,
        },
        start,
      );
      arrive(tl, index + 1, start + duration.quick / 2);
    };
  }

  useTemplateMotion(
    at,
    (tl) => {
      riseWords(tl, leads.current, leadWords.current?.words ?? [], 0);
      // The plate starts before the last lead word lands, so the sentence arrives in one move.
      arrive(tl, 0, duration.quick);
    },
    words.slice(1).map((_, index) => swap(index)),
  );

  return (
    <h2 className={styles.swap} ref={heading} aria-label={`${lead.join(" ")} ${current}`}>
      <span className={styles.leads} ref={leads} aria-hidden="true">
        {Array.from(lead.entries(), ([index, line]) => (
          <span key={`${index}-${line}`} className={styles.lead}>
            {line}
          </span>
        ))}
      </span>
      <span className={styles.slot} aria-hidden="true">
        {Array.from(words.entries(), ([index, word]) => {
          const hue = hueOf(index);
          return (
            <span key={`${index}-${word}`} className={styles.plate}>
              <span
                className={styles.fill}
                style={{ backgroundColor: hue ? ink(hue, 3) : theme().surfaces.muted }}
              />
              <span
                className={styles.word}
                style={hue ? { color: theme().surfaces.canvas } : undefined}
              >
                {word}
              </span>
            </span>
          );
        })}
      </span>
    </h2>
  );
}
