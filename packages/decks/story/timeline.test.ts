import { afterEach, describe, expect, it } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { DUR, gsap } from './easings'
import { beat, useStoryTimeline } from './timeline'

const cleanups: (() => void)[] = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

function fixture() {
  const clicks = ref(0)
  const active = ref(true)
  const state = { x: 0 }
  const scope = effectScope()
  cleanups.push(() => scope.stop())
  const story = scope.run(() => useStoryTimeline((tl) => {
    beat(tl, 0)
    for (let i = 1; i <= 4; i++) {
      tl.to(state, { x: i, duration: DUR.scale, ease: 'none' })
      beat(tl, i)
    }
  }, { clicks, isActive: active }))!
  const travel = () => gsap.getTweensOf(story.tl)[0].pause()
  return { clicks, active, state, story, travel }
}

describe('beat navigation', () => {
  it('preserves normal timing but bounds interrupted forward travel to one beat', async () => {
    const { clicks, state, travel } = fixture()
    clicks.value = 1
    await nextTick()
    expect(travel().duration()).toBeCloseTo(DUR.scale)
    travel().progress(0.1)
    const before = state.x
    clicks.value = 2
    await nextTick()
    expect(state.x).toBeCloseTo(before)
    expect(travel().duration()).toBeLessThanOrEqual(DUR.scale)
    travel().progress(1)
    expect(state.x).toBe(2)
  })

  it('bounds interrupted reverse travel and lands exactly on the requested beat', async () => {
    const { clicks, state, travel } = fixture()
    clicks.value = 4
    await nextTick()
    expect(state.x).toBe(4)
    clicks.value = 3
    await nextTick()
    travel().progress(0.1)
    const before = state.x
    clicks.value = 2
    await nextTick()
    expect(state.x).toBeCloseTo(before)
    expect(travel().duration()).toBeLessThanOrEqual(DUR.scale)
    travel().progress(1)
    expect(state.x).toBe(2)
  })

  it('seeks immediately on a jump or when the slide becomes inactive', async () => {
    const { clicks, active, state, travel, story } = fixture()
    clicks.value = 3
    await nextTick()
    expect(state.x).toBe(3)
    clicks.value = 4
    await nextTick()
    travel().progress(0.1)
    active.value = false
    await nextTick()
    expect(state.x).toBe(4)
    expect(gsap.getTweensOf(story.tl)).toHaveLength(0)
  })
})
