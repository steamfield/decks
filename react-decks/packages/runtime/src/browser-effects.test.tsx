import { createMemoryHub, type SyncMessage } from "@react-decks/core";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, onTestFinished } from "vitest";
import { makeSource, setup } from "./deck.test-support";
import { createDeckStore, Deck } from "./index";

// jsdom has no implementations of these browser APIs.
function install(target: object, name: string, value: unknown) {
  const previous = Object.getOwnPropertyDescriptor(target, name);
  Object.defineProperty(target, name, { configurable: true, value });
  onTestFinished(() => {
    if (previous) Object.defineProperty(target, name, previous);
    else Reflect.deleteProperty(target, name);
  });
}

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

it("Space on Reset timer uses native button activation and never advances the talk", async () => {
  setup("#/presenter/2?clicks=1");
  const user = userEvent.setup();
  const reset = screen.getByRole("button", { name: "Reset timer" });
  reset.focus();
  await user.keyboard(" ");
  expect(window.location.hash).toBe("#/presenter/2?clicks=1");
  expect(screen.getByLabelText("Elapsed time")).toHaveTextContent("00:00");
});

it("fullscreen is ignored when disabled", async () => {
  const requests: string[] = [];
  install(document, "fullscreenEnabled", false);
  install(document.documentElement, "requestFullscreen", async () => {
    requests.push("enter");
  });
  setup();
  await userEvent.setup().keyboard("f");
  expect(requests).toEqual([]);
});

it.each([false, true])(
  "a refused fullscreen toggle is handled when already fullscreen is %s",
  async (fullscreen) => {
    const requests: string[] = [];
    install(document, "fullscreenEnabled", true);
    install(document, "fullscreenElement", fullscreen ? document.documentElement : null);
    const refuse = async () => {
      requests.push(fullscreen ? "exit" : "enter");
      throw new Error("Fullscreen refused by the browser");
    };
    install(document, "exitFullscreen", refuse);
    install(document.documentElement, "requestFullscreen", refuse);
    setup();
    await userEvent.setup().keyboard("f");
    expect(requests).toEqual([fullscreen ? "exit" : "enter"]);
  },
);

it("without randomUUID a synced deck uses sixteen random bytes and still renders", async () => {
  install(crypto, "randomUUID", undefined);
  const byteCounts: number[] = [];
  install(crypto, "getRandomValues", (bytes: Uint8Array) => {
    byteCounts.push(bytes.length);
    bytes.set(Array.from({ length: 16 }, (_, index) => index));
    return bytes;
  });
  window.history.replaceState(null, "", "/#/2");
  const source = makeSource();
  const hub = createMemoryHub();
  const observer = hub.connect();
  const received: SyncMessage[] = [];
  observer.subscribe((message) => received.push(message));
  onTestFinished(() => {
    observer.close();
    window.history.replaceState(null, "", "/");
  });
  const store = createDeckStore(source.manifest, { transport: hub.connect() });
  const rendered = render(<Deck source={source} store={store} />);
  onTestFinished(() => {
    rendered.unmount();
    store.destroy();
  });
  expect(await screen.findByRole("heading", { name: "Title 2" })).toBeVisible();
  expect(byteCounts).toEqual([16]);
  expect(received.map((message) => message.from)).toEqual(["000102030405060708090a0b0c0d0e0f"]);
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

it("missing wake-lock and fullscreen APIs leave the deck usable", async () => {
  install(navigator, "wakeLock", undefined);
  install(document.documentElement, "requestFullscreen", undefined);
  setup();
  await userEvent.setup().keyboard("f{ArrowDown}");
  expect(window.location.hash).toBe("#/2");
});

it.each(["play", "presenter", "overview", "print"])(
  "f toggles document fullscreen in %s",
  async (view) => {
    install(document, "fullscreenEnabled", true);
    const events: string[] = [];
    let fullscreen: Element | null = null;
    const previous = Object.getOwnPropertyDescriptor(document, "fullscreenElement");
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => fullscreen,
    });
    onTestFinished(() => {
      if (previous) Object.defineProperty(document, "fullscreenElement", previous);
      else Reflect.deleteProperty(document, "fullscreenElement");
    });
    install(document.documentElement, "requestFullscreen", async () => {
      events.push("enter");
      fullscreen = document.documentElement;
    });
    install(document, "exitFullscreen", async () => {
      events.push("exit");
      fullscreen = null;
    });
    setup(view === "play" ? "#/1" : `#/${view}`);
    await userEvent.setup().keyboard("ff");
    expect(events).toEqual(["enter", "exit"]);
  },
);

it("p opens a named presenter at this URL and position and focuses it", async () => {
  const events: string[] = [];
  const popup = {
    location: { href: "about:blank" },
    focus() {
      events.push("focus");
    },
  };
  install(window, "open", (url: string, name: string) => {
    events.push(`${url}|${name}`);
    return popup;
  });
  setup("?custom=kept#/2?clicks=2");
  await userEvent.setup().keyboard("p");
  expect(events).toEqual(["|react-decks-presenter:react-decks:fixture:/", "focus"]);
  expect(popup.location.href).toBe(`${window.location.origin}/?custom=kept#/presenter/2?clicks=2`);
});

it("p focuses an existing presenter without changing its location", async () => {
  const events: string[] = [];
  const popup = {
    location: { href: "http://localhost/#/overview/2?clicks=2" },
    focus() {
      events.push("focus");
    },
  };
  install(window, "open", () => popup);
  setup("#/3");
  await userEvent.setup().keyboard("p");
  expect(popup.location.href).toBe("http://localhost/#/overview/2?clicks=2");
  expect(events).toEqual(["focus"]);
});

it("a blocked presenter popup leaves the talk in place", async () => {
  const opened: string[] = [];
  install(window, "open", (url: string) => {
    opened.push(url);
    return null;
  });
  setup("#/2?clicks=1");
  await userEvent.setup().keyboard("p");
  expect(opened).toEqual([""]);
  expect(window.location.hash).toBe("#/2?clicks=1");
});

it.each(["?embedded#/2", "#/presenter/2", "#/overview/2", "#/print"])(
  "p is ignored at %s",
  async (hash) => {
    const opened: string[] = [];
    install(window, "open", (url: string) => {
      opened.push(url);
      return null;
    });
    setup(hash);
    await userEvent.setup().keyboard("p");
    expect(opened).toEqual([]);
  },
);
