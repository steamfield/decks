import {
  Chart,
  type ChartHandle,
  type ChartSpec,
  type LayerSpec,
  type MarkEvent,
} from "@opendata-ai/openchart-react";
import "@opendata-ai/openchart-react/styles.css";
import { motionMode } from "@react-decks/motion";
import { useSlide, useSlideScale } from "@react-decks/runtime";
import { useLayoutEffect, useRef, useState } from "react";
import { useScriptedDemo } from "../story/scripted-demo";
import { useChartEntrance } from "./chart-entrance";

function withoutAnimation(spec: ChartSpec | LayerSpec): ChartSpec | LayerSpec {
  if ("layer" in spec)
    return { ...spec, animation: false, layer: spec.layer.map(withoutAnimation) };
  if (!spec.overrides) return { ...spec, animation: false };
  const overrides = { ...spec.overrides };
  for (const size of ["compact", "medium", "full"] as const) {
    if (overrides[size]?.animation !== undefined)
      overrides[size] = { ...overrides[size], animation: false };
  }
  return { ...spec, animation: false, overrides };
}

export function OpenChart({
  spec,
  step,
  onMarkHover,
  onMarkLeave,
}: {
  spec: ChartSpec | LayerSpec;
  /** Target step for an update, false to snap, omitted on arrival. */
  step?: number | false;
  onMarkHover?: (event: MarkEvent) => void;
  onMarkLeave?: () => void;
}) {
  const chart = useRef<ChartHandle>(null);
  const scale = useSlideScale();
  const { renderContext } = useSlide();
  const { isActive, playCount, clicks } = useScriptedDemo();
  const [mode, setMode] = useState<"live" | "instant" | null>(null);
  useLayoutEffect(() => {
    setMode(motionMode());
  });
  const entryClick = useRef(clicks);
  const visit = useRef(playCount);
  useLayoutEffect(() => {
    if (visit.current !== playCount) {
      entryClick.current = clicks;
      visit.current = playCount;
    }
  }, [clicks, playCount]);
  const animated =
    isActive &&
    renderContext === "slide" &&
    mode === "live" &&
    (step === undefined
      ? (visit.current !== playCount ? clicks : entryClick.current) === 0
      : step !== false);
  const animatedSpec = animated
    ? { ...spec, animation: spec.animation ?? true }
    : withoutAnimation(spec);
  useChartEntrance(
    spec.animation ?? true,
    animated,
    playCount,
    typeof step === "number" ? step : undefined,
    chart,
  );
  return (
    <div
      className="oc-slide-chart"
      style={{
        width: `${scale * 100}%`,
        height: `${scale * 100}%`,
        transform: `scale(${1 / scale})`,
        transformOrigin: "top left",
      }}
    >
      {mode !== null && (
        <Chart
          key={playCount}
          ref={chart}
          spec={animatedSpec}
          darkMode="force"
          autoResize
          onMarkHover={onMarkHover}
          onMarkLeave={onMarkLeave}
        />
      )}
    </div>
  );
}
