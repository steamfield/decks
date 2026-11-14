import {
  createMemoryHub,
  createSyncSession,
  type SyncMessage,
  type SyncState,
} from "@react-decks/core";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, onTestFinished, vi } from "vitest";
import { makeSource } from "./deck.test-support";
import { createDeckStore, Deck } from "./index";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

async function deliver(ms = 10) {
  await act(async () => vi.advanceTimersByTimeAsync(ms));
}

function setup(hash = "#/presenter/2?clicks=1") {
  window.history.replaceState(null, "", `/talk/?custom=kept${hash}`);
  const source = makeSource();
  const hub = createMemoryHub();
  const observer = hub.connect();
  const received: SyncMessage[] = [];
  observer.subscribe((message) => received.push(message));
  const store = createDeckStore(source.manifest, { transport: hub.connect() });
  const rendered = render(<Deck source={source} store={store} />);
  onTestFinished(() => {
    rendered.unmount();
    store.destroy();
    observer.close();
    window.history.replaceState(null, "", "/");
  });
  function peer(id = "peer", startedAt = 0, initial: SyncState = { nav: { slide: 4, click: 1 } }) {
    let state = initial;
    const applied: SyncState[] = [];
    const session = createSyncSession({
      id,
      startedAt,
      transport: hub.connect(),
      current: () => state,
      onRemote(next) {
        state = next;
        applied.push(next);
      },
    });
    onTestFinished(() => session.close());
    return {
      applied,
      publish(next: SyncState) {
        state = next;
        session.publish(next);
      },
      close: session.close,
    };
  }
  return { store, received, hub, peer };
}

it("creation sends only hello and never publishes its initial position", async () => {
  const { received } = setup();
  await deliver();
  expect(received.map((message) => message.type)).toEqual(["hello"]);
  expect(screen.getByRole("region", { name: "Current slide" })).toHaveTextContent("Title 2");
});

