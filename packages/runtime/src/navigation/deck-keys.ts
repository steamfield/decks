import { type NavAction, parseLocation } from "@react-decks/core";
import { useEffect } from "react";
import { defaultKeybindingsHandlerIgnore, type KeybindingsMap, tinykeys } from "tinykeys";
import { stepTextScale } from "../canvas/text-scale";
import { useDeckContext, useDeckSelector, usePresentation } from "../hooks";
import { openPresenter, toggleFullscreen, toggleOverview } from "./deck-actions";
import { showGoTo } from "./go-to-state";

export function useDeckKeys() {
  const { source, store } = useDeckContext();
  const view = useDeckSelector((state) => state.view);
  const { home } = usePresentation();
  useEffect(() => {
    const bind = (action: NavAction) => (event: KeyboardEvent) => {
      event.preventDefault();
      store.dispatch(action);
    };
    const keys: KeybindingsMap = {
      f(event) {
        if (toggleFullscreen()) event.preventDefault();
      },
      o(event) {
        if (toggleOverview(store, home)) event.preventDefault();
      },
      Escape(event) {
        if (parseLocation(window.location.hash, window.location.search).view !== "overview") return;
        event.preventDefault();
        store.setView(home.current);
      },
      p(event) {
        if (openPresenter(source)) event.preventDefault();
      },
    };
    if (view === "play" || view === "presenter") {
      // The canvas is scaled to fit, so the browser's own zoom would not change slide text.
      // These keys take its place: larger, smaller, and back to the authored size.
      const size = (direction: 1 | 0 | -1) => (event: KeyboardEvent) => {
        event.preventDefault();
        stepTextScale(source.manifest.name, direction);
      };
      // Both modifiers on every platform, so the keys do not depend on platform detection.
      for (const mod of ["Meta", "Control"]) {
        for (const key of ["Equal", "Shift+Equal", "NumpadAdd"]) keys[`${mod}+${key}`] = size(1);
        for (const key of ["Minus", "NumpadSubtract"]) keys[`${mod}+${key}`] = size(-1);
        keys[`${mod}+Digit0`] = size(0);
      }
      if (!store.getState().embedded) {
        keys.g = (event) => {
          event.preventDefault();
          showGoTo(store);
        };
      }
      Object.assign(keys, {
        ArrowRight: bind({ type: "next" }),
        Space: bind({ type: "next" }),
        PageDown: bind({ type: "next" }),
        ArrowLeft: bind({ type: "prev" }),
        "Shift+Space": bind({ type: "prev" }),
        PageUp: bind({ type: "prev" }),
        ArrowDown: bind({ type: "nextSlide" }),
        ArrowUp: bind({ type: "prevSlide" }),
        Home: bind({ type: "go", slide: 1 }),
        End: bind({ type: "go", slide: source.manifest.slides.length }),
      });
    }
    return tinykeys(window, keys, {
      ignore: (event) =>
        defaultKeybindingsHandlerIgnore(event) ||
        ((event.code === "Space" || event.key === "Enter") &&
          event.target instanceof Element &&
          event.target.closest("button") !== null),
    });
  }, [view, home, source, store]);
}
