import type { ReactNode } from "react";

export interface CameraStop {
  readonly x: number;
  readonly y: number;
  readonly zoom: number;
}

export function Camera(_props: {
  stops: readonly CameraStop[];
  at: number;
  children?: ReactNode;
}): ReactNode {
  throw new Error("Camera is not implemented");
}
