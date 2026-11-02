import { describe, expect, it } from 'vitest'
import { HASH_TABLE, hash, hashRange, hashSigned } from './hash'

describe('hash', () => {
  it('precomputes a 1024 entry table in [0,1)', () => {
    expect(HASH_TABLE).toHaveLength(1024)
    for (const v of HASH_TABLE) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('is deterministic for the same seed and index', () => {
    expect(hash('isbe-salary', 4)).toBe(hash('isbe-salary', 4))
    expect(hash(17, 0)).toBe(hash(17, 0))
  })

  it('stays in [0,1) for string and number seeds', () => {
    for (let i = 0; i < 500; i++) {
      const a = hash('series-a', i)
      const b = hash(i, 3)
      expect(a).toBeGreaterThanOrEqual(0)
      expect(a).toBeLessThan(1)
      expect(b).toBeGreaterThanOrEqual(0)
      expect(b).toBeLessThan(1)
    }
  })

  it('separates neighbouring indices', () => {
    const seen = new Set<number>()
    for (let i = 0; i < 64; i++) seen.add(hash('drift', i))
    expect(seen.size).toBeGreaterThan(50)
  })

  it('separates different seeds at the same index', () => {
    expect(hash('a', 0)).not.toBe(hash('b', 0))
  })

  it('walks the whole table for one seed', () => {
    const seen = new Set<number>()
    for (let i = 0; i < 20000; i++) seen.add(hash('coverage', i))
    expect(seen.size).toBeGreaterThan(900)
  })

  it('maps into the requested range', () => {
    for (let i = 0; i < 200; i++) {
      const v = hashRange('opacity', i, 0.22, 0.93)
      expect(v).toBeGreaterThanOrEqual(0.22)
      expect(v).toBeLessThan(0.93)
      expect(Math.abs(hashSigned('wobble', i, 3))).toBeLessThanOrEqual(3)
    }
  })
})
