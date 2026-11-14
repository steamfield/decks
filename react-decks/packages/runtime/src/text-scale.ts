import { syncChannelId } from "@react-decks/core";
import { useSyncExternalStore } from "react";

/** Each press of Cmd/Ctrl + or - multiplies or divides the text size by this. */
const STEP = 1.1;
const MIN = 0.5;
const MAX = 2.5;

const listeners = new Set<() => void>();
// The value for this window, used only when storage is unavailable.
const local = new Map<string, number>();

/** One size per deck and base path, the same scope as the windows that follow each other. */
const storageKey = (deck: string) =>
  `react-decks:text-scale:${syncChannelId(deck, window.location.pathname.replace(/index\.html$/, ""))}`;

function clamp(value: number): number {
  return Number.isFinite(value) ? Math.min(MAX, Math.max(MIN, value)) : 1;
}

export function readTextScale(deck: string): number {
  try {
    const stored = window.localStorage.getItem(storageKey(deck));
    return stored === null ? 1 : clamp(Number(stored));
  } catch {
    // Storage can be blocked (private mode, an embedding page): the window keeps its own value.
    return local.get(deck) ?? 1;
  }
}

/**
 * Makes slide text larger (1), smaller (-1) or its authored size (0). Every window of the deck
 * follows, through the storage event, and the size survives a reload.
 */
export function stepTextScale(deck: string, direction: 1 | 0 | -1): void {
  const next = direction === 0 ? 1 : clamp(readTextScale(deck) * STEP ** direction);
  // Two decimals keep repeated steps from drifting and make + then - return to 1 exactly.
  const rounded = Math.round(next * 100) / 100;
  local.set(deck, rounded);
  try {
    if (rounded === 1) window.localStorage.removeItem(storageKey(deck));
    else window.localStorage.setItem(storageKey(deck), String(rounded));
  } catch {
    // See readTextScale: without storage the change applies to this window only.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function useTextScale(deck: string): number {
  return useSyncExternalStore(subscribe, () => readTextScale(deck));
}
