import { gsap, motionMode } from "@react-decks/motion";
import { useSlide } from "@react-decks/runtime";
import { type Ref, useImperativeHandle, useLayoutEffect, useRef } from "react";
import { brushRibbon } from "../geometry/brush";
import { DRAW, DUR } from "../theme/easings";
import { FILTER_IDS, filterUrl } from "../theme/filters";
import type { InkStep } from "../theme/theme";
import { ink } from "../theme/theme";
import type { Hue } from "../theme/theme-resolve";
import { inkStyle, STROKE } from "./ink-style";

export interface RuleHandle {
  readonly root: SVGGElement | null;
  addDraw(tl: gsap.core.Timeline, position?: gsap.Position): gsap.core.Timeline;
}

export function InkRule({
  x1,
  x2,
  y,
  hue = "slate",
  step = 1,
  width = 2.6,
  seed = "ink-rule",
  opacity = 0.55,
  ref,
}: {
  x1: number;
  x2: number;
  y: number;
  hue?: Hue;
  step?: InkStep;
  width?: number;
  seed?: string;
  opacity?: number;
  ref?: Ref<RuleHandle>;
}) {
  const root = useRef<SVGGElement>(null);
  const { isActive, renderContext } = useSlide();
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (!isActive || renderContext !== "slide" || motionMode() === "instant")
      gsap.set(el, { clipPath: "inset(0 0% 0 0)" });
  }, [isActive, renderContext]);
  useLayoutEffect(() => {
    const el = root.current;
    return () => {
      if (el) gsap.killTweensOf(el);
    };
  }, []);
  useImperativeHandle(
    ref,
    () => ({
      get root() {
        return root.current;
      },
      addDraw(tl, position) {
        return tl.fromTo(
          root.current,
          { clipPath: "inset(0 100% 0 0)" },
          { clipPath: "inset(0 0% 0 0)", duration: DUR.draw, ease: DRAW },
          position,
        );
      },
    }),
    [],
  );
  const clean = inkStyle() === "clean";
  const dabs = clean
    ? []
    : brushRibbon(
        [
          { x: x1, y },
          { x: x2, y },
        ],
        {
          seed: `${seed}:${y}`,
          width,
          taperIn: 0.02,
          taperOut: 0.02,
          startWidth: 0.7,
          endWidth: 0.7,
          wobble: 0.7,
          edge: 0.4,
        },
      );
  return (
    <g ref={root} className="od-ink-rule" style={{ color: ink(hue, step), opacity }}>
      {clean ? (
        <line
          x1={x1}
          x2={x2}
          y1={y}
          y2={y}
          stroke="currentColor"
          strokeWidth={STROKE.rule}
          strokeLinecap="round"
        />
      ) : (
        <g filter={filterUrl(FILTER_IDS.rule)}>
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
  );
}
