import { type Encoding, isEncodingChannel } from "@opendata-ai/openchart-core";
import type { ChartSpec, LayerSpec } from "@opendata-ai/openchart-react";
import { shouldTweenStep, stepIndex } from "@react-decks/motion";
import { useSlide } from "@react-decks/runtime";
import { type ReactNode, useState } from "react";
import { OpenChart } from "./open-chart";

function marks(
  spec: ChartSpec | LayerSpec,
  inherited?: Encoding,
): { type: string; encoding: Encoding }[] {
  const encoding = { ...inherited, ...spec.encoding };
  if ("layer" in spec) return spec.layer.flatMap((layer) => marks(layer, encoding));
  return [{ type: typeof spec.mark === "string" ? spec.mark : spec.mark.type, encoding }];
}

function validate(specs: readonly (ChartSpec | LayerSpec)[]) {
  let previous: ReturnType<typeof marks> = [];
  for (const [index, spec] of specs.entries()) {
    const current = marks(spec);
    if (index > 0) {
      const differ = (what: string, before: unknown, after: unknown) => {
        throw new Error(
          `ChartSteps specs[${index - 1}] and specs[${index}] differ in ${what} (${before} vs ${after}); a step can only morph data`,
        );
      };
      if (previous.length !== current.length)
        differ("layer count", previous.length, current.length);
      for (const [layer, next] of current.entries()) {
        const prev = previous[layer];
        if (!prev) continue;
        if (prev.type !== next.type) differ("mark type", prev.type, next.type);
        for (const channel of ["x", "y", "color", "key"] as const) {
          const a = prev.encoding[channel];
          const b = next.encoding[channel];
          for (const property of ["field", "type"] as const) {
            const before = isEncodingChannel(a) ? a[property] : undefined;
            const after = isEncodingChannel(b) ? b[property] : undefined;
            if (before !== after) differ(`${channel} encoding ${property}`, before, after);
          }
        }
      }
    }
    previous = current;
  }
}

export function ChartSteps({
  specs,
  at,
}: {
  specs: readonly (ChartSpec | LayerSpec)[];
  at: number;
}): ReactNode {
  const { clicks, isActive, renderContext } = useSlide();
  if (!(at >= 1)) throw new Error(`ChartSteps at must be at least 1, got ${at}`);
  const index = stepIndex(clicks, at, specs.length);
  const [last, setLast] = useState<{
    clicks: number;
    isActive: boolean;
    index: number;
    step?: number | false;
  }>({ clicks, isActive, index });
  const spec = specs[index];
  if (!spec) throw new Error("ChartSteps specs must contain at least one spec, got []");
  validate(specs);
  if (last.clicks !== clicks || last.isActive !== isActive || last.index !== index) {
    let step = last.step;
    if (isActive !== last.isActive) step = undefined;
    else if (!shouldTweenStep(last.clicks, clicks, isActive, renderContext)) step = false;
    else if (index !== last.index) step = index;
    setLast({ clicks, isActive, index, step });
  }
  return <OpenChart spec={spec} step={last.step} />;
}
