import { act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, onTestFinished } from "vitest";
import { install, setup } from "../deck.test-support";

function screenLock(events: string[]) {
  return Object.assign(new EventTarget(), {
    released: false,
    get type(): WakeLockType {
      return "screen";
    },
    onrelease: null,
    async release() {
      this.released = true;
      events.push("release");
    },
  }) satisfies WakeLockSentinel;
}

it.each(["play", "presenter"])(
  "%s holds a visible screen wake lock and releases it when leaving or unmounting",
  async (view) => {
    const events: string[] = [];
    install(document, "visibilityState", "visible");
    install(navigator, "wakeLock", {
      async request(kind: string) {
        events.push(kind);
        return screenLock(events);
      },
    });
    const { store, unmount } = setup(view === "play" ? "#/2" : "#/presenter/2");
    await act(async () => {});
    expect(events).toEqual(["screen"]);
    act(() => store.setView("overview"));
    expect(events).toEqual(["screen", "release"]);
    act(() => store.setView("print"));
    expect(events).toEqual(["screen", "release"]);
    act(() => store.setView("presenter"));
    await act(async () => {});
    unmount();
    expect(events).toEqual(["screen", "release", "screen", "release"]);
  },
);

it("a hidden document requests no lock and reacquires whenever it becomes visible", async () => {
  const events: string[] = [];
  let visibility = "hidden";
  const previous = Object.getOwnPropertyDescriptor(document, "visibilityState");
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility });
  onTestFinished(() => {
    if (previous) Object.defineProperty(document, "visibilityState", previous);
    else Reflect.deleteProperty(document, "visibilityState");
  });
  install(navigator, "wakeLock", {
    async request(kind: string) {
      events.push(kind);
      return screenLock(events);
    },
  });
  setup();
  expect(events).toEqual([]);
  visibility = "visible";
  await act(async () => document.dispatchEvent(new Event("visibilitychange")));
  expect(events).toEqual(["screen"]);
  visibility = "hidden";
  await act(async () => document.dispatchEvent(new Event("visibilitychange")));
  visibility = "visible";
  await act(async () => document.dispatchEvent(new Event("visibilitychange")));
  expect(events).toEqual(["screen", "release", "screen"]);
});

it("a wake-lock request that finishes after leaving play is released", async () => {
  const events: string[] = [];
  let finish: ((lock: WakeLockSentinel) => void) | undefined;
  const pending = new Promise<WakeLockSentinel>((resolve) => {
    finish = resolve;
  });
  install(document, "visibilityState", "visible");
  install(navigator, "wakeLock", { request: () => pending });
  const { store } = setup();
  act(() => store.setView("overview"));
  await act(async () => finish?.(screenLock(events)));
  expect(events).toEqual(["release"]);
});

it("overlapping wake-lock acquisitions are both released after a visibility round trip and leaving play", async () => {
  const events: string[] = [];
  const finish: ((lock: WakeLockSentinel) => void)[] = [];
  let visibility = "visible";
  const previous = Object.getOwnPropertyDescriptor(document, "visibilityState");
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility });
  onTestFinished(() => {
    if (previous) Object.defineProperty(document, "visibilityState", previous);
    else Reflect.deleteProperty(document, "visibilityState");
  });
  install(navigator, "wakeLock", {
    request: () =>
      new Promise<WakeLockSentinel>((resolve) => {
        finish.push(resolve);
      }),
  });
  const { store } = setup();
  visibility = "hidden";
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  visibility = "visible";
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  expect(finish).toHaveLength(2);
  await act(async () => {
    for (const resolve of finish) resolve(screenLock(events));
  });
  act(() => store.setView("overview"));
  expect(events).toEqual(["release", "release"]);
});

it("a rejected wake lock does not interrupt navigation", async () => {
  install(document, "visibilityState", "visible");
  install(navigator, "wakeLock", {
    async request() {
      throw new Error("Battery saver");
    },
  });
  setup("#/presenter/2");
  await userEvent.setup().keyboard("{ArrowDown}");
  expect(window.location.hash).toBe("#/presenter/3");
});
