import { gsap, motionMode, useTween } from "@react-decks/motion";
import { useSlide } from "@react-decks/runtime";
import { type Ref, useImperativeHandle, useLayoutEffect, useRef } from "react";
import { DUR } from "./easings";
import type { InkStep } from "./ramps";
import { ink } from "./theme";
import type { Hue } from "./theme-resolve";
import { resolvePosition } from "./timeline";

export interface GrowHandle {
  addGrow(tl: gsap.core.Timeline, position?: gsap.Position): gsap.core.Timeline;
}

export function InkNumber({
  value,
  label = "",
  hue = "emerald",
  step = 3,
  size = 6.4,
  count = true,
  prefix = "",
  suffix = "",
  ref,
}: {
  value: string;
  label?: string;
  hue?: Hue;
  step?: InkStep;
  size?: number;
  count?: boolean;
  prefix?: string;
  suffix?: string;
  ref?: Ref<GrowHandle>;
}) {
  const { isActive, renderContext } = useSlide();
  // Grouping belongs to the input, and must survive every frame of a count-up.
  const bare = value.replace(/,/g, "");
  const numeric = Number(bare);
  const countable = count && bare.trim() !== "" && Number.isFinite(numeric);
  const places = value.includes(".") ? value.length - value.indexOf(".") - 1 : 0;
  const state = useTween({ n: 0, grow: 0 });
  const registered = useRef(false);
  useLayoutEffect(() => {
    if (!isActive || renderContext !== "slide" || motionMode() === "instant") {
      state.n = countable ? numeric : 0;
      state.grow = 1;
    }
  }, [isActive, renderContext, state, countable, numeric]);
  useLayoutEffect(
    () => () => {
      gsap.killTweensOf(state);
      registered.current = false;
    },
    [state],
  );
  useImperativeHandle(
    ref,
    () => ({
      addGrow(tl, position) {
        const at = resolvePosition(tl, position ?? ">");
        // A static standalone figure starts settled; its first caller takes over the clock.
        if (!registered.current) {
          state.grow = 0;
          state.n = 0;
          registered.current = true;
        }
        tl.to(
          state,
          {
            grow: 1,
            ...(countable ? { n: numeric } : {}),
            duration: DUR.grow,
          },
          at,
        );
        return tl;
      },
    }),
    [state, countable, numeric],
  );
  const shown = !countable
    ? value
    : value.includes(",")
      ? state.n.toLocaleString("en-US", {
          minimumFractionDigits: places,
          maximumFractionDigits: places,
        })
      : state.n.toFixed(places);
  return (
    <div className="od-bignum">
      <div
        className="od-bignum-figure"
        style={{
          color: ink(hue, step),
          fontSize: `calc(${size} * var(--sw))`,
          opacity: state.grow,
          transform: countable ? "none" : `scaleY(${0.3 + 0.7 * state.grow})`,
        }}
      >
        {prefix && <span>{prefix}</span>}
        {shown}
        {suffix && <span>{suffix}</span>}
      </div>
      {label && (
        <div className="od-bignum-label" style={{ opacity: state.grow }}>
          {label}
        </div>
      )}
    </div>
  );
}
