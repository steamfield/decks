import { duration, ease, SplitText, stagger } from "@react-decks/motion";
import { useLayoutEffect, useRef } from "react";
import { ink } from "../theme/theme";
import styles from "./end-card.module.css";
import type { TemplateProps } from "./motion-template-props";
import { useTemplateMotion } from "./use-template-motion";

export function EndCard({ title, link, at = 0, accent = "cyan" }: TemplateProps<"end-card">) {
  if (!Number.isSafeInteger(at) || at < 0) throw new Error(`end-card: invalid at ${at}`);
  if (!title.trim()) throw new Error(`end-card: invalid title ${JSON.stringify(title)}`);
  const heading = useRef<HTMLHeadingElement>(null);
  const rule = useRef<HTMLSpanElement>(null);
  const address = useRef<HTMLAnchorElement>(null);
  const split = useRef<SplitText | null>(null);
  const layout = (
    <div className={styles.card}>
      <h1 ref={heading}>{title}</h1>
      <span
        className={styles.rule}
        aria-hidden="true"
        ref={rule}
        style={{ backgroundColor: ink(accent, 3) }}
      />
      {link && (
        <a className="od-body" href={link} ref={address}>
          {link}
        </a>
      )}
    </div>
  );
  useLayoutEffect(() => {
    if (!address.current) return;
    const chars = SplitText.create(address.current, { type: "chars", tag: "span" });
    split.current = chars;
    return () => chars.revert();
  }, []);
  useTemplateMotion(at, (tl) => {
    // The title rises, the rule extends beneath it, then the address types on.
    tl.fromTo(
      heading.current,
      { autoAlpha: 0, yPercent: 22 },
      { autoAlpha: 1, yPercent: 0, duration: duration.slow, ease: ease.enter },
    );
    tl.fromTo(
      rule.current,
      { scaleX: 0 },
      { scaleX: 1, duration: duration.base, ease: ease.enter },
      duration.quick,
    );
    if (address.current && split.current) {
      const { chars } = split.current;
      tl.fromTo(
        address.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: duration.quick, ease: ease.enter },
        duration.base,
      );
      tl.fromTo(
        chars,
        { opacity: 0 },
        {
          opacity: 1,
          duration: stagger,
          stagger: Math.min(stagger, duration.slow / Math.max(1, chars.length - 1)),
          ease: ease.enter,
        },
        duration.base,
      );
    }
  });
  return layout;
}
