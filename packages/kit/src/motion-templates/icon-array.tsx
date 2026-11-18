import { duration, ease } from "@react-decks/motion";
import { useRef } from "react";
import { ink, theme } from "../theme/theme";
import styles from "./icon-array.module.css";
import type { TemplateProps } from "./motion-template-props";
import { useTemplateMotion } from "./use-template-motion";

const person =
  "M12 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM9 9h6c2 0 3.2 1.2 3.5 3l1 6h-2.6l-1-5v14h-3.1L12 20l-.8 7H8.1V13l-1 5H4.5l1-6C5.8 10.2 7 9 9 9Z";

export function IconArray({
  filled,
  total,
  label,
  at = 0,
  accent = "cyan",
}: TemplateProps<"icon-array">) {
  if (!Number.isSafeInteger(at) || at < 0) throw new Error(`icon-array: invalid at ${at}`);
  if (!Number.isInteger(total) || total < 1 || total > 100)
    throw new Error(`icon-array: invalid total ${total}`);
  if (!Number.isInteger(filled) || filled < 0 || filled > total)
    throw new Error(`icon-array: invalid filled ${filled}`);
  if (!label.trim()) throw new Error(`icon-array: invalid label ${JSON.stringify(label)}`);

  const grid = useRef<SVGSVGElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const columns = Math.ceil(Math.sqrt(total));
  const muted = theme().text.dim;
  const highlight = ink(accent, 3);
  const layout = (
    <div className={styles.array}>
      <svg
        ref={grid}
        role="img"
        aria-label={`${filled} of ${total} highlighted`}
        viewBox={`0 0 ${columns * 24} ${Math.ceil(total / columns) * 30}`}
      >
        {Array.from({ length: total }, (_, index) => {
          const x = (index % columns) * 24;
          const y = Math.floor(index / columns) * 30;
          return (
            <path key={`${x},${y}`} transform={`translate(${x} ${y})`} d={person} fill={muted} />
          );
        })}
      </svg>
      <h2 ref={heading}>{label}</h2>
    </div>
  );
  useTemplateMotion(at, (tl) => {
    if (!grid.current) return;
    // The whole group appears first, giving the highlighted people a denominator.
    tl.fromTo(
      grid.current,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: duration.base, ease: ease.enter },
    );
    // Colour travels across each row. Even a hundred people take the same sweep.
    if (filled)
      tl.fromTo(
        Array.from(grid.current.children).slice(0, filled),
        { attr: { fill: muted } },
        {
          attr: { fill: highlight },
          duration: duration.quick,
          ease: ease.enter,
          stagger: { amount: duration.base },
        },
        duration.quick,
      );
    // The caption lands beside the last row as the colour settles.
    tl.fromTo(
      heading.current,
      { autoAlpha: 0, xPercent: 4 },
      { autoAlpha: 1, xPercent: 0, duration: duration.base, ease: ease.enter },
      filled ? duration.quick + duration.base : duration.quick,
    );
  });
  return layout;
}
