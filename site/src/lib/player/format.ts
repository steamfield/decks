// What the faceplate and the page text show for a deck position. Pure functions,
// so the counter, the meters, the aria-live line and the mirrored copy agree.
import type { DeckState } from "./protocol";

/** Steps on a slide: `beats` is the last beat's index, so one more than it. */
export const stepsOf = (state: Pick<DeckState, "beat" | "beats">) =>
  Math.max(state.beats, state.beat) + 1;

/** The counter: "S2·B3" (slide 2, beat 3, both 1-based). */
export const counterText = (state: Pick<DeckState, "slide" | "beat">) =>
  `S${state.slide}·B${state.beat + 1}`;

/** The aria-live line: "Slide 2 of 5, step 3 of 4." plus the lead when there is one. */
export function announcement(state: DeckState, fallbackTitle = ""): string {
  const where = `Slide ${state.slide} of ${state.slides}, step ${state.beat + 1} of ${stepsOf(state)}.`;
  const words = state.lead || fallbackTitle;
  return words ? `${where} ${words}` : where;
}

export type Mirror = { lead: string; body: string };

/**
 * The page text under the window. A story slide shows its card; a slide without
 * one (a cover, a conventional slide) falls back to its title, then its number.
 */
export function mirrorCopy(
  state: Pick<DeckState, "slide" | "lead" | "body">,
  titles: string[],
): Mirror {
  if (state.lead || state.body) return { lead: state.lead, body: state.body };
  const title = titles[state.slide - 1]?.trim();
  return { lead: title || `Slide ${state.slide}`, body: "" };
}

/** 0..1 positions for the two meters: within the slide's beats, and within the deck. */
export function meterLevels(state: DeckState) {
  const steps = stepsOf(state);
  return {
    beat: steps <= 1 ? 1 : state.beat / (steps - 1),
    deck: state.slides <= 1 ? 1 : (state.slide - 1) / (state.slides - 1),
  };
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
