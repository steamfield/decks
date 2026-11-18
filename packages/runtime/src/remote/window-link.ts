import type { RemotePosition } from "@react-decks/core";
import type { DeckStore } from "../store/store";
import type { RemoteLink } from "./remote-link";

export function connectWindow(store: DeckStore, link: RemoteLink): () => void {
  let previous: RemotePosition | undefined;
  function report() {
    const { nav, view } = store.getState();
    if (view === "print") {
      previous = undefined;
      return;
    }
    const focused = document.hasFocus();
    if (
      previous?.slide === nav.slide &&
      previous.click === nav.click &&
      previous.view === view &&
      previous.focused === focused
    )
      return;
    previous = { ...nav, view, focused };
    link.report(previous);
  }
  const unsubscribe = store.subscribe(report);
  const stopIntents = link.onIntent(store.dispatch);
  window.addEventListener("focus", report);
  window.addEventListener("blur", report);
  report();
  return () => {
    unsubscribe();
    stopIntents();
    window.removeEventListener("focus", report);
    window.removeEventListener("blur", report);
  };
}
