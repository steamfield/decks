import { duration, ease } from "@react-decks/motion";
import { useRef } from "react";
import { ink } from "../theme/theme";
import type { TemplateProps } from "./motion-template-props";
import styles from "./scramble-text.module.css";
import { useTemplateMotion } from "./use-template-motion";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function ScrambleText({
  text,
  label,
  at = 0,
  accent = "cyan",
}: TemplateProps<"scramble-text">) {
  if (!Number.isInteger(at) || at < 0)
    throw new Error(`scramble-text at must be a nonnegative integer, got ${at}`);
  if (!text.trim())
    throw new Error(`scramble-text text must contain text, got ${JSON.stringify(text)}`);
  if (text.length > 16)
    throw new Error(
      `scramble-text text must be at most 16 characters, got ${JSON.stringify(text)}`,
    );
  if (label !== undefined && !label.trim())
    throw new Error(`scramble-text label must contain text, got ${JSON.stringify(label)}`);
  if (label !== undefined && label.length > 40)
    throw new Error(
      `scramble-text label must be at most 40 characters, got ${JSON.stringify(label)}`,
    );
  const figure = useRef<HTMLElement>(null);
  const word = useRef<HTMLSpanElement>(null);
  const caption = useRef<HTMLElement>(null);
  const layout = (
    <figure className={styles.figure} ref={figure}>
      <h2 aria-label={text} style={{ color: ink(accent, 3) }}>
        <span ref={word} aria-hidden="true">
          {text}
        </span>
      </h2>
      {label && (
        <figcaption className="od-body" ref={caption}>
          {label}
        </figcaption>
      )}
    </figure>
  );
  useTemplateMotion(at, (tl) => {
    // Beat 1: the word decodes left to right from random glyphs while it settles onto its line,
    // then the label rises under it.
    tl.fromTo(
      figure.current,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: duration.quick, ease: ease.snap },
      0,
    );
    // The plugin writes the text node, not the element, so the text is never parsed as HTML. Its
    // start is the text the node holds when the tween is built, the real word, and at progress 1
    // it writes the real word, so a seek to either end of the beat shows it.
    const node = word.current?.firstChild;
    if (node)
      tl.fromTo(
        node,
        {},
        {
          scrambleText: { text, chars: GLYPHS, revealDelay: duration.quick },
          duration: duration.slow + duration.base,
          ease: "none",
        },
        0,
      );
    tl.fromTo(
      word.current,
      { yPercent: 12 },
      { yPercent: 0, duration: duration.slow + duration.base, ease: ease.snap },
      0,
    );
    if (caption.current)
      tl.fromTo(
        caption.current,
        { opacity: 0, yPercent: 40 },
        { opacity: 1, yPercent: 0, duration: duration.base, ease: ease.snap },
        duration.slow,
      );
  });
  return layout;
}
