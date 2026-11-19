import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";

export const duration: { readonly quick: 0.14; readonly base: 0.3; readonly slow: 0.6 } = {
  quick: 0.14,
  base: 0.3,
  slow: 0.6,
};
export const ease: {
  readonly enter: "deckEnter";
  readonly exit: "deckExit";
  readonly settle: "deckSettle";
  readonly draw: "deckDraw";
  /** Type arriving, and any tween that encodes a value: a fast attack, then a long soft settle. */
  readonly snap: "deckSnap";
  /** An accent that encodes nothing (a plate, a marker): past its mark once, then back. */
  readonly punch: "deckPunch";
  /** Something leaving: a small gather, then away. */
  readonly leave: "deckLeave";
  /** A plate or band crossing the canvas: even speed through the middle. */
  readonly slam: "deckSlam";
} = {
  enter: "deckEnter",
  exit: "deckExit",
  settle: "deckSettle",
  draw: "deckDraw",
  snap: "deckSnap",
  punch: "deckPunch",
  leave: "deckLeave",
  slam: "deckSlam",
};
export const stagger = 0.06;
/**
 * How masked type rises: `clear` is how far a word travels to clear its mask, as a percentage of
 * its own height; `lean` is the skew in degrees it arrives with before settling upright.
 */
export const rise: { readonly clear: 135; readonly lean: 5 } = { clear: 135, lean: 5 };

gsap.registerPlugin(CustomEase);
CustomEase.create(ease.enter, "0.16,1,0.3,1");
CustomEase.create(ease.exit, "0.7,0,0.84,0");
CustomEase.create(ease.settle, "0.32,0.72,0,1");
CustomEase.create(ease.draw, "0.65,0,0.35,1");
CustomEase.create(ease.snap, "M0,0 C0.06,0.6 0.12,0.9 0.3,0.97 0.5,1.004 0.72,1 1,1");
CustomEase.create(ease.punch, "M0,0 C0.1,0.7 0.18,1.13 0.4,1.06 0.58,0.99 0.8,1 1,1");
CustomEase.create(ease.leave, "M0,0 C0.3,-0.06 0.62,0.18 1,1");
CustomEase.create(ease.slam, "0.76,0,0.24,1");
gsap.defaults({ ease: ease.settle });
// Beats keep wall-clock time even when a live WebGL scene stalls frames.
gsap.ticker.lagSmoothing(0);

export function motionMode(): "live" | "instant" {
  return document.documentElement.getAttribute("data-deck-motion") === "live" ? "live" : "instant";
}

export { gsap };
