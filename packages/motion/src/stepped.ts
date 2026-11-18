import type { RenderContext } from "@react-decks/runtime";
import { motionMode } from "./tokens";

export function stepIndex(click: number, at: number, length: number): number {
  if (!Number.isInteger(at) || at < 1)
    throw new Error(`at must be a positive whole number, got ${at}`);
  return Math.min(length - 1, Math.max(0, click - at + 1));
}

export function shouldTweenStep(
  previous: number,
  click: number,
  active: boolean,
  context: RenderContext,
): boolean {
  return (
    previous >= 0 &&
    Math.abs(click - previous) === 1 &&
    active &&
    context === "slide" &&
    motionMode() === "live"
  );
}
