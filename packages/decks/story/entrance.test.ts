import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRenderer, nextTick, ref } from 'vue'
import { DUR, gsap } from './easings'
import { useStageEntrance } from './entrance'

const pending = vi.hoisted(() => [] as (() => void)[])
vi.mock('@slidev/client', () => ({ useSlideContext: () => ({ $renderContext: 'slide' }) }))
vi.mock('./view-transition', () => ({ afterViewTransition: (cb: () => void) => pending.push(cb) }))

// A headless Vue host runs the real mount/watch/dispose lifecycle; no DOM is needed.
const renderer = createRenderer<object, object>({
  insert() {}, remove() {}, patchProp() {}, setText() {}, setElementText() {},
  createElement: () => ({}), createText: () => ({}), createComment: () => ({}),
  parentNode: () => null, nextSibling: () => null,
})
const cleanups: (() => void)[] = []
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup())
  pending.length = 0
})

function fixture() {
  const clicks = ref(0)
  const active = ref(true)
  const mark = { opacity: 0 }
  let entrance!: gsap.core.Timeline
  const app = renderer.createApp({ setup() {
    useStageEntrance((tl) => {
      entrance = tl
      tl.to(mark, { opacity: 1, duration: DUR.draw })
    }, { clicks, isActive: active })
    return () => null
  } })
  app.mount({})
  cleanups.push(() => app.unmount())
  return { clicks, active, mark, get entrance() { return entrance } }
}

describe('stage entrance interruption', () => {
  it('reveals the first mark when advancing before the slide transition finishes', async () => {
    const f = fixture()
    expect(f.mark.opacity).toBe(0)
    f.clicks.value = 1
    await nextTick()
    expect(f.mark.opacity).toBe(1)
    pending.splice(0).forEach((cb) => cb())
    expect(f.entrance.paused()).toBe(true)
    f.clicks.value = 0
    await nextTick()
    expect(f.mark.opacity).toBe(1)
    expect(pending).toHaveLength(0)
  })

  it('finishes an entrance already playing when the next beat starts', async () => {
    const f = fixture()
    pending.shift()!()
    f.entrance.pause().progress(0.1)
    f.clicks.value = 1
    await nextTick()
    expect(f.mark.opacity).toBe(1)
    expect(f.entrance.paused()).toBe(true)
  })

  it('ignores an old transition callback after leaving and re-entering', async () => {
    const f = fixture()
    const stale = pending.shift()!
    f.active.value = false
    await nextTick()
    f.active.value = true
    await nextTick()
    stale()
    expect(f.entrance.paused()).toBe(true)
    expect(f.mark.opacity).toBe(0)
    pending.shift()!()
    expect(f.entrance.paused()).toBe(false)
  })
})
