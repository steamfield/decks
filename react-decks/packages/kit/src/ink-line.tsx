import { type gsap, motionMode, useTween } from "@react-decks/motion";
import { useSlide } from "@react-decks/runtime";
import { type Ref, useImperativeHandle, useLayoutEffect, useRef } from "react";
import { BRUSH_DEFAULTS, brushRibbon, type Point } from "./brush";
import { DRAW, DUR } from "./easings";
import { FILTER_IDS, filterUrl } from "./filters";
import { inkStyle, polylinePath, STROKE } from "./ink-style";
import type { InkStep } from "./ramps";
import { clamp01, xScale, yScale } from "./scales";
import { ink, theme } from "./theme";
import type { Hue } from "./theme-resolve";

export interface DrawOptions {
  duration?: number;
  ease?: string;
}

/** Append to caller-owned timelines managed by useStage or useTimeline. */
export interface LineHandle {
  readonly root: SVGGElement | null;
  addDraw(tl: gsap.core.Timeline, position?: gsap.Position, opts?: DrawOptions): gsap.core.Timeline;
  addErase(tl: gsap.core.Timeline, position?: gsap.Position): gsap.core.Timeline;
  settle(): void;
}

function truncate(points: Point[], fraction: number): Point[] {
  if (fraction >= 1) return points;
  if (fraction <= 0 || points.length < 2) return [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (a && b) total += Math.hypot(b.x - a.x, b.y - a.y);
  }
  const first = points[0];
  if (!first) return [];
  const out = [first];
  let walked = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (!a || !b) continue;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (walked + len >= total * fraction) {
      const u = len === 0 ? 0 : (total * fraction - walked) / len;
      out.push({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });
      break;
    }
    out.push(b);
    walked += len;
  }
  return out.length < 2 ? [] : out;
}

