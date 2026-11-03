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

/**
 * A recorded run's duration as every line on the page shows it: whole minutes,
 * "17 minutes" for 16.8. The title bar, the draft line, the transcript and the
 * install line all go through this, so they agree.
 */
export function runMinutes(minutes: string | number): string {
  const whole = Math.round(Number(minutes));
  return `${whole} ${whole === 1 ? "minute" : "minutes"}`;
}

type Step = { slide: number; beat: number };

/** "3 steps back, then 3 steps forward": the moves between a loop's marks, in order. */
export function loopMoves(marks: Step[]): string {
  const runs: { way: "forward" | "back"; count: number }[] = [];
  marks.slice(1).forEach((mark, i) => {
    const prev = marks[i] as Step;
    const ahead = mark.slide > prev.slide || (mark.slide === prev.slide && mark.beat > prev.beat);
    const way = ahead ? "forward" : "back";
    const last = runs.at(-1);
    if (last?.way === way) last.count++;
    else runs.push({ way, count: 1 });
  });
  return runs
    .map(({ way, count }) => `${count} ${count === 1 ? "step" : "steps"} ${way}`)
    .join(", then ");
}
