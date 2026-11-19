import { duration, ease, type gsap, rise, stagger } from "@react-decks/motion";

/** How much looser than its resting tracking a headline starts, in em. */
const OPEN = 0.035;

/**
 * Adds a headline's entrance to `tl` at `at`: its masked words (a SplitText with
 * `mask: "words"`) rise with a lean and settle upright on `ease.snap`, the whole stagger capped
 * so a long title lands as fast as a short one. A heading that cannot wrap (`white-space:
 * nowrap`) also closes its tracking from slightly open to its resting value; a wrapping one
 * does not, because changing letter-spacing mid-entrance would move its line breaks.
 *
 * Returns when the last word starts, so a caller can start what follows before it lands.
 */
export function riseWords(
  tl: gsap.core.Timeline,
  heading: HTMLElement | null,
  words: readonly Element[],
  at: number,
): number {
  const spread = Math.min(duration.base, stagger * Math.max(0, words.length - 1));
  tl.fromTo(
    words,
    { yPercent: rise.clear, skewY: rise.lean },
    {
      yPercent: 0,
      skewY: 0,
      duration: duration.slow,
      ease: ease.snap,
      stagger: { amount: spread },
    },
    at,
  );
  if (heading && getComputedStyle(heading).whiteSpace === "nowrap") {
    // A rebuild on the same heading (effects re-run, as under StrictMode) finds the open tracking
    // an earlier build left inline; the resting value is the stylesheet's.
    heading.style.removeProperty("letter-spacing");
    const style = getComputedStyle(heading);
    const resting = Number.parseFloat(style.letterSpacing) || 0;
    const open = resting + OPEN * Number.parseFloat(style.fontSize);
    tl.fromTo(
      heading,
      { letterSpacing: `${open}px` },
      { letterSpacing: `${resting}px`, duration: duration.slow, ease: ease.snap },
      at,
    );
  }
  return at + spread;
}
