/**
 * Slide 19: the close. Sourced in data/sources/19-close.md.
 *
 * INSTALL: the `install` fields of the stacks, rr and foreman entries in
 *   ~/Projects/steamfield/src/data/projects.ts (lines 99, 117 and 154;
 *   steamfield commit 1b001f9, read 2026-11-13), in thread order.
 * OPEN_SOURCE: the `license` fields of the same file's seven entries. Six
 *   name an open source licence (Apache-2.0 or MIT); OpenData's is
 *   "Open core". That is why the lede says "most".
 * SITE: the studio's home page, the same file's site.
 */
import { PRODUCTS } from './products'

export const SITE = 'https://steamfield.io'

/** Shown under the lede, one per line. */
export const INSTALL = [
  'npm install -g @steamfield/stacks',
  'npm install -g @steamfield/foreman',
  'brew install rileyhilliard/tap/rr',
] as const

/** Products with an open source licence in projects.ts, of PRODUCTS.length. */
export const OPEN_SOURCE = 6

/** The lede's count, as a word. */
export const PRODUCT_COUNT = PRODUCTS.length
