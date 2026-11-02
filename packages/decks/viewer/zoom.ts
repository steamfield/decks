/** Presentation magnification, independent of browser zoom and display density. */
export interface View { scale: number; x: number; y: number }
export const fittedView = (): View => ({ scale: 1, x: 0, y: 0 })

export function constrain(view: View, width: number, height: number): View {
  const axis = (offset: number, size: number) => view.scale <= 1
    ? size * (1 - view.scale) / 2
    : Math.max(size * (1 - view.scale), Math.min(0, offset))
  return { ...view, x: axis(view.x, width), y: axis(view.y, height) }
}

export function zoomAt(view: View, scale: number, x: number, y: number, width: number, height: number): View {
  scale = Math.max(1, Math.min(4, scale))
  const ratio = scale / view.scale
  return constrain({ scale, x: x - (x - view.x) * ratio, y: y - (y - view.y) * ratio }, width, height)
}
