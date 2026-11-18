import { duration, ease, SplitText, stagger } from "@react-decks/motion";
import { useLayoutEffect, useRef } from "react";
import { ink } from "../theme/theme";
import type { TemplateProps } from "./motion-template-props";
import styles from "./quote-card.module.css";
import { useTemplateMotion } from "./use-template-motion";

export function QuoteCard({ quote, source, at = 0, accent = "cyan" }: TemplateProps<"quote-card">) {
  if (!Number.isSafeInteger(at) || at < 0) throw new Error(`quote-card: invalid at ${at}`);
  if (!quote.trim()) throw new Error(`quote-card: invalid quote ${JSON.stringify(quote)}`);
  if (!source.trim()) throw new Error(`quote-card: invalid source ${JSON.stringify(source)}`);

  const marks = useRef<SVGSVGElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const credit = useRef<HTMLElement>(null);
  const split = useRef<SplitText | null>(null);
  const layout = (
    <figure className={styles.card}>
      <svg ref={marks} viewBox="0 0 90 52" aria-hidden="true" stroke={ink(accent, 3)} fill="none">
        <path pathLength="1" strokeDasharray="1" d="M35 6 C19 12 9 26 10 44 L30 44" />
        <path pathLength="1" strokeDasharray="1" d="M76 6 C60 12 50 26 51 44 L71 44" />
      </svg>
      <blockquote>
        <h1 ref={heading}>{quote}</h1>
      </blockquote>
      <figcaption className="od-body" ref={credit}>
        {source}
      </figcaption>
    </figure>
  );
  useLayoutEffect(() => {
    if (!heading.current) return;
    const segmenter = new Intl.Segmenter(undefined, { granularity: "word" });
    const words = SplitText.create(heading.current, {
      type: "words",
      tag: "span",
      // SplitText consumes these boundaries without adding visible spaces in scripts such as Japanese.
      prepareText: (text) =>
        Array.from(segmenter.segment(text), ({ segment }) => segment).join("\u200b"),
      wordDelimiter: { delimiter: "\u200b", replaceWith: "" },
    });
    split.current = words;
    return () => words.revert();
  }, []);
  useTemplateMotion(at, (tl) => {
    const words = split.current?.words;
    if (!words || !marks.current) return;
    // The two pen strokes open the quotation, the words reveal in reading order, then the source slides in.
    tl.fromTo(
      marks.current.children,
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: duration.base, stagger, ease: ease.enter },
    );
    tl.fromTo(
      heading.current,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: duration.quick, ease: ease.enter },
      duration.quick,
    );
    tl.fromTo(
      words,
      { clipPath: "inset(0% 0% 100% 0%)", opacity: 0 },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        opacity: 1,
        duration: duration.base,
        stagger: Math.min(stagger, duration.base / Math.max(1, words.length - 1)),
        ease: ease.enter,
      },
      duration.quick,
    );
    tl.fromTo(
      credit.current,
      { autoAlpha: 0, x: "-0.5em" },
      { autoAlpha: 1, x: 0, duration: duration.base, ease: ease.enter },
      `>-=${duration.quick}`,
    );
  });
  return layout;
}
