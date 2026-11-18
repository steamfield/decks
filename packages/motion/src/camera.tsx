import { useSlide } from "@react-decks/runtime";
import { type ReactNode, useLayoutEffect, useRef } from "react";
import styles from "./camera.module.css";
import { shouldTweenStep, stepIndex } from "./stepped";
import { duration, ease, gsap } from "./tokens";

export interface CameraStop {
  readonly x: number;
  readonly y: number;
  readonly zoom: number;
}

export function Camera({
  stops,
  at,
  children,
}: {
  stops: readonly CameraStop[];
  at: number;
  children?: ReactNode;
}): ReactNode {
  const { clicks, isActive, renderContext } = useSlide();
  const viewport = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const previous = useRef(-1);
  const visible = useRef({ x: 0, y: 0, zoom: 1 });
  for (const [index, stop] of stops.entries()) {
    for (const key of ["x", "y"] as const) {
      if (!Number.isFinite(stop[key]))
        throw new Error(`Camera stops[${index}].${key} must be finite, got ${stop[key]}`);
    }
    if (!Number.isFinite(stop.zoom) || stop.zoom <= 0)
      throw new Error(`Camera stops[${index}].zoom must be finite and positive, got ${stop.zoom}`);
  }
  const stop = stops[stepIndex(clicks, at, stops.length)];
  if (!stop) throw new Error("Camera stops must contain at least one stop, got []");
  const { x, y, zoom } = stop;
  useLayoutEffect(() => {
    const box = viewport.current;
    const inner = layer.current;
    if (!box || !inner) return;
    const pose = visible.current;
    let width = box.clientWidth;
    let height = box.clientHeight;
    const paint = () => {
      const dx = width / 2 - pose.x * pose.zoom;
      const dy = height / 2 - pose.y * pose.zoom;
      inner.style.transform = `translate(${dx}px, ${dy}px) scale(${pose.zoom})`;
    };
    const land = () => {
      Object.assign(pose, { x, y, zoom });
      paint();
    };
    const animate = shouldTweenStep(previous.current, clicks, isActive, renderContext);
    previous.current = clicks;
    let tween: gsap.core.Tween | undefined;
    if (animate && (pose.x !== x || pose.y !== y || pose.zoom !== zoom)) {
      tween = gsap.to(pose, {
        x,
        y,
        zoom,
        duration: duration.slow,
        ease: ease.settle,
        onUpdate: paint,
        onComplete: land,
      });
    } else land();
    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(([entry]) => {
            if (!entry) return;
            ({ width, height } = entry.contentRect);
            paint();
          });
    observer?.observe(box);
    return () => {
      tween?.kill();
      observer?.disconnect();
    };
  }, [x, y, zoom, clicks, isActive, renderContext]);
  return (
    <div ref={viewport} className={styles.viewport}>
      <div ref={layer}>{children}</div>
    </div>
  );
}
