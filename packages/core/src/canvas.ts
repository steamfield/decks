export interface CanvasFit {
  /** Factor to transform-scale the frame by. */
  readonly scale: number;
  /** Logical size of the frame in design pixels, before scaling. */
  readonly width: number;
  readonly height: number;
}

export function fitCanvas(
  containerWidth: number,
  containerHeight: number,
  designWidth: number,
  designHeight: number,
): CanvasFit {
  if (!Number.isFinite(designWidth) || designWidth <= 0) {
    throw new Error(`Design width must be positive and finite: ${designWidth}`);
  }
  if (!Number.isFinite(designHeight) || designHeight <= 0) {
    throw new Error(`Design height must be positive and finite: ${designHeight}`);
  }
  if (
    !Number.isFinite(containerWidth) ||
    containerWidth <= 0 ||
    !Number.isFinite(containerHeight) ||
    containerHeight <= 0
  ) {
    return { scale: 1, width: designWidth, height: designHeight };
  }
  const scale = Math.min(containerWidth / designWidth, containerHeight / designHeight);
  return { scale, width: containerWidth / scale, height: containerHeight / scale };
}
