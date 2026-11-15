import { motionMode } from "@react-decks/motion";
import { useSlide } from "@react-decks/runtime";
import { type ReactNode, useId } from "react";
import { FILTER_IDS, filterUrl } from "../theme/filters";
import { ink } from "../theme/theme";
import type { Hue } from "../theme/theme-resolve";
import { STROKE } from "./ink-style";

export function InkCardRect({
  x,
  y,
  width,
  height,
  radius = 12,
  surface = "var(--od-surface)",
  hue,
  glowCx = 0,
  glowCy = 0,
  glowR = 1,
  glowEdge = 1,
  glowOpacity = 0.12,
  lit,
  stroke = "currentColor",
  strokeWidth = STROKE.rule,
  strokeOpacity = 1,
  dash,
  glowFilter = false,
  children,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
  surface?: string;
  hue?: Hue;
  glowCx?: number;
  glowCy?: number;
  glowR?: number;
  glowEdge?: number;
  glowOpacity?: number;
  lit?: boolean;
  stroke?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  dash?: string;
  glowFilter?: boolean;
  children?: ReactNode;
}) {
  const gradientId = `od-card-glow-${useId()}`;
  const { isActive, renderContext } = useSlide();
  const live = isActive && renderContext === "slide" && motionMode() === "live";
  const box = { x, y, width, height, rx: radius };
  const glowInk = hue ? ink(hue, 3) : "currentColor";
  return (
    <g className={`od-ink-card-rect${lit === true ? " is-lit" : lit === false ? " is-unlit" : ""}`}>
      <defs>
        <radialGradient
          id={gradientId}
          cx={glowCx}
          cy={glowCy}
          r={glowR}
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0" stopColor={glowInk} style={{ stopOpacity: glowOpacity }} />
          <stop offset={glowEdge} stopColor={glowInk} style={{ stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      <rect {...box} fill={surface} />
      <rect
        {...box}
        fill={`url(#${gradientId})`}
        className="od-card-glow"
        style={{ opacity: lit === false ? 0 : 1, transition: live ? undefined : "none" }}
      />
      <rect
        {...box}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        style={{ strokeOpacity, transition: live ? undefined : "none" }}
        strokeDasharray={dash}
        filter={glowFilter ? filterUrl(FILTER_IDS.glow) : undefined}
        className="od-card-stroke"
      />
      {children}
    </g>
  );
}
