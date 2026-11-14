import { act, render, screen } from "@testing-library/react";
import { expect, it, onTestFinished } from "vitest";
import { makeSource } from "./deck.test-support";
import { createDeckStore, Deck } from "./index";
import { createSlideModules } from "./source";
import { createPresenter } from "./transition";

async function setup() {
  window.history.replaceState(null, "", "/#/1");
  const source = makeSource();
  await Promise.all([...createSlideModules(source).values()].map((module) => module.load()));
  const frames: { skipped: boolean; updated: boolean; update(): Promise<void>; finish(): void }[] =
    [];
  const previous = Object.getOwnPropertyDescriptor(document, "startViewTransition");
  // jsdom lacks this browser boundary. The store, presenter, React tree and module cache are real.
  Object.defineProperty(document, "startViewTransition", {
    configurable: true,
    value(callback: ViewTransitionUpdateCallback | StartViewTransitionOptions) {
      const update = typeof callback === "function" ? callback : callback.update;
      let ready = () => {};
      let rejectReady = (_error: Error) => {};
      let updated = () => {};
      let finished = () => {};
      const transition: ViewTransition = {
        ready: new Promise<void>((resolve, reject) => {
          ready = resolve;
          rejectReady = reject;
        }),
        updateCallbackDone: new Promise<void>((resolve) => {
          updated = resolve;
        }),
        finished: new Promise<void>((resolve) => {
          finished = resolve;
        }),
        types: new Set<string>(),
        skipTransition() {
          frame.skipped = true;
          rejectReady(new Error("Skipped transition"));
        },
      };
      const frame = {
        skipped: false,
        updated: false,
        async update() {
          if (frame.updated) return;
          frame.updated = true;
          await update?.();
          updated();
          ready();
        },
        finish() {
          finished();
        },
      };
      frames.push(frame);
      return transition;
    },
  });
  const store = createDeckStore(source.manifest, { present: createPresenter(source) });
  const view = render(<Deck source={source} store={store} />);
  onTestFinished(async () => {
    view.unmount();
    store.destroy();
    for (const frame of frames) {
      await act(() => frame.update());
      frame.finish();
    }
    await act(async () => {});
    if (previous) Object.defineProperty(document, "startViewTransition", previous);
    else Reflect.deleteProperty(document, "startViewTransition");
    window.history.replaceState(null, "", "/");
  });
  return { store, frames };
}

it("an animating change waits for its callback and coalesces subsequent animating changes", async () => {
  const { store, frames } = await setup();
  act(() => {
    store.dispatch({ type: "nextSlide" });
    store.dispatch({ type: "nextSlide" });
  });
  expect(frames).toHaveLength(1);
  expect(store.getState().nav.slide).toBe(1);
  expect(window.location.hash).toBe("#/3");
  await act(() => frames[0]?.update());
  expect(screen.getByRole("heading", { name: "Title 3" })).toBeVisible();
});

it("a nonanimated change skips a pending callback and presents immediately", async () => {
  const { store, frames } = await setup();
  act(() => store.dispatch({ type: "nextSlide" }));
  act(() => store.setView("overview"));
  expect(store.getState().view).toBe("overview");
  expect(frames).toHaveLength(1);
  expect(frames[0]?.skipped).toBe(true);
  expect(screen.getByRole("button", { name: "Slide 2: Title 2" })).toHaveFocus();
  await act(() => frames[0]?.update());
  expect(store.getState().view).toBe("overview");
});

it("a nonanimated change after the callback skips the existing animation and applies now", async () => {
  const { store, frames } = await setup();
  act(() => store.dispatch({ type: "nextSlide" }));
  await act(() => frames[0]?.update());
  act(() => store.dispatch({ type: "next" }));
  expect(store.getState().nav).toEqual({ slide: 2, click: 1 });
  expect(frames).toHaveLength(1);
  expect(frames[0]?.skipped).toBe(true);
  expect(screen.getByRole("status", { name: /Deck 2\/5 click 1\/3/ })).toBeVisible();
});

it("an animated change after the callback starts another transition whose attributes outlive the first", async () => {
  const { store, frames } = await setup();
  act(() => store.dispatch({ type: "nextSlide" }));
  await act(() => frames[0]?.update());
  act(() => store.dispatch({ type: "nextSlide" }));
  expect(frames).toHaveLength(2);
  await act(async () => frames[0]?.finish());
  expect(document.documentElement).toHaveAttribute("data-deck-transition", "fade");
  expect(store.getState().nav.slide).toBe(2);
  await act(() => frames[1]?.update());
  expect(screen.getByRole("heading", { name: "Title 3" })).toBeVisible();
  await act(async () => frames[1]?.finish());
  expect(document.documentElement).not.toHaveAttribute("data-deck-transition");
});
