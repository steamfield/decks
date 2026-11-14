/**
 * Slide 3: the thread. Sourced in data/sources/03-thread.md.
 *
 * The seven stations, their order, verbs, names, icons and language chips are
 * data/products.ts; nothing about a product is restated here.
 *
 * OPENDATA_TESTS: the published figure, not a count made for this deck.
 *   ~/Projects/rr/README.md line 58 (rr commit 536948d): "Its suite has around
 *   14,000 tests across a Python data pipeline, a FastAPI backend, and
 *   TypeScript frontend and MCP packages".
 *   ~/Projects/steamfield/src/content/blog/why-steamfield.mdx line 26
 *   (steamfield commit 1b001f9): "OpenData's test suite is about 14,000 tests".
 *   Both read 2026-11-13. The slide keeps the word "about".
 *   FLAG: replace with a collected count before the talk (pytest
 *   --collect-only in opendata/ and backend/, vitest list in the TypeScript
 *   packages, or the totals of one `rr test` run). OUTLINE.md section 11 says
 *   a static count on 2026-11-13 found more definitions than this.
 *
 * FEATURED: the three products the talk opens up, from OUTLINE.md section 3
 *   (Riley's decision, 2026-11-13).
 *
 * "Most started inside OpenData" on the first card is FLAG: author-reported.
 */
import { PRODUCTS, type ProductId } from './products'

/** Published as "around 14,000" and "about 14,000". See the header. */
export const OPENDATA_TESTS = 14000

/** The products that get more than one slide. */
export const FEATURED: readonly ProductId[] = ['stacks', 'foreman', 'statglass']

/** How many of the seven have TypeScript on their language chip. */
export const TYPESCRIPT_PRODUCTS = PRODUCTS.filter((p) => p.lang.includes('TypeScript')).length

/** A language chip, split where products.ts puts a middle dot, one part per line. */
export const langLines = (lang: string): string[] => lang.split(' · ')

/** A small count as the word a card would use. */
export const countWord = (n: number): string =>
  ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'][n] ?? String(n)

/** Seconds the notes give each product that is not featured. FLAG: author-reported (OUTLINE.md section 10). */
export const BRIEF_SECONDS = 90
