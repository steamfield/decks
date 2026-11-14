import { type ReactElement, useLayoutEffect, useMemo } from "react";
import { DeckContext, useDeckSelector } from "./hooks";
import { PlayView } from "./play-view";
import { createSlideModules, type DeckSource } from "./source";
import type { DeckStore } from "./store";

function DeckView(): ReactElement {
  const view = useDeckSelector((state) => state.view);
  useLayoutEffect(() => {
    const html = document.documentElement;
    const previousView = html.getAttribute("data-deck-view");
    const previousMotion = html.getAttribute("data-deck-motion");
    html.setAttribute("data-deck-view", view);
    html.setAttribute("data-deck-motion", "live");
    return () => {
      if (previousView === null) html.removeAttribute("data-deck-view");
      else html.setAttribute("data-deck-view", previousView);
      if (previousMotion === null) html.removeAttribute("data-deck-motion");
      else html.setAttribute("data-deck-motion", previousMotion);
    };
  }, [view]);
  return <PlayView />;
}

export function Deck({ source, store }: { source: DeckSource; store: DeckStore }): ReactElement {
  const value = useMemo(() => {
    return { source, store, modules: createSlideModules(source) };
  }, [source, store]);
  return (
    <DeckContext value={value}>
      <DeckView />
    </DeckContext>
  );
}
