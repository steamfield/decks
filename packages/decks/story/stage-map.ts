/**
 * useStageMap: the mapping between stage units and the overlay.
 *
 * Both live in `.od-story-frame`, the largest 16:9 box that fits the viewport
 * (story-frame.css), and the stage svg's viewBox is 16:9 too, so the mapping is a
 * fixed ratio: x percent of the frame's width is always viewBox x * 1920/100.
 * It used to depend on the window, because the frame was the whole viewport
 * and `xMidYMid slice` cropped the ink by however far the window was from
 * 16:9; the frame removed the crop and with it the window dependency.
 *
 * The functions stay because the two spaces still use different numbers, and
 * an overlay element that has to sit on an svg mark should say so at the call
 * site rather than open-coding a division by 19.2.
 */

export const STAGE = { width: 1920, height: 1080 } as const

export interface StagePoint {
  x: number
  y: number
}

/** A box in overlay percentages, the shape `left/top/width/height: %` styles take. */
export interface PctBox {
  left: number
  top: number
  width: number
  height: number
}

export function useStageMap() {
  /** A stage rect as overlay percentages. */
  function toPctBox(x: number, y: number, w: number, h: number): PctBox {
    return {
      left: (x / STAGE.width) * 100,
      top: (y / STAGE.height) * 100,
      width: (w / STAGE.width) * 100,
      height: (h / STAGE.height) * 100,
    }
  }

  /** The centre of an overlay percentage box, in stage units. */
  function toStageCenter(box: PctBox): StagePoint {
    return {
      x: ((box.left + box.width / 2) / 100) * STAGE.width,
      y: ((box.top + box.height / 2) / 100) * STAGE.height,
    }
  }

  /** An overlay percentage box as a stage rect size. */
  function toStageSize(box: PctBox): { width: number; height: number } {
    return {
      width: (box.width / 100) * STAGE.width,
      height: (box.height / 100) * STAGE.height,
    }
  }

  return { toPctBox, toStageCenter, toStageSize }
}
