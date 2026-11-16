import type { ProductId } from "./products";

/** Section-title contract, 2026-11-16. Mechanisms follow the existing tool-slide notes. */
export const SECTIONS: Record<ProductId, string> = {
  stacks: "Stacks starts a project an agent can finish.",
  foreman: "foreman delegates the coding to Codex agents.",
  rr: "rr runs the tests on machines that sit idle.",
  statglass: "StatGlass shows what those machines are doing.",
  decks: "Decks made the Horse Tinder pitch we started with.",
};

/**
 * Illustrative heat levels, not measurements: five older columns of history drawn to the left
 * of the StatGlass mark, one string per row, in the mark's opacity letters (data/products.ts).
 */
export const SECTION_HEAT = ["BDACF", "EAGBD", "CHBFA", "GCEAH"];

/** Illustrative chart cells, not data: the Decks title's slide-and-beats motif. */
export const SECTION_BARS = [3, 5, 7];
