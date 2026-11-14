import { type gsap, motionMode, useTween } from "@react-decks/motion";
import { useSlide } from "@react-decks/runtime";
import {
  type Ref,
  useImperativeHandle,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { brushRibbon } from "./brush";
import { DRAW, DUR } from "./easings";
import { FILTER_IDS, filterUrl } from "./filters";
import { inkStyle, STROKE } from "./ink-style";
import type { InkStep } from "./ramps";
import { xScale } from "./scales";
import { ink } from "./theme";
import type { Hue } from "./theme-resolve";

export interface TimelineTick {
  id: string;
  at: number;
  label: string;
  bright?: boolean;
  projected?: boolean;
}
export interface TickState {
  ink: number;
  lift: number;
}
/** Append to caller-owned timelines managed by useStage or useTimeline. */
export interface TimelineHandle {
  readonly state: TickState[];
  addInk(tl: gsap.core.Timeline, position?: gsap.Position): gsap.core.Timeline;
  addLift(tl: gsap.core.Timeline, id: string, position?: gsap.Position): gsap.core.Timeline;
  tickX(id: string): number;
}

export function InkTimeline({
  ticks,
  domain,
  range,
  y,
  hue = "cyan",
  step = 2,
  brightStep = 4,
  tickHeight = 74,
  tickWidth = STROKE.tick,
  labelGap = 14,
  labelOffset = 46,
  rowHeight = 38,
  labelSize = 26,
  labelRows = 4,
  state,
  ref,
}: {
  ticks: TimelineTick[];
  domain: [number, number];
  range: [number, number];
  y: number;
  hue?: Hue;
  step?: InkStep;
  brightStep?: InkStep;
  tickHeight?: number;
  tickWidth?: number;
  labelGap?: number;
  labelOffset?: number;
  rowHeight?: number;
  labelSize?: number;
  labelRows?: number;
  state?: TickState[];
  ref?: Ref<TimelineHandle>;
}) {
  const [, refresh] = useReducer((n: number) => n + 1, 0);
  const { isActive, renderContext } = useSlide();
  const settled = !isActive || renderContext !== "slide" || motionMode() === "instant";
  const driven = useRef(false);
  const revision = useTween({ value: 0 });
  const [own] = useState(() =>
    ticks.map(
      () =>
        new Proxy(
          { ink: 0, lift: 0 },
          {
            set(target, key, value) {
              const previous = Reflect.get(target, key);
              const written = Reflect.set(target, key, value);
              if ((key === "ink" || key === "lift") && previous !== value) {
                driven.current = true;
                revision.value++;
              }
              return written;
            },
          },
        ),
    ),
  );
  const beats = state ?? own;
  const animations = useRef(new Set<gsap.core.Animation>());
  useLayoutEffect(() => {
    const owned = animations.current;
    return () => {
      for (const animation of owned) animation.kill();
      owned.clear();
    };
  }, []);
  const sx = xScale(domain, range);
  useImperativeHandle(ref, () => ({
    get state() {
      driven.current = true;
      revision.value++;
      return own;
    },
    addInk(tl, position) {
      driven.current = true;
      revision.value++;
      tl.to(
        beats,
        {
          ink: 1,
          duration: DUR.draw,
          ease: DRAW,
          stagger: DUR.tick,
          lazy: false,
          onUpdate: refresh,
        },
        position,
      );
      const recent = tl.recent();
      if (typeof recent !== "function") animations.current.add(recent);
      return tl;
    },
    addLift(tl, id, position) {
      const index = ticks.findIndex((tick) => tick.id === id);
      const target = beats[index];
      if (!target) return tl;
      tl.to(target, { lift: 1, duration: DUR.morph, onUpdate: refresh }, position);
      const recent = tl.recent();
      if (typeof recent !== "function") animations.current.add(recent);
      return tl;
    },
    tickX(id) {
      return sx(ticks.find((tick) => tick.id === id)?.at ?? domain[0]);
    },
  }));
  const rowRight = new Array<number>(Math.max(1, labelRows)).fill(-Infinity);
  const rowOf = new Map<number, number>();
  const ordered = ticks
    .map((tick, index) => ({ tick, index, x: sx(tick.at) }))
    .sort((a, b) => a.x - b.x || a.index - b.index);
  for (const { tick, index, x } of ordered) {
    const half = (tick.label.length * labelSize * 0.6) / 2;
    let row = rowRight.findIndex((right) => x - half >= right + labelGap);
    if (row < 0) row = rowRight.indexOf(Math.min(...rowRight));
    rowRight[row] = x + half;
    rowOf.set(index, row);
  }
  return (
    <g className="od-ink-timeline">
      <line
        className="od-tl-rule"
        x1={range[0] - 40}
        x2={range[1] + 40}
        y1={y}
        y2={y}
        stroke={ink("slate", 1)}
        strokeWidth={STROKE.rule}
        strokeOpacity={0.55}
      />
      {ticks.map((tick, index) => {
        const x = sx(tick.at);
        const row = rowOf.get(index) ?? 0;
        const top = y - tickHeight * (tick.bright ? 1 : 0.66);
        const foot = y + tickWidth * 2;
        const labelY = y + labelOffset + row * rowHeight;
        const beat =
          !state && settled && !driven.current
            ? { ink: 1, lift: own[index]?.lift ?? 0 }
            : (beats[index] ?? { ink: 0, lift: 0 });
        const dabs =
          inkStyle() === "clean"
            ? []
            : brushRibbon(
                [
                  { x, y: foot },
                  { x, y: top },
                ],
                {
                  seed: `ink-timeline:${tick.id}`,
                  width: tickWidth * 3,
                  taperIn: 0.08,
                  taperOut: 0.3,
                  startWidth: 0.8,
                  endWidth: 0.3,
                  wobble: 1.8,
                  edge: 1.1,
                  samples: 11,
                },
              );
        return (
          <g
            key={tick.id}
            style={{ color: ink(hue, tick.bright ? brightStep : step), opacity: beat.ink }}
          >
            <g
              style={{
                opacity: 1 - beat.lift,
                transformOrigin: `${x}px ${y}px`,
                transform: `scale(${1 - 0.75 * beat.lift})`,
              }}
            >
              {inkStyle() === "clean" ? (
                <line
                  x1={x}
                  x2={x}
                  y1={foot}
                  y2={top}
                  stroke="currentColor"
                  strokeWidth={tickWidth}
                  strokeLinecap="round"
                  strokeDasharray={tick.projected ? `0 ${tickWidth * 2.5}` : undefined}
                  filter={tick.bright ? filterUrl(FILTER_IDS.glow) : undefined}
                />
              ) : (
                <g filter={filterUrl(FILTER_IDS.dry)}>
                  {dabs.map((dab) => (
                    <path
                      key={dab.d}
                      d={dab.d}
                      fill="currentColor"
                      style={{ fillOpacity: dab.fillOpacity }}
                    />
                  ))}
                </g>
              )}
            </g>
            {row > 0 && (
              <line
                x1={x}
                x2={x}
                y1={foot}
                y2={labelY - labelSize}
                stroke="currentColor"
                strokeWidth={1}
                strokeOpacity={0.45}
              />
            )}
            <text
              className={`od-stage-label${tick.bright ? " is-end" : ""}`}
              x={x}
              y={labelY}
              textAnchor="middle"
              style={{ fontSize: `${labelSize}px` }}
            >
              {tick.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}
