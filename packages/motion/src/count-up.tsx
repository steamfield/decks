import { useSlide } from "@react-decks/runtime";
import { useLayoutEffect, useRef } from "react";
import { useStepState } from "./steps";
import { duration, ease, gsap, motionMode } from "./tokens";
import { useTween } from "./use-tween";

const numberFormat = new Intl.NumberFormat();
const defaultFormat = (value: number) => numberFormat.format(Math.round(value));

export function CountUp({
  at,
  from = 0,
  to,
  format = defaultFormat,
}: {
  at: number;
  from?: number;
  to: number;
  format?: (value: number) => string;
}) {
  const state = useStepState(at);
  const { isActive, renderContext } = useSlide();
  const value = useTween({ number: state === "before" ? from : to });
  const previous = useRef(state);
  useLayoutEffect(() => {
    const animate =
      previous.current === "before" &&
      state === "current" &&
      isActive &&
      renderContext === "slide" &&
      motionMode() === "live";
    previous.current = state;
    if (!animate) {
      value.number = state === "before" ? from : to;
      return;
    }
    const tween = gsap.to(value, { number: to, duration: duration.slow, ease: ease.settle });
    return () => {
      tween.kill();
    };
  }, [state, from, to, isActive, renderContext, value]);
  return (
    <span
      data-step-state={state}
      data-step-enter="fade"
      data-step-exit="fade"
      style={{ opacity: 1, visibility: "visible" }}
    >
      <span className="rd-visually-hidden">{format(state === "before" ? from : to)}</span>
      <span aria-hidden="true">{format(state === "before" ? from : value.number)}</span>
    </span>
  );
}
