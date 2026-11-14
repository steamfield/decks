import { DUR, STAGE } from "@react-decks/kit";
import { gsap, motionMode } from "@react-decks/motion";
import { useSlide } from "@react-decks/runtime";
import { useLayoutEffect, useRef, useState } from "react";
import type { Excerpt } from "../data/code/types";
import styles from "./CodePane.module.css";
import { tokenizeLine } from "./code-tokens";

const NO_FOCUS: readonly (readonly [number, number])[] = [];

export function CodePane({
  excerpt,
  focus = NO_FOCUS,
  x,
  y,
  width,
  height,
  progress = 1,
  size = 24,
}: {
  excerpt: Excerpt;
  focus?: readonly (readonly [number, number])[];
  x: number;
  y: number;
  width: number;
  height: number;
  progress?: number;
  size?: number;
}) {
  const { isActive, renderContext } = useSlide();
  const incoming = useRef<HTMLDivElement>(null);
  const outgoing = useRef<HTMLDivElement>(null);
  const key = `${excerpt.repo}/${excerpt.path}:${excerpt.start}`;
  const [content, setContent] = useState<{
    key: string;
    excerpt: Excerpt;
    focus: typeof focus;
    old: { excerpt: Excerpt; focus: typeof focus } | null;
  }>({ key, excerpt, focus, old: null });
  if (content.key !== key || content.excerpt !== excerpt || content.focus !== focus) {
    setContent({
      key,
      excerpt,
      focus,
      old: content.key !== key ? { excerpt: content.excerpt, focus: content.focus } : content.old,
    });
  }
  useLayoutEffect(() => {
    if (!content.old || !isActive || renderContext !== "slide" || motionMode() === "instant") {
      gsap.set(incoming.current, { clearProps: "opacity" });
      if (content.old) setContent((value) => ({ ...value, old: null }));
      return;
    }
    // Vue's out-in transition finishes the old excerpt before revealing the next one.
    const tl = gsap.timeline({
      onComplete: () => setContent((value) => ({ ...value, old: null })),
    });
    tl.set(incoming.current, { opacity: 0 });
    tl.to(outgoing.current, { opacity: 0, duration: DUR.opacity, ease: "none" });
    tl.to(incoming.current, {
      opacity: 1,
      duration: DUR.opacity,
      ease: "none",
      clearProps: "opacity",
    });
    return () => {
      tl.kill();
    };
  }, [content.old, isActive, renderContext]);

  const code = (source: Excerpt, ranges: typeof focus) => (
    <>
      <div className={`sf-code-label ${styles["sf-code-label"]}`}>
        {`${source.repo}/${source.path} · lines ${source.start} to ${source.end}`}
      </div>
      <pre
        className={`sf-code-body ${styles["sf-code-body"]}`}
        style={{ fontSize: `calc(${size / 19.2} * var(--sw))` }}
      >
        {source.code.split("\n").map((line, i) => {
          const n = i + 1;
          const lit = ranges.length === 0 || ranges.some(([a, b]) => n >= a && n <= b);
          let offset = 0;
          return (
            <span
              key={n}
              className={`sf-code-line ${styles["sf-code-line"]}${lit ? "" : " is-cold"}`}
            >
              {tokenizeLine(line, source.lang).map((token) => {
                const start = offset;
                offset += token.text.length;
                return (
                  <span
                    key={start}
                    className={`sf-tok-${token.kind} ${styles[`sf-tok-${token.kind}`] ?? ""}`}
                  >
                    {token.text}
                  </span>
                );
              })}
              {"\n"}
            </span>
          );
        })}
      </pre>
    </>
  );
  return (
    <div
      className={`sf-code ${styles["sf-code"]}`}
      style={{
        left: `${(x / STAGE.width) * 100}%`,
        top: `${(y / STAGE.height) * 100}%`,
        width: `${(width / STAGE.width) * 100}%`,
        height: `${(height / STAGE.height) * 100}%`,
        opacity: progress,
      }}
    >
      {content.old && (
        <div
          key={`${content.old.excerpt.repo}/${content.old.excerpt.path}:${content.old.excerpt.start}`}
          ref={outgoing}
          className={`sf-code-inner ${styles["sf-code-inner"]}`}
          aria-hidden="true"
        >
          {code(content.old.excerpt, content.old.focus)}
        </div>
      )}
      <div key={key} ref={incoming} className={`sf-code-inner ${styles["sf-code-inner"]}`}>
        {code(excerpt, focus)}
      </div>
    </div>
  );
}
