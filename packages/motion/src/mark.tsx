import type { ReactElement, ReactNode } from "react";

export type MarkKind = "underline" | "circle" | "box" | "strike" | "cross" | "bracket";

/** A hand-drawn mark around its children, drawn on a click (architecture section 5.3). */
export function Mark(_props: {
  kind?: MarkKind;
  at: number;
  until?: number;
  color?: string;
  children?: ReactNode;
}): ReactElement {
  throw new Error("Mark is not implemented");
}
