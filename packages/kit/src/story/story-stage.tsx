import { gsap, motionMode } from "@react-decks/motion";
import { useSlide } from "@react-decks/runtime";
import { type CSSProperties, type ReactNode, useId, useLayoutEffect, useRef } from "react";
import { DUR, SETTLE } from "../theme/easings";
import { FILTER_IDS, filterUrl, StoryDefs } from "../theme/filters";
import { afterTransition } from "./after-transition";

export const STAGE = { width: 1920, height: 1080 } as const;

export function StoryStage({
  beats = 1,
  click = 0,
  stage,
  overlay,
  card,
  background,
  fluid = false,
  enterAfterTransition = false,
  className = "",
}: {
  beats?: number;
  click?: number;
  stage?: ReactNode;
  overlay?: ReactNode;
  card?: ReactNode;
  background?: ReactNode;
  fluid?: boolean;
  enterAfterTransition?: boolean;
  className?: string;
}) {
  const { isActive, renderContext } = useSlide();
  const root = useRef<HTMLDivElement>(null);
  const prefix = useId();
  const currentClick = useRef(click);
  const entry = useRef<gsap.core.Timeline | null>(null);
  const styles: CSSProperties = Object.fromEntries(
    Object.entries(FILTER_IDS).map(([name, id]) => [
      `--od-filter-${name}`,
      filterUrl(`${prefix}-${id}`),
    ]),
  );
  useLayoutEffect(() => {
    currentClick.current = click;
  }, [click]);
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const groups = [
      ".od-story-head, .od-enter-a",
      ".od-enter-b",
      ".od-story-card, .od-enter-c",
      ".od-story-foot",
    ].map((selector) => Array.from(el.querySelectorAll(selector)));
    const all = groups.flat();
    const rest = () => gsap.set(all, { clearProps: "opacity,transform" });
    entry.current?.kill();
    rest();
    if (
      !isActive ||
      renderContext !== "slide" ||
      currentClick.current > 0 ||
      motionMode() === "instant"
    )
      return;
    const transitioning = document.documentElement.hasAttribute("data-deck-transition");
    if (transitioning && !enterAfterTransition) return;
    const named = (element: Element) => {
      const name = getComputedStyle(element).getPropertyValue("view-transition-name").trim();
      return name !== "" && name !== "none";
    };
    const held = transitioning
      ? groups.map((group) =>
          group.filter(
            (element) =>
              !named(element) &&
              !Array.from(
                element.querySelectorAll('[class*="vt-"], .od-story-head, .od-story-card'),
              ).some(named),
          ),
        )
      : groups;
    if (transitioning) gsap.set(held.flat(), { opacity: 0 });
    const cancel = afterTransition(() => {
      if (currentClick.current > 0) {
        rest();
        return;
      }
      const tl = gsap.timeline();
      entry.current = tl;
      let at = 0;
      for (const group of held) {
        if (!group.length) continue;
        tl.fromTo(
          group,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: DUR.morph, ease: SETTLE, clearProps: "transform" },
          at,
        );
        at += DUR.opacity;
      }
    });
    return () => {
      cancel();
      entry.current?.kill();
      rest();
    };
  }, [isActive, renderContext, enterAfterTransition]);
  useLayoutEffect(() => {
    if (click <= 0 || !root.current) return;
    entry.current?.progress(1).pause();
  }, [click]);
  return (
    <div
      ref={root}
      className={`od-slide is-story${renderContext === "slide" ? " vt-on" : ""}${fluid ? " is-fluid" : ""} ${className}`}
      style={styles}
    >
      {background && (
        <div className="od-stage-background" aria-hidden="true">
          {background}
        </div>
      )}
      <div className="od-story-frame">
        <svg
          className="od-stage"
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <StoryDefs prefix={prefix} />
          {stage}
        </svg>
        <div className="od-stage-overlay">
          {overlay}
          {card}
        </div>
        {beats > 1 && (
          <footer className="od-story-foot">
            {Array.from({ length: beats }, (_, i) => ({ id: `beat${i}`, i })).map(({ id, i }) => (
              <span
                key={id}
                className={`od-beat${i <= click ? " is-done" : ""}${i === click ? " is-current" : ""}`}
              />
            ))}
          </footer>
        )}
      </div>
    </div>
  );
}
