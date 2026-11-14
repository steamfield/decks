import { type ReactElement, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useDeckAttention } from "./deck-attention";
import { useDeckKeys } from "./deck-keys";
import { DeckContext, PresentationContext, useDeckContext, useDeckSelector } from "./hooks";
import { OverviewView } from "./overview-view";
import { PlayView } from "./play-view";
import { PresenterView } from "./presenter-view";
import { createSlideModules, type DeckSource } from "./source";
import type { DeckStore } from "./store";

function DeckView(): ReactElement {
  const view = useDeckSelector((state) => state.view);
  useDeckKeys();
  useDeckAttention();
  useLayoutEffect(() => {
    const html = document.documentElement;
    const previousView = html.getAttribute("data-deck-view");
    const previousMotion = html.getAttribute("data-deck-motion");
    html.setAttribute("data-deck-view", view);
    html.setAttribute("data-deck-motion", view === "play" ? "live" : "instant");
    return () => {
      if (previousView === null) html.removeAttribute("data-deck-view");
      else html.setAttribute("data-deck-view", previousView);
      if (previousMotion === null) html.removeAttribute("data-deck-motion");
      else html.setAttribute("data-deck-motion", previousMotion);
    };
  }, [view]);
  if (view === "presenter") return <PresenterView />;
  if (view === "overview") return <OverviewView />;
  return <PlayView />;
}

function Presentation(): ReactElement {
  const { store } = useDeckContext();
  const [started, setStarted] = useState<number | null>(null);
  const home = useRef<"play" | "presenter">(
    store.getState().view === "presenter" ||
      (store.getState().view === "overview" && window.name.startsWith("react-decks-presenter:"))
      ? "presenter"
      : "play",
  );
  useLayoutEffect(() => {
    let previous = store.getState().nav;
    return store.subscribe(() => {
      const { nav, view } = store.getState();
      if (view === "play" || view === "presenter") home.current = view;
      if (nav.slide !== previous.slide || nav.click !== previous.click)
        setStarted((value) => value ?? Date.now());
      previous = nav;
    });
  }, [store]);
  // Changes only when the timer starts or is reset, so the slide tree does not render per second.
  const value = useMemo(() => ({ home, started, reset: () => setStarted(null) }), [started]);
  return (
    <PresentationContext value={value}>
      <DeckView />
    </PresentationContext>
  );
}

export function Deck({ source, store }: { source: DeckSource; store: DeckStore }): ReactElement {
  const value = useMemo(() => {
    return { source, store, modules: createSlideModules(source) };
  }, [source, store]);
  return (
    <DeckContext value={value}>
      <Presentation />
    </DeckContext>
  );
}
