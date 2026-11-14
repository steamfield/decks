import { clicksForSlide, type DeckView, type SlideMeta } from "@react-decks/core";
import { createContext, type RefObject, useContext, useMemo, useSyncExternalStore } from "react";
import type { createSlideModules, DeckSource } from "./source";
import type { DeckState, DeckStore } from "./store";

export const DeckContext = createContext<{
  source: DeckSource;
  store: DeckStore;
  modules: ReturnType<typeof createSlideModules>;
} | null>(null);

export function useDeckContext() {
  const context = useContext(DeckContext);
  if (!context)
    throw new Error(
      "useDeck() was called outside a deck. Render the component from a slide inside <Deck>.",
    );
  return context;
}

export function useDeckSelector<T>(selector: (state: DeckState) => T): T {
  const { store } = useDeckContext();
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()));
}

export const PresentationContext = createContext<{
  home: RefObject<"play" | "presenter">;
  /** When the timer started, in epoch milliseconds; null while stopped. */
  started: number | null;
  reset(): void;
} | null>(null);

export function usePresentation() {
  const value = useContext(PresentationContext);
  if (!value) throw new Error("Missing Deck presentation provider");
  return value;
}

export interface DeckApi {
  readonly slide: number;
  readonly total: number;
  readonly clicks: number;
  readonly clicksTotal: number;
  readonly slides: readonly SlideMeta[];
  readonly view: DeckView;
  readonly isPrint: boolean;
  /** True when the deck was opened with `?embedded`, inside another page. */
  readonly embedded: boolean;
  next(): void;
  prev(): void;
  nextSlide(): void;
  prevSlide(): void;
  go(slide: number, click?: number): void;
}

export function useDeck(): DeckApi {
  const { source, store } = useDeckContext();
  const slide = useDeckSelector((state) => state.nav.slide);
  const clicks = useDeckSelector((state) => state.nav.click);
  const view = useDeckSelector((state) => state.view);
  const embedded = useDeckSelector((state) => state.embedded);
  const actions = useMemo(
    () => ({
      next: () => store.dispatch({ type: "next" }),
      prev: () => store.dispatch({ type: "prev" }),
      nextSlide: () => store.dispatch({ type: "nextSlide" }),
      prevSlide: () => store.dispatch({ type: "prevSlide" }),
      go: (slide: number, click?: number) => store.dispatch({ type: "go", slide, click }),
    }),
    [store],
  );
  const slides = source.manifest.slides;
  return {
    slide,
    total: slides.length,
    clicks,
    clicksTotal: slides[slide - 1]?.clicks ?? 0,
    slides,
    view,
    isPrint: view === "print",
    embedded,
    ...actions,
  };
}

export type RenderContext = "slide" | "presenter" | "preview" | "overview" | "print";

export interface SlideApi {
  readonly no: number;
  readonly id: string;
  readonly clicks: number;
  readonly clicksTotal: number;
  readonly isActive: boolean;
  readonly renderContext: RenderContext;
  readonly frontmatter: Readonly<Record<string, unknown>>;
}

export const SlideContext = createContext<{
  meta: SlideMeta;
  context: RenderContext;
  clicks?: number;
} | null>(null);

export function useSlide(): SlideApi {
  const slide = useContext(SlideContext);
  if (!slide)
    throw new Error(
      "useSlide() was called outside a slide (this is also what <Step>, <Morph> and the other motion components use). Render the component from a slide.",
    );
  const { source } = useDeckContext();
  const clicks = useDeckSelector(
    (state) => slide.clicks ?? clicksForSlide(slide.meta.no, state.nav, source.manifest),
  );
  const isActive = useDeckSelector(
    (state) => slide.context === "slide" && slide.meta.no === state.nav.slide,
  );
  return {
    no: slide.meta.no,
    id: slide.meta.id,
    clicks,
    clicksTotal: slide.meta.clicks,
    isActive,
    renderContext: slide.context,
    frontmatter: source.frontmatter[slide.meta.id] ?? {},
  };
}

export const SlideScaleContext = createContext(1);
export function useSlideScale(): number {
  return useContext(SlideScaleContext);
}