export function InkLine({
  series,
  xDomain,
  yDomain,
  xRange,
  yRange,
  interp = "linear",
  hue = "cyan",
  step = 3,
  reveal = 1,
  ghost = false,
  color = "",
  seed = "ink-line",
  width = BRUSH_DEFAULTS.width,
  dots = false,
  head = false,
  ref,
}: {
  series: Point[];
  xDomain: [number, number];
  yDomain: [number, number];
  xRange: [number, number];
  yRange: [number, number];
  interp?: "linear" | "step";
  hue?: Hue;
  step?: InkStep;
  reveal?: number;
  ghost?: boolean | number;
  color?: string;
  seed?: string;
  width?: number;
  dots?: boolean;
  head?: boolean;
  ref?: Ref<LineHandle>;
}) {
  const { isActive, renderContext } = useSlide();
  const root = useRef<SVGGElement>(null);
  const draw = useTween({ t: 1, opacity: 1 });
  const animations = useRef(new Set<gsap.core.Animation>());
  useLayoutEffect(() => {
    const owned = animations.current;
    return () => {
      for (const animation of owned) animation.kill();
      owned.clear();
    };
  }, []);
  function track(tl: gsap.core.Timeline) {
    const recent = tl.recent();
    if (typeof recent !== "function") animations.current.add(recent);
  }
  useImperativeHandle(ref, () => ({
    get root() {
      return root.current;
    },
    addDraw(tl, position, opts = {}) {
      tl.fromTo(
        draw,
        { t: 0 },
        { t: 1, duration: opts.duration ?? DUR.grow, ease: opts.ease ?? DRAW, lazy: false },
        position,
      );
      track(tl);
      return tl;
    },
    addErase(tl, position) {
      tl.to(draw, { opacity: 0, duration: DUR.opacity }, position ?? `+=${DUR.eraseDelay}`);
      track(tl);
      tl.set(draw, { t: 0 }, `+=${DUR.eraseHold}`);
      track(tl);
      tl.set(draw, { opacity: 1 }, "<");
      track(tl);
      return tl;
    },
    settle() {
      draw.t = 1;
    },
  }));
  const sx = xScale(xDomain, xRange);
  const sy = yScale(yDomain, yRange);
  const raw = series.map((p) => ({ x: sx(p.x), y: sy(p.y) }));
  const projected = raw.flatMap((p, i) => {
    const previous = raw[i - 1];
    return interp === "step" && previous ? [{ x: p.x, y: previous.y }, p] : [p];
  });
  const revealed = truncate(projected, clamp01(reveal));
  const clean = inkStyle() === "clean";
  const dabs = clean ? [] : brushRibbon(revealed, { seed: `${seed}:${interp}`, width });
  const ghostT = typeof ghost === "number" ? clamp01(ghost) : ghost ? 1 : 0;
  const isGhost = ghostT >= 0.5;
  const ghostColor =
    ghostT <= 0
      ? ink(hue, step)
      : ghostT >= 1
        ? ink("slate", 1)
        : `color-mix(in oklab, ${ink("slate", 1)} ${(ghostT * 100).toFixed(1)}%, ${ink(hue, step)})`;
  const first = projected[0];
  const last = projected.at(-1);
  const front = first && last ? first.x + (last.x - first.x) * draw.t : 0;
  let headY = last?.y ?? 0;
  for (let i = 1; i < projected.length; i++) {
    const a = projected[i - 1];
    const b = projected[i];
    if (a && b && (front - a.x) * (front - b.x) <= 0) {
      headY = b.x === a.x ? b.y : a.y + ((b.y - a.y) * (front - a.x)) / (b.x - a.x);
      break;
    }
  }
  const animateGhost =
    isActive && renderContext === "slide" && motionMode() === "live" && typeof ghost !== "number";
  const markStyle = {
    opacity: 1 - (1 - Number(theme().shape.dim)) * ghostT,
    transition: animateGhost ? undefined : "none",
  };
  const glow = isGhost ? undefined : filterUrl(FILTER_IDS.glow);
  return (
    <g
      ref={root}
      className="od-ink-line-root"
      style={{
        color: color || ghostColor,
        opacity: draw.opacity,
        "--od-clip": `${(1 - draw.t) * 100}%`,
      }}
    >
      <g className="od-ink-line">
        <g
          className="od-ink-body"
          style={markStyle}
          filter={clean ? glow : filterUrl(FILTER_IDS.marker)}
        >
          {clean ? (
            <path
              d={polylinePath(revealed)}
              fill="none"
              stroke="currentColor"
              strokeWidth={STROKE.line}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            dabs.map((dab) => (
              <path
                key={dab.d}
                d={dab.d}
                fill="currentColor"
                style={{ fillOpacity: dab.fillOpacity }}
              />
            ))
          )}
          {dabs
            .filter((dab) => dab.overpaint !== undefined)
            .map((dab) => (
              <path
                key={`over:${dab.d}`}
                d={dab.d}
                fill="currentColor"
                style={{ fillOpacity: dab.overpaint }}
              />
            ))}
        </g>
      </g>
      {clean && dots && draw.t > 0 && (
        <g className="od-ink-dots" style={markStyle} filter={glow}>
          {raw.map((p) => {
            const u = clamp01((front - p.x + 48) / 48);
            const r = Math.round(7 * (u + 0.45 * Math.sin(Math.PI * u)) * 100) / 100;
            return <circle key={`${p.x}:${p.y}`} cx={p.x} cy={p.y} r={r} fill="currentColor" />;
          })}
        </g>
      )}
      {head && !isGhost && reveal >= 1 && draw.t > 0 && draw.t < 1 && projected.length >= 2 && (
        <g
          className="od-ink-head"
          transform={`translate(${Math.round(front * 100) / 100} ${Math.round(headY * 100) / 100})`}
          style={{ opacity: Math.round(clamp01((1 - draw.t) / 0.08) * 100) / 100 }}
        >
          <g filter={filterUrl(FILTER_IDS.glow)}>
            <circle r={6} fill="currentColor" />
          </g>
        </g>
      )}
    </g>
  );
}
