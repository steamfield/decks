import { type gsap, motionMode } from "@react-decks/motion";

/** Resolve once before inserting a group so relative positions do not stagger it. */
export function resolvePosition(
  tl: gsap.core.Timeline,
  position: gsap.Position | undefined,
): number {
  if (typeof position === "number") return position;
  if (typeof position === "string") {
    if (position === "<") {
      const recent = tl.recent();
      return recent && "startTime" in recent ? recent.startTime() : tl.duration();
    }
    if (position === ">") return tl.duration();
    const relative = /^([+-])=([\d.]+)$/.exec(position);
    if (relative) {
      const delta = (relative[1] === "-" ? -1 : 1) * Number(relative[2]);
      return Math.max(0, tl.duration() + delta);
    }
    const label = tl.labels[position];
    if (label !== undefined) return label;
  }
  return tl.duration();
}

/** Includes the deck's explicit instant mode as well as the system preference. */
export function prefersReducedMotion(): boolean {
  return motionMode() === "instant";
}
