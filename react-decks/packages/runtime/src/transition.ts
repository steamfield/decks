import { type DeckManifest, navDirection } from "@react-decks/core";
import { flushSync } from "react-dom";
import { createSlideModules, type DeckSource } from "./source";
import type { DeckState } from "./store";
import "./transition.css";

let active: { transition?: ViewTransition; pending: boolean; owner: object } | undefined;

export function transitionName(manifest: DeckManifest, from: DeckState, to: DeckState) {
  const distance = to.nav.slide - from.nav.slide;
  if (!distance)
    return from.nav.click !== to.nav.click && manifest.slides[to.nav.slide - 1]?.morphSteps
      ? "step"
      : undefined;
  return (
    (Math.abs(distance) === 1
      ? manifest.slides[Math.min(from.nav.slide, to.nav.slide) - 1]?.transition
      : undefined) ??
    manifest.transition ??
    "fade"
  );
}

export function transitionInFlight() {
  return active !== undefined;
}

export function cancelPresentation(owner: object) {
  if (active?.owner !== owner) return;
  active.transition?.skipTransition();
  active = undefined;
  document.documentElement.removeAttribute("data-deck-transition");
  document.documentElement.removeAttribute("data-deck-nav");
}

export function runTransition(apply: () => void, name: string, direction: string, owner: object) {
  const html = document.documentElement;
  const current: NonNullable<typeof active> = { pending: true, owner };
  active = current;
  html.setAttribute("data-deck-transition", name);
  html.setAttribute("data-deck-nav", direction);
  const transition = document.startViewTransition(() => {
    if (active !== current) return;
    current.pending = false;
    flushSync(apply);
  });
  current.transition = transition;
  void transition.ready.catch(() => {
    // The browser rejects ready when a newer navigation skips this snapshot.
  });
  void transition.updateCallbackDone.catch(() => {
    // The browser can reject all three promises when a snapshot is skipped.
  });
  void transition.finished
    .catch(() => {})
    .then(() => {
      if (active !== current) return;
      active = undefined;
      html.removeAttribute("data-deck-transition");
      html.removeAttribute("data-deck-nav");
    });
}

export function createPresenter(source: DeckSource) {
  const modules = createSlideModules(source);
  function present({ from, to }: { from: DeckState; to: DeckState }, apply: () => void) {
    const direction = navDirection(from.nav, to.nav);
    const name = transitionName(source.manifest, from, to);
    const target = source.manifest.slides[to.nav.slide - 1];
    const mustNotAnimate =
      typeof document.startViewTransition !== "function" ||
      document.documentElement.getAttribute("data-deck-motion") === "instant" ||
      from.view !== "play" ||
      to.view !== "play" ||
      direction === "none" ||
      !target ||
      !modules.get(target.id)?.resolved ||
      !name ||
      name === "cut";
    if (active?.pending && !mustNotAnimate) return;
    if (mustNotAnimate) {
      active?.transition?.skipTransition();
      apply();
      return;
    }
    runTransition(apply, name, direction, present);
  }
  return present;
}
