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
} = { enter: "deckEnter", exit: "deckExit", settle: "deckSettle", draw: "deckDraw" };
export const stagger = 0.06;

gsap.registerPlugin(CustomEase);
CustomEase.create(ease.enter, "0.16,1,0.3,1");
CustomEase.create(ease.exit, "0.7,0,0.84,0");
CustomEase.create(ease.settle, "0.32,0.72,0,1");
CustomEase.create(ease.draw, "0.65,0,0.35,1");
gsap.defaults({ ease: ease.settle });
// Beats keep wall-clock time even when a live WebGL scene stalls frames.
gsap.ticker.lagSmoothing(0);

export function motionMode(): "live" | "instant" {
  return document.documentElement.getAttribute("data-deck-motion") === "live" ? "live" : "instant";
}

export { gsap };
