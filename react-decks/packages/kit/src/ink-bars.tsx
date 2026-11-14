import { type gsap, motionMode, useTween } from "@react-decks/motion";
import { useSlide } from "@react-decks/runtime";
import { type Ref, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { brushRibbon } from "./brush";
import { DUR, easedStagger } from "./easings";
import { FILTER_IDS, filterUrl } from "./filters";
import { inkStyle } from "./ink-style";
import type { InkStep } from "./ramps";
import { clamp01, stackEndLabels } from "./scales";
import { ink } from "./theme";
import type { Hue } from "./theme-resolve";
import { resolvePosition } from "./timeline";

export interface InkBarRow {
  id: string;
  label: string;
  value: number;
  text?: string;
  hue?: Hue;
  step?: InkStep;
}

/** Append to caller-owned timelines managed by useStage or useTimeline. */
export interface GrowHandle {
  addGrow(tl: gsap.core.Timeline, at?: gsap.Position): gsap.core.Timeline;
}

interface RowState {
  y: number;
  len: number;
  reveal: number;
  opacity: number;
  accent: number;
  label: string;
  text: string;
  accentColor: string;
  base: string;
}

export interface BarsHandle extends GrowHandle {
  readonly labelLeft: number;
  readonly state: Record<string, RowState>;
  addGrow(
    tl: gsap.core.Timeline,
    at?: gsap.Position,
    opts?: { spread?: number },
  ): gsap.core.Timeline;
  addReorder(
    tl: gsap.core.Timeline,
    next: InkBarRow[],
    domain?: [number, number],
    at?: gsap.Position,
    opts?: { spread?: number },
  ): gsap.core.Timeline;
  addExit(tl: gsap.core.Timeline, ids: string[], at?: gsap.Position): gsap.core.Timeline;
  addRecolor(
    tl: gsap.core.Timeline,
    id: string,
    color: string,
    at?: gsap.Position,
  ): gsap.core.Timeline;
}

export function InkBars({
  rows,
  domain,
  xRange,
  yBand,
  thickness = 24,
  sort = "none",
  labelWidth = 460,
  labelGap = 40,
  format = String,
  hue = "emerald",
  step = 3,
  seed = "ink-bars",
  ref,
}: {
  rows: InkBarRow[];
  domain: [number, number];
  xRange: [number, number];
  yBand: [number, number];
  thickness?: number;
  sort?: "none" | "asc" | "desc";
  labelWidth?: number;
  labelGap?: number;
  format?: (value: number) => string;
  hue?: Hue;
  step?: InkStep;
  seed?: string;
  ref?: Ref<BarsHandle>;
}) {
  const { isActive, renderContext } = useSlide();
  const settled = !isActive || renderContext !== "slide" || motionMode() === "instant";
  const driven = useRef(false);
  const revision = useTween({ value: 0 });
  const animations = useRef(new Set<gsap.core.Animation>());
  useLayoutEffect(() => {
    const owned = animations.current;
    return () => {
      for (const animation of owned) animation.kill();
      owned.clear();
    };
  }, []);
  const labelFor = (row: InkBarRow) => row.text ?? format(row.value);
  function layoutFor(next: InkBarRow[], nextDomain: [number, number]) {
    const sorted = [...next];
    if (sort === "asc") sorted.sort((a, b) => a.value - b.value);
    if (sort === "desc") sorted.sort((a, b) => b.value - a.value);
    const pitch = sorted.length ? (yBand[1] - yBand[0]) / sorted.length : 0;
    return Object.fromEntries(
      sorted.map((row, i) => [
        row.id,
        {
          y: yBand[0] + pitch * (i + 0.5),
          len:
            ((Math.max(nextDomain[0], Math.min(nextDomain[1], row.value)) - nextDomain[0]) /
              (nextDomain[1] - nextDomain[0] || 1)) *
            (xRange[1] - xRange[0]),
        },
      ]),
    );
  }
  const [state] = useState<Record<string, RowState>>(() => {
    const layout = layoutFor(rows, domain);
    return Object.fromEntries(
      rows.flatMap((row) => {
        const slot = layout[row.id];
        if (!slot) return [];
        const base = ink(row.hue ?? hue, row.step ?? step);
        return [
          [
            row.id,
            new Proxy(
              {
                ...slot,
                reveal: 0,
                opacity: 1,
                accent: 0,
                label: row.label,
                text: labelFor(row),
                accentColor: base,
                base,
              },
              {
                set(target, key, value) {
                  const previous = Reflect.get(target, key);
                  const written = Reflect.set(target, key, value);
                  if (key !== "_gsap" && previous !== value) {
                    driven.current = true;
                    revision.value++;
                  }
                  return written;
                },
              },
            ),
          ],
        ];
      }),
    );
  });
  const [order] = useState(() => rows.map((row) => row.id));
  function track(tl: gsap.core.Timeline) {
    const recent = tl.recent();
    if (typeof recent !== "function") animations.current.add(recent);
    return tl;
  }
  useImperativeHandle(ref, () => ({
    labelLeft: xRange[0] - labelGap - labelWidth,
    get state() {
      driven.current = true;
      revision.value++;
      return state;
    },
    addGrow(tl, position, { spread = 0 } = {}) {
      driven.current = true;
      revision.value++;
      const at = resolvePosition(tl, position ?? ">");
      order.forEach((id, i) => {
        const row = state[id];
        if (!row) return;
        track(
          tl.to(
            row,
            { reveal: 1, opacity: 1, duration: DUR.grow, lazy: false },
            at + easedStagger(i, order.length, spread),
          ),
        );
      });
      return tl;
    },
    addReorder(tl, next, nextDomain = domain, position, { spread = 0 } = {}) {
      const target = layoutFor(next, nextDomain);
      const at = resolvePosition(tl, position ?? ">");
      const surviving = next.filter((row) => target[row.id] && state[row.id]);
      surviving.forEach((row, i) => {
        const slot = target[row.id];
        const current = state[row.id];
        if (!slot || !current) return;
        const start = at + easedStagger(i, surviving.length, spread);
        track(tl.set(current, { text: labelFor(row), label: row.label }, start));
        track(tl.to(current, { y: slot.y, len: slot.len, duration: DUR.scale }, start));
      });
      return tl;
    },
    addExit(tl, ids, position) {
      const at = resolvePosition(tl, position ?? `+=${DUR.eraseDelay}`);
      for (const id of ids) {
        const row = state[id];
        if (row) track(tl.to(row, { opacity: 0, duration: DUR.opacity }, at));
      }
      return tl;
    },
    addRecolor(tl, id, color, position) {
      const row = state[id];
      if (!row) return tl;
      const at = resolvePosition(tl, position ?? ">");
      track(tl.set(row, { accentColor: color }, at));
      return track(tl.to(row, { accent: 1, duration: DUR.color }, at));
    },
  }));
  const live = order.flatMap((id) => {
    const row = state[id];
    if (!row) return [];
    const visible = settled && !driven.current ? { ...row, reveal: 1 } : row;
    return visible.opacity > 0 && visible.reveal > 0 ? [{ id, row: visible }] : [];
  });
  const stacked = stackEndLabels(
    live.map(({ row }) => ({ y: row.y, h: thickness })),
    thickness * 0.5,
  );
  return (
    <g className="od-ink-bars">
      {live.map(({ id, row }, i) => {
        const drawn = row.len * clamp01(row.reveal);
        const color =
          row.accent > 0
            ? `color-mix(in oklab, ${row.accentColor} ${row.accent * 100}%, ${row.base})`
            : row.base;
        const dabs =
          inkStyle() === "marker"
            ? brushRibbon(
                [
                  { x: xRange[0], y: row.y },
                  { x: xRange[0] + Math.max(drawn, 1), y: row.y },
                ],
                {
                  seed: `${seed}:${id}`,
                  width: thickness,
                  taperIn: 0.04,
                  taperOut: 0.07,
                  startWidth: 0.82,
                  endWidth: 0.66,
                  wobble: 1.6,
                  edge: 0.9,
                  samples: 16,
                },
              )
            : [];
        return (
          <g key={id} style={{ color, opacity: row.opacity }}>
            <text
              className="od-stage-label"
              x={xRange[0] - labelGap}
              y={row.y + thickness * 0.36}
              textAnchor="end"
            >
              {row.label}
            </text>
            {inkStyle() === "clean" ? (
              <rect
                x={xRange[0]}
                y={row.y - thickness / 2}
                width={Math.max(drawn, 1)}
                height={thickness}
                rx={3}
                fill="currentColor"
                filter={filterUrl(FILTER_IDS.glow)}
              />
            ) : (
              <g filter={filterUrl(FILTER_IDS.marker)}>
                {dabs.map((dab) => (
                  <path key={dab.d} d={dab.d} fill="currentColor" fillOpacity={dab.fillOpacity} />
                ))}
                {dabs
                  .filter((dab) => dab.overpaint !== undefined)
                  .map((dab) => (
                    <path
                      key={`over:${dab.d}`}
                      d={dab.d}
                      fill="currentColor"
                      fillOpacity={dab.overpaint}
                    />
                  ))}
              </g>
            )}
            <text
              className="od-bars-value"
              x={xRange[0] + drawn + thickness * 0.7}
              y={(stacked[i] ?? row.y) + thickness * 0.36}
              textAnchor="start"
            >
              {row.text}
            </text>
          </g>
        );
      })}
    </g>
  );
}
