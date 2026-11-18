import { duration, ease, type gsap } from "@react-decks/motion";
import { useRef } from "react";
import { ink } from "../theme/theme";
import type { TemplateProps } from "./motion-template-props";
import styles from "./timeline-sweep.module.css";
import { useTemplateMotion } from "./use-template-motion";

export function TimelineSweep({
  events,
  at = 0,
  accent = "cyan",
}: TemplateProps<"timeline-sweep">) {
  if (!Number.isSafeInteger(at) || at < 0)
    throw new Error(`timeline-sweep: at must be a non-negative whole number, got ${at}`);
  if (events.length === 0 || events.length > 6)
    throw new Error(`timeline-sweep: events must contain 1 to 6 entries, got ${events.length}`);
  for (const [index, event] of events.entries())
    for (const field of ["date", "label"] as const)
      if (!event[field].trim())
        throw new Error(
          `timeline-sweep: events[${index}].${field} must contain text, got ${JSON.stringify(event[field])}`,
        );

  const line = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const layout = (
    <div className={styles.timeline} style={{ color: ink(accent, 3) }}>
      <div className={styles.line} ref={line} aria-hidden="true" />
      <div className={styles.head} ref={head} aria-hidden="true" />
      <ol className={styles.events} ref={list}>
        {Array.from(events.entries(), ([i, { date, label }]) => (
          <li key={`event-${i + 1}`}>
            <strong>{date}</strong>
            <span>{label}</span>
          </li>
        ))}
      </ol>
    </div>
  );

  const arrive = (index: number) => (tl: gsap.core.Timeline) => {
    const item = list.current?.children[index];
    if (!item || !line.current || !head.current) return;
    const timing = { duration: duration.slow, ease: ease.draw };
    // The track draws on the first click. The playhead travels to each date in turn.
    const column = 100 / events.length;
    if (index === 0) {
      tl.fromTo(line.current, { scaleX: 0 }, { scaleX: 1, ...timing });
      tl.fromTo(
        head.current,
        { "--first-date": "0%", autoAlpha: 0 },
        { "--first-date": `${column / 2}%`, autoAlpha: 1, ...timing },
        "<",
      );
    } else {
      // Replaying the arrival on a revisit must preserve the distance covered by later clicks.
      tl.fromTo(
        head.current,
        { "--travel": `${(index - 1) * column}%` },
        { "--travel": `${index * column}%`, immediateRender: index === 1, ...timing },
      );
    }
    // The tick rises with its date and caption as the playhead approaches.
    tl.fromTo(
      item,
      { autoAlpha: 0, y: 16 },
      { autoAlpha: 1, y: 0, ...timing },
      `<${duration.quick}`,
    );
  };
  useTemplateMotion(
    at,
    arrive(0),
    events.slice(1).map((_, i) => arrive(i + 1)),
  );
  return layout;
}
