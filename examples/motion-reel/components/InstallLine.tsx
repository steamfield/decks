import { useTemplateMotion } from "@steamfield/decks/kit";
import { duration, SplitText } from "@steamfield/decks/motion";
import { useLayoutEffect, useRef } from "react";
import { slam } from "./ease";
import styles from "./InstallLine.module.css";

/** A command bar: the bar wipes across on click `at`, then the command types on. */
export function InstallLine({ command, at = 0 }: { command: string; at?: number }) {
  const bar = useRef<HTMLDivElement>(null);
  const code = useRef<HTMLElement>(null);
  const split = useRef<SplitText | null>(null);
  useLayoutEffect(() => {
    if (!code.current) return;
    const chars = SplitText.create(code.current, { type: "chars", tag: "span" });
    split.current = chars;
    return () => {
      chars.revert();
      split.current = null;
    };
  }, []);
  useTemplateMotion(at, (tl) => {
    const chars = split.current?.chars ?? [];
    tl.fromTo(
      bar.current,
      { clipPath: "inset(0% 100% 0% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: duration.base, ease: slam },
    );
    // Each character appears whole, in order, so the line reads as typed.
    tl.fromTo(
      chars,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0,
        stagger: { amount: duration.slow },
        ease: "none",
      },
    );
  });
  return (
    <div className={styles.bar} ref={bar}>
      <span className={styles.prompt} aria-hidden="true">
        $
      </span>
      <code ref={code}>{command}</code>
    </div>
  );
}
