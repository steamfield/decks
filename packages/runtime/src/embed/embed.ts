import {
  type DeckManifest,
  type NavAction,
  type NavState,
  navDirection,
  parseLocation,
} from "@react-decks/core";
import { setInstantMove } from "../motion-mode";
import { settled } from "../settle/settle";
import type { DeckStore } from "../store/store";
import { forceNextDirection } from "../transitions/transition";
import { embedCaption, subscribeCaptions } from "./embed-caption";
import { embedActive, routeEmbedNavigation } from "./embed-navigation";
import type { EmbedDirection, EmbedMessage } from "./protocol";

export function installEmbed(manifest: DeckManifest, store: DeckStore) {
  if (!embedActive()) return undefined;
  const origin = window.location.origin;
  let move = 0;
  let requestId: number | undefined;
  let previous = store.getState().nav;
  let started = false;
  let disposed = false;
  let commanding = false;
  let pending = false;
  let caption = "";
  const post = (message: EmbedMessage) => window.parent.postMessage(message, origin);
  const onError = (error: unknown) => {
    post({ type: "decks:error", message: error instanceof Error ? error.message : String(error) });
  };
  function report(direction: EmbedDirection, nav: NavState = store.getState().nav) {
    const token = ++move;
    const id = requestId;
    previous = nav;
    pending = true;
    requestAnimationFrame(() => {
      if (disposed) return;
      const state = (isSettled: boolean) => {
        const current = store.getState().nav;
        post({
          type: "decks:state",
          ...(id === undefined ? {} : { requestId: id }),
          slide: nav.slide,
          slides: manifest.slides.length,
          beat: nav.click,
          beats: manifest.slides[nav.slide - 1]?.clicks ?? 0,
          ...(current.slide === nav.slide && current.click === nav.click
            ? embedCaption()
            : { lead: "", body: "" }),
          settled: isSettled,
          direction,
        });
      };
      state(false);
      if (token !== move) return;
      void settled()
        .then(() => {
          if (disposed || token !== move) return;
          // A show's instant motion lasts until its own move settles, after entrances ran.
          setInstantMove(false);
          state(true);
          pending = false;
          caption = JSON.stringify(embedCaption());
          requestId = undefined;
        })
        .catch(onError);
    });
  }
  const unsubscribe = store.subscribe(() => {
    const { nav, view } = store.getState();
    if (
      !started ||
      commanding ||
      view !== "play" ||
      (nav.slide === previous.slide && nav.click === previous.click)
    )
      return;
    const direction = navDirection(previous, nav);
    requestId = undefined;
    // A move the show did not command (a viewer's key, a URL change) is not part of it; release
    // before React commits it so its entrances play live.
    setInstantMove(false);
    report(direction === "none" ? null : direction, nav);
  });
  const unsubscribeCaptions = subscribeCaptions(() => {
    // A commit can replace one provider with another; read only its final visible copy.
    queueMicrotask(() => {
      if (!started || disposed || pending || JSON.stringify(embedCaption()) === caption) return;
      report(null);
    });
  });
  function onMessage(event: MessageEvent<unknown>) {
    if (event.source !== window.parent || event.origin !== origin) return;
    const data = event.data;
    if (typeof data !== "object" || data === null || !("type" in data) || data.type !== "decks:cmd")
      return;
    if (!started || !("cmd" in data) || store.getState().view !== "play") return;
    let action: NavAction;
    let direction: "forward" | "backward" | undefined;
    switch (data.cmd) {
      case "next":
      case "prev":
      case "nextSlide":
      case "prevSlide":
        action = { type: data.cmd };
        break;
      case "go":
      case "show": {
        const slide = "slide" in data ? data.slide : undefined;
        const beat = "beat" in data ? data.beat : 0;
        const forced = data.cmd === "go" && "direction" in data ? data.direction : undefined;
        if (
          typeof slide !== "number" ||
          !Number.isFinite(slide) ||
          typeof beat !== "number" ||
          !Number.isFinite(beat) ||
          (forced !== undefined && forced !== "forward" && forced !== "backward")
        )
          return;
        action = { type: "go", slide: Math.round(slide), click: Math.round(beat) };
        direction = forced;
        break;
      }
      default:
        return;
    }
    ++move;
    requestId =
      "requestId" in data && typeof data.requestId === "number" && Number.isInteger(data.requestId)
        ? data.requestId
        : undefined;
    const before = parseLocation(window.location.hash, window.location.search);
    commanding = true;
    // Set before dispatch: the presenter reads both while it decides how to play this move.
    setInstantMove(data.cmd === "show");
    forceNextDirection(direction);
    try {
      store.dispatch(action);
      const after = parseLocation(window.location.hash, window.location.search);
      const natural = navDirection(before, after);
      report(natural === "none" ? null : (direction ?? natural), {
        slide: after.slide,
        click: after.click,
      });
    } catch (error) {
      setInstantMove(false);
      onError(error);
    } finally {
      // An unchanged position never reaches the presenter, so it must not keep the direction.
      forceNextDirection(undefined);
      commanding = false;
    }
  }
  const onInteraction = () => post({ type: "decks:interaction" });
  const onKey = (event: KeyboardEvent) => {
    onInteraction();
    if (
      event.target instanceof Element &&
      event.target.closest(
        "input, textarea, select, [contenteditable], [role=slider], [data-decks-own-keys]",
      )
    )
      return;
    routeEmbedNavigation(event);
  };
  // Hovering or focusing something a viewer can explore (a chart mark, a link, a control)
  // pauses the player, as a click does. Moving within the same element does not repeat it.
  const onAttention = (event: PointerEvent | FocusEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    const interactive = target?.closest(
      'button, a[href], input, textarea, select, [contenteditable], [tabindex]:not([tabindex="-1"]), [role="button"], [role="slider"], [data-mark-id], .oc-chart-root canvas, .od-graph3d-host canvas',
    );
    if (
      !interactive ||
      (event.relatedTarget instanceof Node && interactive.contains(event.relatedTarget))
    )
      return;
    onInteraction();
  };
  window.addEventListener("message", onMessage);
  window.addEventListener("keydown", onKey, true);
  window.addEventListener("pointerdown", onInteraction, true);
  window.addEventListener("pointerover", onAttention, true);
  window.addEventListener("focusin", onAttention, true);
  return {
    onError,
    start() {
      started = true;
      post({ type: "decks:ready" });
      post({
        type: "decks:meta",
        title: manifest.title,
        slides: manifest.slides.length,
        slideTitles: manifest.slides.map((slide) => slide.title),
      });
      report(null);
    },
    dispose() {
      disposed = true;
      ++move;
      setInstantMove(false);
      unsubscribe();
      unsubscribeCaptions();
      window.removeEventListener("message", onMessage);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("pointerdown", onInteraction, true);
      window.removeEventListener("pointerover", onAttention, true);
      window.removeEventListener("focusin", onAttention, true);
    },
  };
}
