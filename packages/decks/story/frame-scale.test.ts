import { describe, expect, it } from 'vitest'
import { frameScale } from './frame-scale'

describe('frameScale', () => {
  it('is 1 on the 1920x1080 canvas', () => {
    expect(frameScale(1920, 1080)).toBe(1)
  })
  it('follows width on a window taller than 16:9', () => {
    expect(frameScale(1280, 800)).toBeCloseTo(1280 / 1920)
  })
  it('follows height on a window wider than 16:9', () => {
    expect(frameScale(2560, 720)).toBeCloseTo(1280 / 1920)
  })
})
