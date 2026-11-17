import { formatHash, parseLocation, syncChannelId } from "@react-decks/core";
import type { RefObject } from "react";
import type { DeckSource } from "../source";
import type { DeckStore } from "../store/store";

export function toggleFullscreen(): boolean {
  if (!document.fullscreenEnabled) return false;
  const toggle = document.fullscreenElement
    ? document.exitFullscreen()
    : document.documentElement.requestFullscreen();
  void toggle.catch(() => {
    // A browser may refuse fullscreen because of permissions or lost user activation.
  });
  return true;
}

export function toggleOverview(store: DeckStore, home: RefObject<"play" | "presenter">): boolean {
  const current = parseLocation(window.location.hash, window.location.search).view;
  if (current === "print") return false;
  store.setView(current === "overview" ? home.current : "overview");
  return true;
}

export function openPresenter(source: DeckSource): boolean {
  const state = parseLocation(window.location.hash, window.location.search);
  if (state.view !== "play" || state.embedded) return false;
  const channel = syncChannelId(
    source.manifest.name,
    window.location.pathname.replace(/index\.html$/, ""),
  );
  // "popup" gives the presenter its own surface to move to the speaker's screen.
  const presenter = window.open(
    "",
    `react-decks-presenter:${channel}`,
    "popup,width=1280,height=800",
  );
  // A blocked popup is intentionally silent; the deck remains usable in this window.
  if (!presenter) return true;
  if (presenter.location.href === "about:blank") {
    const url = new URL(window.location.href);
    url.hash = formatHash({ view: "presenter", slide: state.slide, click: state.click });
    presenter.location.href = url.href;
  }
  presenter.focus();
  return true;
}
