import { parseLocation, syncChannelId } from "@react-decks/core";
import { createRoot } from "react-dom/client";
import { createBroadcastTransport } from "./broadcast-transport";
import { Deck } from "./deck";
import type { DeckSource } from "./source";
import { createDeckStore } from "./store";

export function mountDeck(source: DeckSource, root?: HTMLElement): () => void {
  const element = root ?? document.getElementById("deck-root");
  if (!element) throw new Error("Missing mount element #deck-root");
  const location = parseLocation(window.location.hash, window.location.search);
  const transport =
    typeof BroadcastChannel === "undefined" ||
    location.bridge ||
    location.embedded ||
    location.view === "print"
      ? undefined
      : createBroadcastTransport(
          syncChannelId(source.manifest.name, window.location.pathname.replace(/index\.html$/, "")),
        );
  const store = createDeckStore(source.manifest, { transport });
  const reactRoot = createRoot(element);
  reactRoot.render(<Deck source={source} store={store} />);
  return () => {
    reactRoot.unmount();
    store.destroy();
  };
}