it("local dispatch, setView with a position, and edited URLs publish the current position", async () => {
  const { store, received } = setup();
  await deliver();
  act(() => store.dispatch({ type: "next" }));
  act(() => store.setView("play", { slide: 4, click: 99 }));
  act(() => {
    window.history.replaceState(null, "", "/talk/?custom=kept#/2?clicks=3");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
  await deliver();
  expect(received.filter((m) => m.type === "state").map((m) => m.state)).toEqual([
    { nav: { slide: 2, click: 2 } },
    { nav: { slide: 4, click: 1 }, aspect: window.innerWidth / window.innerHeight },
    { nav: { slide: 2, click: 3 }, aspect: window.innerWidth / window.innerHeight },
  ]);
  expect(window.location.search).toBe("?custom=kept");
  expect(screen.getByRole("heading", { name: "Title 2" })).toBeVisible();
});

it("view-only changes replace history and unchanged navigation does not publish or create history", async () => {
  const { store, received } = setup();
  const length = window.history.length;
  act(() => store.setView("overview"));
  expect(window.history.length).toBe(length);
  act(() => store.setView("overview", { slide: 2, click: 1 }));
  act(() => store.dispatch({ type: "nextSlide" }));
  expect(window.history.length).toBe(length);
  expect(window.location.hash).toBe("#/overview/2?clicks=1");
  await deliver();
  expect(received.map((m) => m.type)).toEqual(["hello"]);
});

it("a newcomer adopts the older play window's position and aspect without moving the talk", async () => {
  const { store, peer } = setup("#/2?clicks=2");
  const newcomer = peer("newcomer", performance.timeOrigin + performance.now() + 100, {
    nav: { slide: 1, click: 0 },
  });
  await deliver();
  expect(newcomer.applied).toEqual([
    { nav: { slide: 2, click: 2 }, aspect: window.innerWidth / window.innerHeight },
  ]);
  expect(store.getState().nav).toEqual({ slide: 2, click: 2 });
});

it("back and forward URL events publish once even when popstate and hashchange arrive together", async () => {
  const { store, received } = setup();
  await deliver();
  act(() => {
    window.history.replaceState(null, "", "/talk/?custom=kept#/presenter/3");
    window.dispatchEvent(new PopStateEvent("popstate"));
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
  await deliver();
  expect(store.getState().nav).toEqual({ slide: 3, click: 0 });
  expect(received.filter((m) => m.type === "state").map((m) => m.state)).toEqual([
    { nav: { slide: 3, click: 0 } },
  ]);
});

it("a trailing play resize publishes at most once per 250ms and reads the latest position", async () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  onTestFinished(() => {
    window.innerWidth = width;
    window.innerHeight = height;
  });
  window.innerWidth = 1600;
  window.innerHeight = 900;
  const { store, received } = setup("#/2");
  await deliver();
  window.innerWidth = 800;
  window.innerHeight = 600;
  window.dispatchEvent(new Event("resize"));
  await deliver(100);
  act(() => store.dispatch({ type: "next" }));
  window.innerWidth = 900;
  window.dispatchEvent(new Event("resize"));
  await deliver(149);
  expect(received.filter((m) => m.type === "state").map((m) => m.state)).toEqual([
    { nav: { slide: 2, click: 1 }, aspect: 4 / 3 },
  ]);
  await deliver(11);
  expect(received.filter((m) => m.type === "state").map((m) => m.state)).toEqual([
    { nav: { slide: 2, click: 1 }, aspect: 4 / 3 },
    { nav: { slide: 2, click: 1 }, aspect: 1.5 },
  ]);
  window.dispatchEvent(new Event("resize"));
  await deliver(260);
  expect(received.filter((m) => m.type === "state")).toHaveLength(2);
  act(() => store.setView("presenter"));
  window.innerWidth = 1000;
  window.dispatchEvent(new Event("resize"));
  await deliver(260);
  expect(received.filter((m) => m.type === "state")).toHaveLength(2);
});

it("a resize back to the original aspect corrects an intermediate navigation publication", async () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  onTestFinished(() => {
    window.innerWidth = width;
    window.innerHeight = height;
  });
  window.innerWidth = 1600;
  window.innerHeight = 900;
  const { store, received } = setup("#/2");
  await deliver();
  window.innerWidth = 800;
  window.innerHeight = 600;
  window.dispatchEvent(new Event("resize"));
  await deliver(100);
  act(() => store.dispatch({ type: "next" }));
  window.innerWidth = 1600;
  window.innerHeight = 900;
  window.dispatchEvent(new Event("resize"));
  await deliver(160);
  expect(received.filter((m) => m.type === "state").map((m) => m.state)).toEqual([
    { nav: { slide: 2, click: 1 }, aspect: 4 / 3 },
    { nav: { slide: 2, click: 1 }, aspect: 16 / 9 },
  ]);
});

it("a third presenter receives the audience aspect even when the presenter's same-stamp answer arrives first", async () => {
  const { peer } = setup();
  const audience = peer("audience", 0);
  await deliver();
  audience.publish({ nav: { slide: 4, click: 1 }, aspect: 4 / 3 });
  await deliver();
  const newcomer = peer("newcomer", performance.timeOrigin + performance.now() + 100, {
    nav: { slide: 1, click: 0 },
  });
  await deliver();
  expect(newcomer.applied).toEqual([{ nav: { slide: 4, click: 1 }, aspect: 4 / 3 }]);
});

it("a newcomer hello during a pending resize does not suppress the correction for existing windows", async () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  onTestFinished(() => {
    window.innerWidth = width;
    window.innerHeight = height;
  });
  window.innerWidth = 1600;
  window.innerHeight = 900;
  const { peer } = setup("#/2");
  const existing = peer("existing", performance.timeOrigin + performance.now() + 100);
  await deliver();
  window.innerWidth = 800;
  window.innerHeight = 600;
  window.dispatchEvent(new Event("resize"));
  await deliver(100);
  peer("newcomer", performance.timeOrigin + performance.now() + 200);
  await deliver(160);
  expect(existing.applied.at(-1)).toEqual({ nav: { slide: 2, click: 0 }, aspect: 4 / 3 });
});

it.each(["play", "presenter", "overview", "print"])(
  "newer remote state applies once in %s, clamps and writes history without echoing",
  async (view) => {
    const { store, received, peer } = setup(
      view === "print" ? "#/print" : view === "play" ? "#/2?clicks=1" : `#/${view}/2?clicks=1`,
    );
    const remote = peer();
    await deliver();
    const notifications: string[] = [];
    store.subscribe(() => notifications.push(window.location.hash));
    const length = window.history.length;
    act(() => remote.publish({ nav: { slide: 999, click: 99 }, aspect: 4 / 3 }));
    await deliver();
    const hash = view === "print" ? "#/print" : view === "play" ? "#/5" : `#/${view}/5`;
    expect(store.getState().nav).toEqual({ slide: 5, click: 0 });
    expect(store.getState().audienceAspect).toBe(4 / 3);
    expect(notifications).toEqual([hash]);
    if (view !== "print") expect(window.history.length).toBe(length + 1);
    const states = received.filter((m) => m.type === "state");
    expect(states.filter((m) => m.from !== "peer")).toHaveLength(1); // Only the hello answer.
    expect(window.location.search).toBe("?custom=kept");
  },
);

it("remote clicks replace history and URL events preserve the audience aspect", async () => {
  const { store, peer } = setup();
  const remote = peer("peer", 0, { nav: { slide: 2, click: 1 } });
  await deliver();
  const length = window.history.length;
  remote.publish({ nav: { slide: 2, click: 2 }, aspect: 4 / 3 });
  await deliver();
  expect(window.history.length).toBe(length);
  expect(window.location.hash).toBe("#/presenter/2?clicks=2");
  act(() => {
    window.history.replaceState(null, "", "/talk/?custom=kept#/overview/2?clicks=2");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  expect(store.getState().audienceAspect).toBe(4 / 3);
  expect(window.location.hash).toBe("#/overview/2?clicks=2");
});

it("destroy closes the session and cancels pending resize publication", async () => {
  const { store, received, peer } = setup("#/2");
  const remote = peer();
  await deliver();
  const count = received.length;
  window.dispatchEvent(new Event("resize"));
  store.destroy();
  remote.publish({ nav: { slide: 5, click: 0 } });
  await deliver(260);
  expect(received.slice(count).map((m) => m.from)).toEqual(["peer"]);
  expect(store.getState().nav).toEqual({ slide: 2, click: 0 });
});

it("an older talk wins when a new window navigates before its first answer", async () => {
  const { store, peer } = setup();
  const remote = peer();
  remote.publish({ nav: { slide: 4, click: 1 } });
  act(() => store.dispatch({ type: "next" }));
  await deliver();
  expect(store.getState().nav).toEqual({ slide: 4, click: 1 });
  expect(remote.applied).toEqual([]);
});

it("a late newcomer answer cannot undo a newer navigation in a three-window interleaving", async () => {
  const { store, peer } = setup();
  const talk = peer();
  await deliver();
  const newcomer = peer("newcomer", performance.timeOrigin + performance.now() + 100, {
    nav: { slide: 1, click: 0 },
  });
  await deliver(0); // Deliver hello; its answers are queued for the next timer turn.
  talk.publish({ nav: { slide: 2, click: 3 } });
  await deliver();
  expect(store.getState().nav).toEqual({ slide: 2, click: 3 });
  expect(newcomer.applied.at(-1)).toEqual({ nav: { slide: 2, click: 3 } });
});

it("simultaneous publications converge to the older session without an echo", async () => {
  const { store, peer } = setup();
  const remote = peer();
  await deliver();
  act(() => store.dispatch({ type: "go", slide: 3 }));
  remote.publish({ nav: { slide: 2, click: 3 } });
  await deliver();
  expect(store.getState().nav).toEqual({ slide: 2, click: 3 });
  expect(remote.applied).toEqual([]);
});
