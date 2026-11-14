import { STAGE } from "@steamfield/decks/kit";
import type { ReactNode } from "react";

/** Figure status, positioned in the stage's viewBox coordinates. */
export function EvidenceTag({
  kind,
  x,
  y,
  align = "left",
  progress = 1,
  children,
}: {
  kind: "recorded" | "schematic" | "illustrative";
  x: number;
  y: number;
  align?: "left" | "right";
  progress?: number;
  children?: ReactNode;
}) {
  return (
    <span
      className={`sf-tag is-${kind}${align === "right" ? " is-right" : ""}`}
      style={{
        left: `${(x / STAGE.width) * 100}%`,
        top: `${(y / STAGE.height) * 100}%`,
        opacity: progress,
      }}
    >
      {children ?? kind}
    </span>
  );
}
