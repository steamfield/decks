import { act } from "@testing-library/react";
import { expect, it, onTestFinished } from "vitest";
import { install, setup } from "./deck.test-support";

it.each(["?motion=instant#/1", "#/presenter/1", "#/overview/1", "#/print"])(
  "%s selects instant motion",
  (url) => {
    setup(url);
    expect(document.documentElement).toHaveAttribute("data-deck-motion", "instant");
  },
);

it("missing matchMedia means live in play and view switches update motion", () => {
  install(window, "matchMedia", undefined);
  const { store } = setup();
  expect(document.documentElement).toHaveAttribute("data-deck-motion", "live");
  act(() => store.setView("presenter"));
  expect(document.documentElement).toHaveAttribute("data-deck-motion", "instant");
  act(() => store.setView("play"));
  expect(document.documentElement).toHaveAttribute("data-deck-motion", "live");
});

it("reduced motion follows preference changes live and removes the listener on unmount", () => {
  const previous = Object.getOwnPropertyDescriptor(window, "matchMedia");
  const media = Object.assign(new EventTarget(), { matches: true });
  Object.defineProperty(window, "matchMedia", { configurable: true, value: () => media });
  onTestFinished(() => {
    if (previous) Object.defineProperty(window, "matchMedia", previous);
    else Reflect.deleteProperty(window, "matchMedia");
  });
  const { unmount } = setup();
  expect(document.documentElement).toHaveAttribute("data-deck-motion", "instant");
  act(() => {
    media.matches = false;
    media.dispatchEvent(new Event("change"));
  });
  expect(document.documentElement).toHaveAttribute("data-deck-motion", "live");
  unmount();
  media.matches = true;
  media.dispatchEvent(new Event("change"));
  expect(document.documentElement).not.toHaveAttribute("data-deck-motion");
});
