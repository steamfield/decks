import {
  Chart,
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

export function OpenChart({
  spec,
  onMarkHover,
  onMarkLeave,
}: {
  spec: ChartSpec | LayerSpec;
  onMarkHover?: (event: MarkEvent) => void;
  onMarkLeave?: () => void;
}) {
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
    (visit.current !== playCount ? clicks : entryClick.current) === 0;
  const animatedSpec = { ...spec, animation: animated ? (spec.animation ?? true) : false };
  useChartEntrance(animatedSpec.animation, animated && mode !== null, playCount);
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
          key={`${playCount}-${animated}`}
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
