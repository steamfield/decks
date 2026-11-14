import type { DeckManifest } from "./manifest";

export interface NavState {
  readonly slide: number;
  readonly click: number;
}

export type NavAction =
  | { readonly type: "next" }
  | { readonly type: "prev" }
  | { readonly type: "nextSlide" }
  | { readonly type: "prevSlide" }
  | { readonly type: "go"; readonly slide: number; readonly click?: number };

export type NavDirection = "forward" | "backward" | "none";

export function clampNav(state: NavState, manifest: DeckManifest): NavState {
  const slide = Math.max(
    1,
    Math.min(manifest.slides.length, Number.isNaN(state.slide) ? 1 : Math.floor(state.slide)),
  );
  const clicks = manifest.slides[slide - 1]?.clicks ?? 0;
  const click = Math.max(
    0,
    Math.min(clicks, Number.isNaN(state.click) ? 0 : Math.floor(state.click)),
  );
  return slide === state.slide && click === state.click ? state : { slide, click };
}

export function navigate(state: NavState, action: NavAction, manifest: DeckManifest): NavState {
  const current = clampNav(state, manifest);
  let result = current;
  switch (action.type) {
    case "next":
      if (current.click < (manifest.slides[current.slide - 1]?.clicks ?? 0)) {
        result = { slide: current.slide, click: current.click + 1 };
      } else if (current.slide < manifest.slides.length) {
        result = { slide: current.slide + 1, click: 0 };
      }
      break;
    case "prev":
      if (current.click > 0) {
        result = { slide: current.slide, click: current.click - 1 };
      } else if (current.slide > 1) {
        result = {
          slide: current.slide - 1,
          click: manifest.slides[current.slide - 2]?.clicks ?? 0,
        };
      }
      break;
    case "nextSlide":
      if (current.slide < manifest.slides.length) {
        result = { slide: current.slide + 1, click: 0 };
      }
      break;
    case "prevSlide":
      if (current.slide > 1) {
        result = { slide: current.slide - 1, click: 0 };
      }
      break;
    case "go":
      result = { slide: action.slide, click: action.click ?? 0 };
      break;
  }
  result = clampNav(result, manifest);
  return result.slide === state.slide && result.click === state.click ? state : result;
}

export function navDirection(from: NavState, to: NavState): NavDirection {
  if (to.slide > from.slide) return "forward";
  if (to.slide < from.slide) return "backward";
  if (to.click > from.click) return "forward";
  if (to.click < from.click) return "backward";
  return "none";
}
