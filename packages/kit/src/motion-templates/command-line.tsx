import { duration, ease, SplitText, stagger } from "@react-decks/motion";
import { useLayoutEffect, useRef } from "react";
import { ink } from "../theme/theme";
import styles from "./command-line.module.css";
import type { TemplateProps } from "./motion-template-props";
import { useTemplateMotion } from "./use-template-motion";

export function CommandLine({ command, at = 0, accent = "cyan" }: TemplateProps<"command-line">) {
  if (!Number.isInteger(at) || at < 0)
    throw new Error(`command-line at must be a nonnegative integer, got ${at}`);
  if (!command.trim())
    throw new Error(`command-line command must contain text, got ${JSON.stringify(command)}`);
  if (command.length > 48)
    throw new Error(
      `command-line command must be at most 48 characters, got ${JSON.stringify(command)}`,
    );
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
  const layout = (
    <div className={styles.bar} ref={bar}>
      <span className={styles.prompt} aria-hidden="true" style={{ color: ink(accent, 3) }}>
        $
      </span>
      <code ref={code}>{command}</code>
    </div>
  );
  useTemplateMotion(at, (tl) => {
    // Beat 1: the bar wipes across, and the command types on while it is still opening.
    tl.fromTo(
      bar.current,
      { clipPath: "inset(0% 100% 0% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: duration.base, ease: ease.slam },
      0,
    );
    // Each character appears whole, in order, as on a terminal.
    tl.fromTo(
      split.current?.chars ?? [],
      { opacity: 0 },
      { opacity: 1, duration: stagger, stagger: { amount: duration.slow }, ease: "none" },
      duration.quick,
    );
  });
  return layout;
}
