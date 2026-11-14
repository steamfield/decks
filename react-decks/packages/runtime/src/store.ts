import {
  clampNav,
  type DeckManifest,
  type DeckView,
  formatHash,
  type NavAction,
  type NavState,
  navigate,
  parseLocation,
} from "@react-decks/core";
import { createStore } from "zustand/vanilla";

export interface DeckState {
  readonly nav: NavState;
  readonly view: DeckView;
  readonly embedded: boolean;
  readonly bridge: boolean;
}

export interface DeckStore {
  getState(): DeckState;
  subscribe(listener: () => void): () => void;
  dispatch(action: NavAction): void;
  destroy(): void;
}

export function createDeckStore(manifest: DeckManifest): DeckStore {
  function readLocation(): DeckState {
    const location = parseLocation(window.location.hash, window.location.search);
    const nav = clampNav(location, manifest);
    return {
      nav: { slide: nav.slide, click: nav.click },
      view: location.view,
      embedded: location.embedded,
      bridge: location.bridge,
    };
  }

  function writeLocation(state: DeckState, push: boolean) {
    const hash = formatHash({ ...state.nav, view: state.view });
    if (window.location.hash !== hash) {
      const url = window.location.pathname + window.location.search + hash;
      if (push) window.history.pushState(window.history.state, "", url);
      else window.history.replaceState(window.history.state, "", url);
    }
  }

  const initial = readLocation();
  writeLocation(initial, false);
  const store = createStore<DeckState>(() => initial);
  function onLocation() {
    const next = readLocation();
    const previous = store.getState();
    writeLocation(next, false);
    if (
      next.nav.slide !== previous.nav.slide ||
      next.nav.click !== previous.nav.click ||
      next.view !== previous.view ||
      next.embedded !== previous.embedded ||
      next.bridge !== previous.bridge
    ) {
      store.setState(next, true);
    }
  }
  window.addEventListener("hashchange", onLocation);
  window.addEventListener("popstate", onLocation);
  return {
    getState: store.getState,
    subscribe: store.subscribe,
    dispatch(action) {
      const previous = store.getState();
      const nav = navigate(previous.nav, action, manifest);
      if (nav === previous.nav) return;
      const next = { ...previous, nav };
      writeLocation(next, nav.slide !== previous.nav.slide);
      store.setState(next, true);
    },
    destroy() {
      window.removeEventListener("hashchange", onLocation);
      window.removeEventListener("popstate", onLocation);
    },
  };
}
