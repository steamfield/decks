import { createMemoryHub, createSyncSession, type SyncState } from "@react-decks/core";
import { act, render, screen } from "@testing-library/react";
import { expect, it, onTestFinished, vi } from "vitest";
import { makeSource } from "../deck.test-support";
import { createDeckStore, Deck, type DeckState } from "../index";

function setup() {
  window.history.replaceState(null, "", "/?kept=yes#/1");
  const source = makeSource();
  const hub = createMemoryHub();
  const changes: { from: DeckState; to: DeckState }[] = [];
  const applies: (() => void)[] = [];
  const store = createDeckStore(source.manifest, {
    transport: hub.connect(),
    present(change, apply) {
      changes.push(change);
      applies.push(apply);
    },
  });
  const view = render(<Deck source={source} store={store} />);
  const presented: DeckState[] = [];
  store.subscribe(() => presented.push(store.getState()));
  onTestFinished(() => {
    view.unmount();
    store.destroy();
    window.history.replaceState(null, "", "/");
    vi.useRealTimers();
  });
  function peer(id: string, startedAt: number) {
    let state: SyncState = { nav: { slide: 1, click: 0 } };
    const received: SyncState[] = [];
    const session = createSyncSession({
      id,
      startedAt,
      transport: hub.connect(),
      current: () => state,
      onRemote(next) {
        state = next;
        received.push(next);
      },
    });
    onTestFinished(session.close);
    return {
      received,
      publish(next: SyncState) {
        state = next;
        session.publish(next);
      },
    };
  }
  return { store, changes, applies, presented, peer };
}

it.each([
  [0, 1],
  [1, 0],
])(
  "two dispatches use logical state and applying callbacks in order %j never paints stale state",
  async (first, second) => {
    const { store, changes, applies, presented } = setup();
    await screen.findByRole("heading", { name: "Title 1" });
    const history = window.history.length;
    act(() => {
      store.dispatch({ type: "next" });
      store.dispatch({ type: "next" });
    });
    expect(window.location.hash).toBe("#/2?clicks=1");
    expect(window.history.length).toBe(history + 1);
    expect(store.getState().nav).toEqual({ slide: 1, click: 0 });
    expect(presented).toEqual([]);
    expect(changes.map(({ from, to }) => [from.nav, to.nav])).toEqual([
      [
        { slide: 1, click: 0 },
        { slide: 2, click: 0 },
      ],
      [
        { slide: 1, click: 0 },
        { slide: 2, click: 1 },
      ],
    ]);
    act(() => applies[first]?.());
    expect(await screen.findByRole("status", { name: /Deck 2\/5 click 1\/3/ })).toBeVisible();
    act(() => {
      applies[second]?.();
      applies[first]?.();
    });
    expect(presented.map((state) => state.nav)).toEqual([{ slide: 2, click: 1 }]);
  },
);

it("a return to the presented position before apply produces no notification", () => {
  const { store, applies, presented } = setup();
  store.dispatch({ type: "next" });
  store.dispatch({ type: "prev" });
  expect(window.location.hash).toBe("#/1");
  act(() => {
    for (const apply of applies) apply();
  });
  expect(presented).toEqual([]);
});

it("a change after apply starts from the newly presented state and an older apply still reads the latest state", () => {
  const { store, changes, applies, presented } = setup();
  store.dispatch({ type: "nextSlide" });
  act(() => applies[0]?.());
  store.dispatch({ type: "nextSlide" });
  expect(changes.at(-1)).toMatchObject({
    from: { nav: { slide: 2, click: 0 } },
    to: { nav: { slide: 3, click: 0 } },
  });
  act(() => applies[0]?.());
  act(() => applies[1]?.());
  expect(presented.map((state) => state.nav.slide)).toEqual([2, 3]);
});

it("setView and dispatch consult the logical view while presentation waits", () => {
  const { store, applies, changes } = setup();
  store.setView("overview", { slide: 3, click: 0 });
  store.dispatch({ type: "nextSlide" });
  store.setView("play");
  store.dispatch({ type: "next" });
  expect(window.location.hash).toBe("#/4");
  expect(changes.map(({ to }) => [to.view, to.nav.slide])).toEqual([
    ["overview", 3],
    ["play", 3],
    ["play", 4],
  ]);
  act(() => applies[0]?.());
  expect(store.getState()).toMatchObject({ view: "play", nav: { slide: 4, click: 0 } });
});

