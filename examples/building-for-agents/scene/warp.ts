// The tube's barrel warp, as a displacement map for an SVG filter.
//
// The formula is crtWarp() from ~/Projects/steamfield/src/lib/crt-warp.ts
// (steamfield commit 53a1a06): the point shown at display position d (from the
// center) is the picture's point at d * (1 + amount * |d|^2 / corner^3), so
// the displacement is zero at the center and `amount` pixels at the corners.
//
// feDisplacementMap reads its offset from an image: a pixel's red and green
// channels, less one half, times the filter's `scale`. This draws that image.
// With scale = 2 * amount the map is independent of the amount, so one small
// image serves every frame size and only `scale` changes on resize.

/** Displacement at the frame's corners, in units of a 1920-wide frame. */
export const TUBE_WARP = 8

/** The map's own size. The warp is smooth, so a small image interpolates well. */
const MAP = { width: 256, height: 144 } as const

/** A data URL of the displacement map, for an feImage. */
export function warpMapUrl(): string {
  const canvas = document.createElement('canvas')
  canvas.width = MAP.width
  canvas.height = MAP.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('warp: no 2d context for the displacement map')
  const image = ctx.createImageData(MAP.width, MAP.height)
  const hx = (MAP.width - 1) / 2
  const hy = (MAP.height - 1) / 2
  const corner = Math.hypot(hx, hy)
  for (let y = 0; y < MAP.height; y++) {
    for (let x = 0; x < MAP.width; x++) {
      const dx = x - hx
      const dy = y - hy
      // Offset as a share of `amount`: -1..1, reaching 1 in magnitude at a corner.
      const k = (dx * dx + dy * dy) / corner ** 3
      const i = (y * MAP.width + x) * 4
      image.data[i] = Math.round(255 * (0.5 + (dx * k) / 2))
      image.data[i + 1] = Math.round(255 * (0.5 + (dy * k) / 2))
      image.data[i + 2] = 128
      image.data[i + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
  return canvas.toDataURL('image/png')
}

/** The filter's `scale` for a frame this many CSS pixels wide. */
export function warpScale(frameWidth: number): number {
  return (2 * TUBE_WARP * frameWidth) / 1920
}
