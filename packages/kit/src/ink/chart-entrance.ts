import { type AnimationSpec, FLUID_SPRING, springDuration } from "@opendata-ai/openchart-core";
import type { ChartHandle } from "@opendata-ai/openchart-react";
import { registerSettleProbe } from "@react-decks/runtime";
import { type RefObject, useEffect, useRef } from "react";

export function useChartEntrance(
  animation: AnimationSpec,
  enabled: boolean,
  visit: number,
  step?: number,
  chart?: RefObject<ChartHandle | null>,
) {
  const busy = useRef(false);
  const config = typeof animation === "object" ? animation : {};
  const enter = typeof config.enter === "object" ? config.enter : {};
  const spring =
    enter.spring ?? (animation === "fluid" || config.preset === "fluid" ? FLUID_SPRING : undefined);
  const entranceDuration =
    animation === false || config.enter === false
      ? 0
      : (enter.duration ?? (spring ? springDuration(spring) : 500)) + (config.annotationDelay ?? 0);

  useEffect(() => registerSettleProbe(() => busy.current, "chart update"), []);
  useEffect(() => {
    if (!enabled || visit < 1) return;
    const resolved = chart?.current?.instance?.layout.animation;
    const duration =
      step === undefined
        ? entranceDuration
        : resolved?.update
          ? Math.max(resolved.update.duration, resolved.exit?.duration ?? 250)
          : 0;
    if (!duration) return;
    busy.current = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const start = () => {
      timer = setTimeout(() => {
        busy.current = false;
      }, duration);
    };
    // OpenChart starts the update clock on its first frame, even after a suspended tab resumes.
    const frame = step === undefined ? undefined : requestAnimationFrame(start);
    if (frame === undefined) start();
    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      clearTimeout(timer);
      busy.current = false;
    };
  }, [enabled, entranceDuration, visit, step, chart]);
}
