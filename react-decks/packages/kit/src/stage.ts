import { gsap, motionMode, useTimeline } from "@react-decks/motion";
import { useSlide } from "@react-decks/runtime";
import { useLayoutEffect, useRef } from "react";
import { afterTransition } from "./after-transition";
import { useScriptedDemo } from "./scripted-demo";

export function useStage<C extends { lead: string; body?: string }>({
  copy,
  enter,
  beats,
}: {
  copy: readonly C[];
  enter?: (tl: gsap.core.Timeline) => void;
  beats: (tl: gsap.core.Timeline, beat: (n: number) => void) => void;
}) {
  const demo = useScriptedDemo();
  const { clicks, isActive } = demo;
  const { renderContext } = useSlide();
  const entrance = useRef<gsap.core.Timeline | null>(null);
  const builder = useRef(enter);
  const wasActive = useRef(false);
  useLayoutEffect(() => {
    const tl = gsap.timeline({ paused: true });
    builder.current?.(tl);
    entrance.current = tl;
    return () => {
      tl.kill();
    };
  }, []);
  useLayoutEffect(() => {
    const tl = entrance.current;
    if (!tl) return;
    const arriving = !wasActive.current;
    wasActive.current = isActive;
    if (renderContext !== "slide" || motionMode() === "instant") tl.progress(1).pause();
    else if (!isActive) tl.pause(0);
    else if (clicks > 0) tl.progress(1).pause();
    else if (arriving) {
      tl.pause(0);
      return afterTransition(() => {
        tl.play(0);
      });
    }
  }, [clicks, isActive, renderContext]);
  useTimeline(beats);
  const card = copy[Math.min(Math.max(clicks, 0), copy.length - 1)];
  if (!card) throw new Error("useStage needs at least one copy entry");
  return { ...demo, copy: card, beats: copy.length };
}
