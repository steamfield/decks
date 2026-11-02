import { describe, expect, it } from 'vitest'
import { STAGE, useStageMap } from './stage-map'

const { toPctBox, toStageCenter, toStageSize } = useStageMap()

describe('useStageMap', () => {
  it('maps the stage corners onto the frame corners', () => {
    expect(toPctBox(0, 0, STAGE.width, STAGE.height)).toEqual({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
    })
  })

  it('round trips a box', () => {
    const box = { left: 21, top: 45, width: 30, height: 13 }
    const { x, y } = toStageCenter(box)
    const { width, height } = toStageSize(box)
    const back = toPctBox(x - width / 2, y - height / 2, width, height)
    for (const k of ['left', 'top', 'width', 'height'] as const) {
      expect(back[k], k).toBeCloseTo(box[k], 10)
    }
  })

  it('puts the stage centre at the middle of the frame', () => {
    expect(toStageCenter({ left: 0, top: 0, width: 100, height: 100 })).toEqual({
      x: STAGE.width / 2,
      y: STAGE.height / 2,
    })
  })

  it('does not read the window', () => {
    // The frame is 16:9 and so is the viewBox, so the mapping is fixed. A
    // window read here would mean the crop is back.
    const src = useStageMap.toString()
    expect(src).not.toMatch(/innerWidth|innerHeight|getBoundingClientRect/)
  })
})
