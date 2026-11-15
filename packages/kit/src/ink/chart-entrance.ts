import { type AnimationSpec, FLUID_SPRING, springDuration } from "@opendata-ai/openchart-core";
import { registerSettleProbe } from "@react-decks/runtime";
import { useEffect, useRef } from "react";

export function useChartEntrance(animation: AnimationSpec, enabled: boolean, visit: number) {
  const busy = useRef(false);
  const config = typeof animation === "object" ? animation : {};
  const enter = typeof config.enter === "object" ? config.enter : {};
  const spring =
    enter.spring ?? (animation === "fluid" || config.preset === "fluid" ? FLUID_SPRING : undefined);
  const milliseconds =
    animation === false || config.enter === false
      ? 0
      : (enter.duration ?? (spring ? springDuration(spring) : 500)) + (config.annotationDelay ?? 0);
  useEffect(() => registerSettleProbe(() => busy.current), []);
  useEffect(() => {
    if (!enabled || visit < 1 || milliseconds === 0) return;
    // This bounds the declared entrance; OpenChart has no public completion signal.
    busy.current = true;
    const timer = setTimeout(() => {
      busy.current = false;
    }, milliseconds);
    return () => {
      clearTimeout(timer);
      busy.current = false;
    };
  }, [enabled, milliseconds, visit]);
}
