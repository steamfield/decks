// What the caption bar shows for a deck position. Pure functions, so the
// counter, the step pips, the aria-live line and the caption text agree.
import type { DeckState } from "./protocol";

/** Steps on a slide: `beats` is the last beat's index, so one more than it. */
export const stepsOf = (state: Pick<DeckState, "beat" | "beats">) =>
  Math.max(state.beats, state.beat) + 1;

/** The counter: "2 · 3/4" (slide 2, step 3 of 4, 1-based). */
export const counterText = (state: Pick<DeckState, "slide" | "beat" | "beats">) =>
  `${state.slide} · ${state.beat + 1}/${stepsOf(state)}`;

/** The aria-live line: "Slide 2 of 5, step 3 of 4." plus the lead when there is one. */
export function announcement(state: DeckState, fallbackTitle = ""): string {
  const where = `Slide ${state.slide} of ${state.slides}, step ${state.beat + 1} of ${stepsOf(state)}.`;
  const words = state.lead || fallbackTitle;
  return words ? `${where} ${words}` : where;
}

export type Mirror = { lead: string; body: string };

/**
 * The caption bar's text. A story slide shows its card; a slide without one (a
 * cover, a conventional slide) falls back to its title, then its number.
 */
export function mirrorCopy(
  state: Pick<DeckState, "slide" | "lead" | "body">,
  titles: string[],
): Mirror {
  if (state.lead || state.body) return { lead: state.lead, body: state.body };
  const title = titles[state.slide - 1]?.trim();
  return { lead: title || `Slide ${state.slide}`, body: "" };
}

const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

/**
 * How long PLAY holds a beat before advancing: a base for the chart to land plus
 * reading time for the card, at about 200 words a minute, clamped to 3 to 9 seconds.
 */
export function dwellMs(mirror: Mirror): number {
  const count = words(mirror.lead) + words(mirror.body);
  return Math.min(9000, Math.max(3000, 1800 + count * 300));
}
