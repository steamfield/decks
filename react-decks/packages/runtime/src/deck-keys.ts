import { formatHash, type NavAction, parseLocation, syncChannelId } from "@react-decks/core";
import { useEffect } from "react";
import { type KeybindingsMap, tinykeys } from "tinykeys";
import { useDeckContext, useDeckSelector, usePresentation } from "./hooks";

export function useDeckKeys() {
  const { source, store } = useDeckContext();
  const view = useDeckSelector((state) => state.view);
  const { home } = usePresentation();
  useEffect(() => {
    const bind = (action: NavAction) => (event: KeyboardEvent) => {
      if (event.target instanceof Element && event.target.closest("button")) return;
      event.preventDefault();
      store.dispatch(action);
    };
    const keys: KeybindingsMap = {
      f(event) {
        event.preventDefault();
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen?.();
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
        const presenter = window.open("", `react-decks-presenter:${channel}`);
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
    return tinykeys(window, keys);
  }, [view, home, source, store]);
}
