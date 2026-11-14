import { formatHash, type NavAction, parseLocation, syncChannelId } from "@react-decks/core";
import { useEffect } from "react";
import { defaultKeybindingsHandlerIgnore, type KeybindingsMap, tinykeys } from "tinykeys";
import { useDeckContext, useDeckSelector, usePresentation } from "./hooks";
import { stepTextScale } from "./text-scale";

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
        if (!document.fullscreenEnabled) return;
        event.preventDefault();
        const toggle = document.fullscreenElement
          ? document.exitFullscreen()
          : document.documentElement.requestFullscreen();
        void toggle.catch(() => {
          // A browser may refuse fullscreen because of permissions or lost user activation.
        });
      },
      o(event) {
        const current = parseLocation(window.location.hash, window.location.search).view;
        if (current === "print") return;
        event.preventDefault();
        store.setView(current === "overview" ? home.current : "overview");
      },
      Escape(event) {
        if (parseLocation(window.location.hash, window.location.search).view !== "overview") return;
        event.preventDefault();
        store.setView(home.current);
      },
      p(event) {
        const state = parseLocation(window.location.hash, window.location.search);
        if (state.view !== "play" || state.embedded) return;
        event.preventDefault();
        const channel = syncChannelId(
          source.manifest.name,
          window.location.pathname.replace(/index\.html$/, ""),
        );
        // "popup" asks for a window of its own, not a tab, so it is plainly a second surface
        // driving this one and can be dragged to the speaker's screen.
        const presenter = window.open(
          "",
          `react-decks-presenter:${channel}`,
          "popup,width=1280,height=800",
        );
        // A blocked popup is intentionally silent; the deck remains usable in this window.
        if (!presenter) return;
        if (presenter.location.href === "about:blank") {
          const url = new URL(window.location.href);
          url.hash = formatHash({ view: "presenter", slide: state.slide, click: state.click });
          presenter.location.href = url.href;
        }
        presenter.focus();
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
