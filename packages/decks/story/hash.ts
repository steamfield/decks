/**
 * Deterministic hashing for the ink layer.
 *
 * Every random looking value on a story slide comes from here, keyed on data
 * identity (series id plus index) rather than on geometry or time. That is why
 * a resize, an HMR reload or a repaint never makes a stroke shimmer.
 */

const TABLE_SIZE = 1024

/** mulberry32: small, fast, and identical on every platform. */
function mulberry32(state: number): () => number {
  let a = state >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildTable(): number[] {
  const next = mulberry32(0x5eed1a7e)
  const out: number[] = new Array(TABLE_SIZE)
  for (let i = 0; i < TABLE_SIZE; i++) out[i] = next()
  return out
}

/** 1024 precomputed values in [0,1). Built once at module load. */
export const HASH_TABLE: readonly number[] = buildTable()

/** FNV-1a over UTF-16 code units. Returns an unsigned 32 bit integer. */
export function fnv1a(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Final avalanche mixer so nearby indices land far apart in the table. */
function mix32(n: number): number {
  let h = n >>> 0
  h ^= h >>> 16
  h = Math.imul(h, 0x7feb352d)
  h ^= h >>> 15
  h = Math.imul(h, 0x846ca68b)
  h ^= h >>> 16
  return h >>> 0
}

function seedToInt(seed: number | string): number {
  if (typeof seed === 'number') return mix32(Math.trunc(seed) >>> 0)
  return fnv1a(seed)
}

/**
 * Deterministic value in [0,1) for a seed and an optional index.
 * Same arguments always give the same number.
 */
export function hash(seed: number | string, i = 0): number {
  const base = seedToInt(seed)
  const idx = mix32(base ^ Math.imul(i >>> 0, 0x9e3779b1)) & (TABLE_SIZE - 1)
  return HASH_TABLE[idx]
}

/** Deterministic value in [lo,hi) for a seed and an index. */
export function hashRange(seed: number | string, i: number, lo: number, hi: number): number {
  return lo + hash(seed, i) * (hi - lo)
}

/** Deterministic value in [-amp,+amp] for a seed and an index. */
export function hashSigned(seed: number | string, i: number, amp: number): number {
  return (hash(seed, i) - 0.5) * 2 * amp
}
