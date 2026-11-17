import { useSyncExternalStore } from "react";
import { useDeckContext } from "../hooks";
import type { DeckStore } from "../store/store";

// Whether the go-to dialog is open. Not deck state (it is not a position and is never synced
// or put in the URL), so it lives beside the store, one per store, for the `g` key, the control
// tray's counter and the dialog to share. Architecture section 4.5.
interface GoToState {
  open: boolean;
  listeners: Set<() => void>;
}

const states = new WeakMap<DeckStore, GoToState>();

function stateFor(store: DeckStore): GoToState {
  let state = states.get(store);
  if (!state) {
    state = { open: false, listeners: new Set() };
    states.set(store, state);
  }
  return state;
}

function setOpen(store: DeckStore, open: boolean) {
  const state = stateFor(store);
  if (state.open === open) return;
  state.open = open;
  for (const listener of state.listeners) listener();
}

export function useGoTo(): { open: boolean; show(): void; hide(): void } {
  const { store } = useDeckContext();
  const state = stateFor(store);
  const open = useSyncExternalStore(
    (listener) => {
      state.listeners.add(listener);
      return () => state.listeners.delete(listener);
    },
    () => state.open,
  );
  return { open, show: () => setOpen(store, true), hide: () => setOpen(store, false) };
}
