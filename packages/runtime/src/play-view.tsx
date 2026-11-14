import { type ReactElement, useEffect } from "react";
import { useDeckContext, useDeckSelector } from "./hooks";
import { SlideFrame } from "./slide-frame";
import { SlideHost } from "./slide-host";
import "./play-view.css";

export function PlayView(): ReactElement {
  const { source, modules } = useDeckContext();
  const slide = useDeckSelector((state) => state.nav.slide);
  useEffect(() => {
    const preload = () => {
      for (const module of modules.values())
        void module.load().catch(() => {
          // SlideHost reports the failure if this slide is mounted.
        });
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(preload);
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(preload, 0);
    return () => window.clearTimeout(id);
  }, [modules]);
  return (
    <div className="rd-play-view">
      <SlideFrame main>
        {source.manifest.slides
          .filter(({ no }) => Math.abs(no - slide) <= 1)
          .map(({ no }) => (
            <SlideHost key={no} no={no} context="slide" />
          ))}
      </SlideFrame>
    </div>
  );
}
