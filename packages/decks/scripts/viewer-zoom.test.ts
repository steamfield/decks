import { describe, expect, it } from 'vitest'
import { constrain, fittedView, zoomAt } from '../viewer/zoom'

describe('presentation zoom geometry', () => {
  it('keeps the point under the cursor stationary while zooming', () => {
    const view = zoomAt(fittedView(), 2, 700, 400, 1920, 1080)
    expect(view.x + 700 * view.scale).toBe(700)
    expect(view.y + 400 * view.scale).toBe(400)
  })
  it('never shrinks below the fitted canvas and resets panning', () => {
    expect(zoomAt(fittedView(), 0.5, 10, 10, 1920, 1080)).toEqual(fittedView())
    expect(zoomAt({ scale: 2, x: -300, y: -500 }, 1, 700, 400, 1920, 1080)).toEqual(fittedView())
  })
  it('keeps panning inside the enlarged canvas after a display resize', () => {
    expect(constrain({ scale: 2, x: -9000, y: 100 }, 1280, 720)).toEqual({ scale: 2, x: -1280, y: 0 })
  })
  it('bounds magnification without depending on display pixel density', () => {
    expect(zoomAt(fittedView(), 100, 100, 100, 1920, 1080).scale).toBe(4)
    expect(zoomAt(fittedView(), 0, 100, 100, 1920, 1080).scale).toBe(1)
  })
})
