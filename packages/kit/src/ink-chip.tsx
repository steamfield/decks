import { motionMode } from "@react-decks/motion";
import { useSlide } from "@react-decks/runtime";
import type { CSSProperties } from "react";
import { RISE } from "./motion";
import { STAGE } from "./story-stage";
import { ink } from "./theme";
import type { Hue } from "./theme-resolve";

export function InkChip({
  x,
  y,
  text,
  hue = "cyan",
  anchor = "left",
  progress = 1,
  href,
  wide = false,
}: {
  x: number;
  y: number;
  text: string;
  hue?: Hue;
  anchor?: "left" | "right";
  progress?: number;
  href?: string;
  wide?: boolean;
}) {
  const { isActive, renderContext } = useSlide();
  const live = isActive && renderContext === "slide" && motionMode() === "live";
  const style: CSSProperties & { "--od-chip-ink": string } = {
    ...(anchor === "right"
      ? { right: `${((STAGE.width - x) / STAGE.width) * 100}%` }
      : { left: `calc(${(x / STAGE.width) * 100}% + 0.520833 * var(--sw))` }),
    top: `${(y / STAGE.height) * 100}%`,
    opacity: progress,
    transform: `translateY(-50%) translateY(calc(${live ? ((1 - progress) * RISE.card) / 19.2 : 0} * var(--sw)))`,
    pointerEvents: href && progress > 0.5 ? "auto" : "none",
    transition: live ? undefined : "none",
    "--od-chip-ink": ink(hue, 3),
  };
  const className = `od-inkchip${href ? " is-link" : ""}${wide ? " is-wide" : ""}`;
  return href ? (
    <a className={className} style={style} href={href} target="_blank" rel="noopener">
      {text}
    </a>
  ) : (
    <div className={className} style={style}>
      {text}
    </div>
  );
}
