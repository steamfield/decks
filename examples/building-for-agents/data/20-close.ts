/**
 * Slide 20: the close. Sourced in data/sources/20-close.md.
 *
 * INSTALL: the `install` fields of the stacks, rr and foreman entries in
 *   ~/Projects/steamfield/src/data/projects.ts (lines 99, 117 and 154;
 *   steamfield commit 1b001f9, read 2026-11-13), in thread order.
 * OPEN_SOURCE: the `license` fields of the same file for the five tools on
 *   the thread, read 2026-11-16: Stacks, StatGlass and Decks are Apache-2.0,
 *   rr and foreman are MIT.
 * SITE: the studio's home page, the same file's site.
 */
import { PRODUCTS } from "./products";

export const SITE = "https://steamfield.io";

/** Shown under the lede, one per line. */
export const INSTALL = [
  "npm install -g @steamfield/stacks",
  "npm install -g @steamfield/foreman",
  "brew install rileyhilliard/tap/rr",
] as const;

/** How many of the five carry an open-source licence. */
export const OPEN_SOURCE = 5;

/** The lede's count, as a word. */
export const PRODUCT_COUNT = PRODUCTS.length;
