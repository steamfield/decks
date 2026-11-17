import {
  clampNav,
  createSyncSession,
  type DeckManifest,
  type DeckView,
  formatHash,
  type NavAction,
  type NavState,
  navigate,
  parseLocation,
  type SyncStamp,
  type SyncState,
  type Transport,
} from "@react-decks/core";
import { createStore } from "zustand/vanilla";
import { cancelPresentation } from "../transitions/transition";

export interface DeckState {
  readonly syncStamp: SyncStamp;
  readonly nav: NavState;
  readonly view: DeckView;
  readonly embedded: boolean;
  readonly bridge: boolean;
  readonly audienceAspect?: number;
}

export interface DeckStore {
  getState(): DeckState;
  subscribe(listener: () => void): () => void;
  dispatch(action: NavAction): void;
  setView(view: DeckView, nav?: NavState): void;
  destroy(): void;
}

export function createDeckStore(
  manifest: DeckManifest,
  options?: {
    transport?: Transport;
    present?: (change: { from: DeckState; to: DeckState }, apply: () => void) => void;
  },
): DeckStore {
  const identity: SyncStamp = {
    seq: 0,
    started: performance.timeOrigin + performance.now(),
    origin:
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
            byte.toString(16).padStart(2, "0"),
          ).join(""),
  };
  function readLocation(): DeckState {
    const location = parseLocation(window.location.hash, window.location.search);
    const nav = clampNav(location, manifest);
    return {
      syncStamp: identity,
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
  let logical = initial;
  function apply() {
    const presented = store.getState();
    if (
      positionChanged(presented.nav, logical.nav) ||
      presented.view !== logical.view ||
      presented.embedded !== logical.embedded ||
      presented.bridge !== logical.bridge ||
      presented.audienceAspect !== logical.audienceAspect
    )
      store.setState(logical, true);
  }
  function present(next: DeckState) {
    logical = next;
    if (options?.present) options.present({ from: store.getState(), to: logical }, apply);
    else apply();
  }
  const positionChanged = (a: NavState, b: NavState) => a.slide !== b.slide || a.click !== b.click;
  let lastAspect = window.innerWidth / window.innerHeight;
  function current(state = logical): SyncState {
    const { nav, view, audienceAspect } = state;
    const aspect = view === "play" ? window.innerWidth / window.innerHeight : audienceAspect;
    return aspect === undefined ? { nav } : { nav, aspect };
  }
  const session = options?.transport
    ? createSyncSession({
        id: identity.origin,
        startedAt: identity.started,
        transport: options.transport,
        current,
        onRemote(remote) {
          const previous = logical;
          const nav = clampNav(remote.nav, manifest);
          const next = {
            ...previous,
            syncStamp: session?.getStamp() ?? previous.syncStamp,
            nav,
            ...(remote.aspect === undefined ? {} : { audienceAspect: remote.aspect }),
          };
          if (
            !positionChanged(nav, previous.nav) &&
            next.audienceAspect === previous.audienceAspect
          )
            return;
          writeLocation(next, nav.slide !== previous.nav.slide);
          present(next);
        },
      })
    : undefined;
  function publish(next = logical): SyncStamp {
    const state = current(next);
    if (state.aspect !== undefined) lastAspect = state.aspect;
    session?.publish(state);
    return session?.getStamp() ?? { ...identity, seq: logical.syncStamp.seq + 1 };
  }
  function onLocation() {
    const previous = logical;
    const next = { ...previous, ...readLocation(), syncStamp: previous.syncStamp };
    writeLocation(next, false);
    if (
      next.nav.slide !== previous.nav.slide ||
      next.nav.click !== previous.nav.click ||
      next.view !== previous.view ||
      next.embedded !== previous.embedded ||
      next.bridge !== previous.bridge
    ) {
      if (positionChanged(next.nav, previous.nav)) next.syncStamp = publish(next);
      present(next);
    }
  }
  let resizeTimer: ReturnType<typeof setTimeout> | undefined;
  function onResize() {
    if (
      !session ||
      logical.view !== "play" ||
      resizeTimer !== undefined ||
      window.innerWidth / window.innerHeight === lastAspect
    )
      return;
    resizeTimer = setTimeout(() => {
      resizeTimer = undefined;
      if (logical.view === "play") publish();
    }, 250);
  }
  window.addEventListener("hashchange", onLocation);
  window.addEventListener("popstate", onLocation);
  window.addEventListener("resize", onResize);
  return {
    getState: store.getState,
    subscribe: store.subscribe,
    dispatch(action) {
      const previous = logical;
      if (previous.view === "overview" || previous.view === "print") return;
      const nav = navigate(previous.nav, action, manifest);
      if (nav === previous.nav) return;
      const next = { ...previous, nav };
      writeLocation(next, nav.slide !== previous.nav.slide);
      present({ ...next, syncStamp: publish(next) });
    },
    setView(view, position) {
      const previous = logical;
      const nav = position ? clampNav(position, manifest) : previous.nav;
      const moved = positionChanged(nav, previous.nav);
      if (view === previous.view && !moved) return;
      const next = { ...previous, view, nav };
      if (nav.slide !== previous.nav.slide) writeLocation({ ...previous, view }, false);
      writeLocation(next, nav.slide !== previous.nav.slide);
      present(moved ? { ...next, syncStamp: publish(next) } : next);
    },
    destroy() {
      if (options?.present) cancelPresentation(options.present);
      window.removeEventListener("hashchange", onLocation);
      window.removeEventListener("popstate", onLocation);
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);
      session?.close();
    },
  };
}