it("Back and duplicate URL events compare against logical state before apply", () => {
  const { store, applies, changes, presented } = setup();
  store.dispatch({ type: "nextSlide" });
  window.history.replaceState(null, "", "/?kept=yes#/1");
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.dispatchEvent(new HashChangeEvent("hashchange"));
  expect(changes.map(({ to }) => to.nav.slide)).toEqual([2, 1]);
  act(() => {
    for (const apply of applies) apply();
  });
  expect(presented).toEqual([]);
  expect(window.location.search).toBe("?kept=yes");
});

it("remote changes merge logical fields, do not echo, and URL changes preserve their aspect", async () => {
  vi.useFakeTimers();
  const { store, applies, peer } = setup();
  const remote = peer("older", 0);
  await act(async () => vi.advanceTimersByTimeAsync(10));
  store.setView("presenter", { slide: 2, click: 1 });
  remote.publish({ nav: { slide: 4, click: 1 }, aspect: 4 / 3 });
  await act(async () => vi.advanceTimersByTimeAsync(10));
  expect(window.location.hash).toBe("#/presenter/4?clicks=1");
  window.history.replaceState(null, "", "/?kept=yes#/overview/4?clicks=1");
  window.dispatchEvent(new PopStateEvent("popstate"));
  act(() => applies.at(-1)?.());
  expect(store.getState()).toMatchObject({
    view: "overview",
    audienceAspect: 4 / 3,
    nav: { slide: 4, click: 1 },
  });
  expect(remote.received).toEqual([]);
});

it("a newcomer answer and publications carry the logical position before presentation", async () => {
  vi.useFakeTimers();
  const { store, peer } = setup();
  const existing = peer("existing", performance.timeOrigin + performance.now() + 100);
  await act(async () => vi.advanceTimersByTimeAsync(10));
  store.dispatch({ type: "nextSlide" });
  const newcomer = peer("newcomer", performance.timeOrigin + performance.now() + 200);
  await act(async () => vi.advanceTimersByTimeAsync(10));
  for (const actor of [existing, newcomer])
    expect(actor.received.at(-1)?.nav).toEqual({ slide: 2, click: 0 });
  expect(store.getState().nav.slide).toBe(1);
});

it("resize uses the logical view and position including a view switch before its trailing publish", async () => {
  vi.useFakeTimers();
  const width = window.innerWidth;
  onTestFinished(() => {
    window.innerWidth = width;
  });
  const { store, peer } = setup();
  const existing = peer("existing", performance.timeOrigin + performance.now() + 100);
  await act(async () => vi.advanceTimersByTimeAsync(10));
  store.dispatch({ type: "nextSlide" });
  window.innerWidth = width + 100;
  window.dispatchEvent(new Event("resize"));
  await act(async () => vi.advanceTimersByTimeAsync(260));
  expect(existing.received.at(-1)).toEqual({
    nav: { slide: 2, click: 0 },
    aspect: (width + 100) / window.innerHeight,
  });
  const count = existing.received.length;
  window.innerWidth = width + 200;
  window.dispatchEvent(new Event("resize"));
  store.setView("presenter");
  await act(async () => vi.advanceTimersByTimeAsync(260));
  expect(existing.received).toHaveLength(count);
});

it("a resize after entering play is published even while the presented view is still presenter", async () => {
  vi.useFakeTimers();
  const width = window.innerWidth;
  onTestFinished(() => {
    window.innerWidth = width;
  });
  const { store, applies, peer } = setup();
  store.setView("presenter");
  act(() => applies[0]?.());
  const existing = peer("existing", performance.timeOrigin + performance.now() + 100);
  await act(async () => vi.advanceTimersByTimeAsync(10));
  store.setView("play", { slide: 3, click: 0 });
  window.innerWidth = width + 100;
  window.dispatchEvent(new Event("resize"));
  await act(async () => vi.advanceTimersByTimeAsync(260));
  expect(store.getState().view).toBe("presenter");
  expect(existing.received.at(-1)).toEqual({
    nav: { slide: 3, click: 0 },
    aspect: (width + 100) / window.innerHeight,
  });
});
