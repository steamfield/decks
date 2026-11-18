import type { ChartSpec, LayerSpec } from "@opendata-ai/openchart-react";
import type { ReactNode } from "react";

export function ChartSteps(_props: {
  specs: readonly (ChartSpec | LayerSpec)[];
  at: number;
}): ReactNode {
  throw new Error("ChartSteps is not implemented");
}
