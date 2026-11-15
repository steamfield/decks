import type { EmbedMessage } from "./protocol";

export function embedActive(): boolean {
  if (typeof window === "undefined" || window.parent === window) return false;
  if (!new URLSearchParams(window.location.search).has("decks-bridge")) return false;
  try {
    return window.parent.location.origin === window.location.origin;
  } catch (error) {
    // Accessing a cross-origin parent's location is forbidden by the browser.
    if (error instanceof DOMException && error.name === "SecurityError") return false;
    throw error;
  }
}

/** Lets a same-origin embed host decide how to handle a stage's arrow key. */
export function routeEmbedNavigation(event: KeyboardEvent): boolean {
  if (!embedActive() || event.altKey || event.metaKey || event.ctrlKey) return false;
  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return false;
  event.preventDefault();
  event.stopImmediatePropagation();
  window.parent.postMessage(
    {
      type: "decks:navigate",
      cmd:
        event.key === "ArrowRight"
          ? event.shiftKey
            ? "nextSlide"
            : "next"
          : event.shiftKey
            ? "prevSlide"
            : "prev",
    } satisfies EmbedMessage,
    window.location.origin,
  );
  return true;
}
