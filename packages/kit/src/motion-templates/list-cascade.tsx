import { duration, ease, type gsap } from "@react-decks/motion";
import { useRef } from "react";
import { ink } from "../theme/theme";
import styles from "./list-cascade.module.css";
import type { TemplateProps } from "./motion-template-props";
import { useTemplateMotion } from "./use-template-motion";

export function ListCascade({ items, at = 0, accent = "cyan" }: TemplateProps<"list-cascade">) {
  if (!Number.isSafeInteger(at) || at < 0) throw new Error(`list-cascade: invalid at ${at}`);
  if (!items.length || items.length > 6)
    throw new Error(`list-cascade: invalid items ${JSON.stringify(items)}`);
  items.forEach((item, index) => {
    if (!item.trim())
      throw new Error(`list-cascade: invalid items[${index}] ${JSON.stringify(item)}`);
  });
  const list = useRef<HTMLOListElement>(null);
  const layout = (
    <ol ref={list} className={`od-body ${styles.list}`}>
      {Array.from(items.entries(), ([index, item]) => (
        <li key={at + index}>
          <span
            className={styles.marker}
            aria-hidden="true"
            style={{ backgroundColor: ink(accent, 3) }}
          />
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
  function reveal(index: number) {
    return (tl: gsap.core.Timeline) => {
      const row = list.current?.children.item(index);
      if (!row) return;
      const start = tl.duration();
      // Each click draws a marker beside the new line as the previous line recedes.
      tl.fromTo(
        row,
        { autoAlpha: 0, x: "-0.45em" },
        { autoAlpha: 1, x: 0, duration: duration.slow, ease: ease.snap },
        start,
      );
      tl.fromTo(
        row.firstElementChild,
        { scaleX: 0 },
        { scaleX: 1, duration: duration.base, ease: ease.punch },
        start,
      );
      if (row.previousElementSibling)
        tl.fromTo(
          row.previousElementSibling.children,
          { opacity: 1 },
          { opacity: 0.64, immediateRender: false, duration: duration.base, ease: ease.leave },
          start,
        );
    };
  }
  useTemplateMotion(
    at,
    reveal(0),
    items.slice(1).map((_, index) => reveal(index + 1)),
  );
  return layout;
}
