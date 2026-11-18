import { duration, ease, SplitText, stagger } from "@react-decks/motion";
import { useLayoutEffect, useRef } from "react";
import { ink } from "../theme/theme";
import type { TemplateProps } from "./motion-template-props";
import styles from "./title-reveal.module.css";
import { useTemplateMotion } from "./use-template-motion";

export function TitleReveal({
  title,
  subtitle,
  at = 0,
  accent = "cyan",
}: TemplateProps<"title-reveal">) {
  if (!Number.isInteger(at) || at < 0)
    throw new Error(`title-reveal at must be a nonnegative integer, got ${at}`);
  if (!title.trim())
    throw new Error(`title-reveal title must contain text, got ${JSON.stringify(title)}`);
  const figure = useRef<HTMLElement>(null);
  const headline = useRef<HTMLHeadingElement>(null);
  const rule = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLElement>(null);
  const words = useRef<SplitText | null>(null);
  useLayoutEffect(() => {
    if (!headline.current) return;
    const split = SplitText.create(headline.current, { type: "words", mask: "words", tag: "span" });
    words.current = split;
    return () => {
      split.revert();
      words.current = null;
    };
  }, []);
  const layout = (
    <figure className={styles.figure} ref={figure} style={{ color: ink(accent, 3) }}>
      <h2 ref={headline}>{title}</h2>
      <div className={styles.rule} ref={rule} aria-hidden="true" />
      {subtitle && (
        <figcaption className="od-body" ref={caption}>
          {subtitle}
        </figcaption>
      )}
    </figure>
  );
  useTemplateMotion(at, (tl) => {
    // Beat 1: words rise through their masks. The rule reaches across as the last word lands.
    const parts = words.current?.words ?? [];
    const spread = Math.min(duration.base, stagger * Math.max(0, parts.length - 1));
    tl.fromTo(
      figure.current,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: duration.quick, ease: ease.enter },
      0,
    );
    tl.fromTo(
      parts,
      { yPercent: 110 },
      { yPercent: 0, stagger: { amount: spread }, duration: duration.base, ease: ease.enter },
      0,
    );
    tl.fromTo(
      rule.current,
      { scaleX: 0 },
      { scaleX: 1, duration: duration.base, ease: ease.enter },
      spread + duration.quick,
    );
    if (caption.current)
      tl.fromTo(
        caption.current,
        { yPercent: 30, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: duration.base, ease: ease.enter },
        spread + duration.base,
      );
  });
  return layout;
}
