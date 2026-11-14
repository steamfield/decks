import { parseLocation, syncChannelId } from "@react-decks/core";
import { useLayoutEffect } from "react";
import { createRoot } from "react-dom/client";
import { createBroadcastTransport } from "./broadcast-transport";
import { Deck } from "./deck";
import { installEmbed } from "./embed";
import { settled } from "./settle";
import type { DeckSource } from "./source";
import { createDeckStore } from "./store";
import { createPresenter } from "./transition";

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
  const store = createDeckStore(source.manifest, { transport, present: createPresenter(source) });
  const api = { settled };
  window.__deck = api;
  const embed = installEmbed(source.manifest, store);
  const reactRoot = createRoot(
    element,
    embed
      ? {
          onCaughtError: embed.onError,
          onUncaughtError: embed.onError,
        }
      : undefined,
  );
  reactRoot.render(
    <>
      <Deck source={source} store={store} />
      {embed && <EmbedReady start={embed.start} />}
    </>,
  );
  return () => {
    embed?.dispose();
    reactRoot.unmount();
    store.destroy();
    if (window.__deck === api) delete window.__deck;
  };
}

function EmbedReady({ start }: { start: () => void }) {
  useLayoutEffect(start, [start]);
  return null;
}
