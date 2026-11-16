import type { ProductId } from "./products";

/** Section-title contract, 2026-11-16. Mechanisms follow the existing tool-slide notes. */
export const SECTIONS: Record<ProductId, string> = {
  stacks: "Stacks starts a project an agent can finish.",
  foreman: "foreman delegates the coding to Codex agents.",
  rr: "rr runs the tests on machines that sit idle.",
  statglass: "StatGlass shows what those machines are doing.",
  decks: "Decks turns the work into slides like these.",
};

/** Illustrative cell heights, not CPU measurements: section-title contract's spike motif. */
export const SECTION_HISTORY = [2, 3, 2, 4, 3, 2, 3, 4, 2, 3, 4, 3, 5, 9, 4, 3];

/** Illustrative chart cells, not data: the Decks title's slide-and-beats motif. */
export const SECTION_BARS = [3, 5, 7];
