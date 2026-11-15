import { gsap, useTimeline } from "@react-decks/motion";
import { useSlide } from "@react-decks/runtime";
import { useLayoutEffect, useRef } from "react";
import { afterTransition } from "./after-transition";
import { prefersReducedMotion } from "./timeline-position";

/** Build after child refs exist; entrance and beats share that mount order. */
export function useStageEntrance(
  build: (tl: gsap.core.Timeline) => void,
  opts: { beats?: (tl: gsap.core.Timeline, beat: (n: number) => void) => void } = {},
): void {
  const { clicks, isActive, renderContext } = useSlide();
  const entrance = useRef<gsap.core.Timeline | null>(null);
  const builder = useRef(build);
  const beatBuilder = useRef(opts.beats);
  const wasActive = useRef(false);
  useLayoutEffect(() => {
    const tl = gsap.timeline({ paused: true });
    try {
      builder.current(tl);
    } catch (error) {
      tl.kill();
      throw error;
    }
    entrance.current = tl;
    return () => {
      tl.kill();
      entrance.current = null;
      wasActive.current = false;
    };
  }, []);
  useLayoutEffect(() => {
    const tl = entrance.current;
    if (!tl) return;
    const arriving = !wasActive.current;
    wasActive.current = isActive;
    if (renderContext !== "slide" || prefersReducedMotion()) tl.progress(1).pause();
    else if (!isActive) tl.pause(0);
    else if (clicks > 0) tl.progress(1).pause();
    else if (arriving) {
      tl.pause(0);
      return afterTransition(() => {
        tl.play(0);
      });
    }
  }, [clicks, isActive, renderContext]);
  useTimeline((tl, beat) => {
    if (beatBuilder.current) beatBuilder.current(tl, beat);
    else beat(0);
  });
}
