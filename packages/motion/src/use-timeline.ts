import { useSlide } from "@react-decks/runtime";
import { type DependencyList, useLayoutEffect, useRef } from "react";
import { shouldTweenStep } from "./stepped";
import { gsap } from "./tokens";

export function useTimeline(
  build: (tl: gsap.core.Timeline, beat: (n: number) => void) => void,
  deps: DependencyList = [],
): void {
  const { clicks, isActive, renderContext } = useSlide();
  const state = useRef<{
    tl: gsap.core.Timeline;
    current: number;
    last: number;
    tween: gsap.core.Tween | null;
  } | null>(null);
  const builder = useRef(build);
  useLayoutEffect(() => {
    builder.current = build;
  });
  useLayoutEffect(() => {
    const tl = gsap.timeline({ paused: true });
    let last = -1;
    try {
      builder.current(tl, (n) => {
        if (n !== last + 1 || (n === 0 && tl.getChildren().length > 0)) {
          throw new Error(`Invalid label beat${n}; expected beat${last + 1} first`);
        }
        tl.addLabel(`beat${n}`);
        last = n;
      });
      if (last < 0) throw new Error("Missing label beat0");
    } catch (error) {
      tl.kill();
      throw error;
    }
    const built: NonNullable<typeof state.current> = { tl, current: -1, last, tween: null };
    state.current = built;
    return () => {
      built.tween?.kill();
      tl.kill();
      state.current = null;
    };
  }, [...deps]);
  useLayoutEffect(() => {
    const s = state.current;
    if (!s) return;
    const target = Math.min(clicks, s.last);
    const label = `beat${target}`;
    const interrupted = s.tween !== null && s.tween.progress() < 1;
    const rate = Math.abs(s.tl.timeScale()) || 1;
    const previousTime = s.tl.labels[`beat${Math.min(s.current, s.last)}`] ?? 0;
    const targetTime = s.tl.labels[label] ?? 0;
    const stepDuration = Math.abs(targetTime - previousTime) / rate;
    const remaining = Math.abs(targetTime - s.tl.time()) / rate;
    s.tween?.kill();
    s.tween = null;
    if (shouldTweenStep(s.current, clicks, isActive, renderContext)) {
      s.tween = s.tl.tweenTo(label, {
        ease: "none",
        overwrite: true,
        ...(interrupted && stepDuration > 0 ? { duration: Math.min(remaining, stepDuration) } : {}),
      });
    } else s.tl.seek(label, false);
    s.current = clicks;
  }, [clicks, isActive, renderContext, ...deps]);
}
