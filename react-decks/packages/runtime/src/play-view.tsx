import { type ReactElement, useEffect } from "react";
import { tinykeys } from "tinykeys";
import { useDeckContext, useDeckSelector } from "./hooks";
import { SlideFrame } from "./slide-frame";
import { SlideHost } from "./slide-host";
import "./play-view.css";

export function PlayView(): ReactElement {
  const { source, store, modules } = useDeckContext();
  const slide = useDeckSelector((state) => state.nav.slide);
  const total = source.manifest.slides.length;
  useEffect(() => {
    function bind(action: Parameters<typeof store.dispatch>[0]) {
      return (event: KeyboardEvent) => {
        event.preventDefault();
        store.dispatch(action);
      };
    }
    return tinykeys(
      window,
      {
        ArrowRight: bind({ type: "next" }),
        Space: bind({ type: "next" }),
        PageDown: bind({ type: "next" }),
        ArrowLeft: bind({ type: "prev" }),
        "Shift+Space": bind({ type: "prev" }),
        PageUp: bind({ type: "prev" }),
        ArrowDown: bind({ type: "nextSlide" }),
        ArrowUp: bind({ type: "prevSlide" }),
        Home: bind({ type: "go", slide: 1 }),
        End: bind({ type: "go", slide: total }),
      },
      {
        ignore(event) {
          if (event.repeat || event.isComposing) return true;
          const target = event.target;
          if (!(target instanceof Element)) return false;
          if (target.closest("input, textarea, select")) return true;
          const boundary = target.closest(
            '[contenteditable="true" i], [contenteditable=""], [contenteditable="plaintext-only" i], [contenteditable="false" i]',
          );
          return (
            boundary !== null && boundary.getAttribute("contenteditable")?.toLowerCase() !== "false"
          );
        },
      },
    );
  }, [store, total]);
  useEffect(() => {
    const preload = () => {
      for (const module of modules.values()) void module.load();
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
