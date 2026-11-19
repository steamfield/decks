import { duration, ease, stagger } from "@react-decks/motion";
import { useRef } from "react";
import { ink } from "../theme/theme";
import styles from "./agenda.module.css";
import type { TemplateProps } from "./motion-template-props";
import { useTemplateMotion } from "./use-template-motion";

export function Agenda({ items, current, at = 0, accent = "cyan" }: TemplateProps<"agenda">) {
  if (!Number.isSafeInteger(at) || at < 0) throw new Error(`agenda: invalid at ${at}`);
  if (!items.length || items.length > 7)
    throw new Error(`agenda: invalid items ${JSON.stringify(items)}`);
  items.forEach((item, index) => {
    if (!item.trim()) throw new Error(`agenda: invalid items[${index}] ${JSON.stringify(item)}`);
  });
  if (!Number.isInteger(current) || current < 1 || current > items.length)
    throw new Error(`agenda: invalid current ${current}`);
  const list = useRef<HTMLOListElement>(null);
  const layout = (
    <ol ref={list} className={`od-body ${styles.agenda}`}>
      {Array.from(items.entries(), ([index, item]) => {
        const section = index + 1;
        return (
          <li
            key={section}
            aria-current={section === current ? "step" : undefined}
            style={{ color: section === current ? ink(accent, 3) : undefined }}
          >
            <span className={styles.marker} aria-hidden="true">
              {section < current ? "✓" : String(section).padStart(2, "0")}
            </span>
            {section < current && <span className={styles.done}>Completed: </span>}
            <span>{item}</span>
          </li>
        );
      })}
    </ol>
  );
  useTemplateMotion(at, (tl) => {
    if (!list.current) return;
    // The route appears in order; the current section steps out of the column as it appears.
    const rows = list.current.children;
    const each = Math.min(stagger, duration.base / Math.max(1, rows.length - 1));
    tl.fromTo(
      rows,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: duration.base, stagger: each, ease: ease.snap },
    );
    tl.fromTo(
      rows.item(current - 1),
      { x: 0 },
      { x: "0.75em", duration: duration.slow, ease: ease.punch },
      each * (current - 1),
    );
  });
  return layout;
}
