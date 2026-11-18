import { useSlide } from "@react-decks/runtime";
import { type ReactNode, useLayoutEffect, useRef } from "react";
import { MorphSVGPlugin } from "./plugins";
import { shouldTweenStep, stepIndex } from "./stepped";
import { duration, ease, gsap } from "./tokens";

function hasDrawableSegment(d: string): boolean {
  return d.trim().length > 0 && MorphSVGPlugin.stringToRawPath(d).length > 0;
}

export function ShapeMorph({ paths, at }: { paths: readonly string[]; at: number }): ReactNode {
  const { clicks, isActive, renderContext } = useSlide();
  const ref = useRef<SVGPathElement>(null);
  const previous = useRef(-1);
  const d = paths[stepIndex(clicks, at, paths.length)];
  if (d === undefined) throw new Error("ShapeMorph paths must contain at least one path, got []");
  useLayoutEffect(() => {
    const path = ref.current;
    if (!path) return;
    const animate = shouldTweenStep(previous.current, clicks, isActive, renderContext);
    previous.current = clicks;
    const visible = path.getAttribute("d");
    if (visible === d) return;
    if (!animate || !hasDrawableSegment(visible ?? "") || !hasDrawableSegment(d)) {
      path.setAttribute("d", d);
      return;
    }
    const tween = gsap.to(path, { morphSVG: d, duration: duration.slow, ease: ease.settle });
    return () => {
      tween.kill();
    };
  }, [d, clicks, isActive, renderContext]);
  return <path ref={ref} />;
}
