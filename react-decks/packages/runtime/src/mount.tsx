import { createRoot } from "react-dom/client";
import { Deck } from "./deck";
import type { DeckSource } from "./source";
import { createDeckStore } from "./store";

export function mountDeck(source: DeckSource, root?: HTMLElement): () => void {
  const element = root ?? document.getElementById("deck-root");
  if (!element) throw new Error("Missing mount element #deck-root");
  const store = createDeckStore(source.manifest);
  const reactRoot = createRoot(element);
  reactRoot.render(<Deck source={source} store={store} />);
  return () => {
    reactRoot.unmount();
    store.destroy();
  };
}
