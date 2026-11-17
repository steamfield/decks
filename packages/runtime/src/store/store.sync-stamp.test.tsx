import { createMemoryHub, createSyncSession } from "@react-decks/core";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, onTestFinished, test, vi } from "vitest";
import { makeSource } from "../deck.test-support";
import { createDeckStore, Deck, type DeckState, useDeck } from "../index";

function StampedClicks() {
  const deck = useDeck();
  return (
    <>
      <button type="button" onClick={deck.next}>
        Next stamped click
      </button>
      <output aria-label="Stamped click">
        {JSON.stringify({ click: deck.clicks, stamp: deck.syncStamp })}
      </output>
    </>
  );
}

test("an unsynced window exposes its navigation stamp through useDeck before rendering each click", async () => {
  window.history.replaceState(null, "", "/#/2");
  const source = makeSource();
  const stampedSource = {
    ...source,
    slides: { ...source.slides, "slide-2": async () => ({ default: StampedClicks }) },
  };
  const store = createDeckStore(source.manifest);
  const view = render(<Deck source={stampedSource} store={store} />);
  onTestFinished(() => {
    view.unmount();
    store.destroy();
    window.history.replaceState(null, "", "/");
  });
  const user = userEvent.setup();
  const button = await screen.findByRole("button", { name: "Next stamped click" });
  const initial = store.getState().syncStamp;
  expect(initial).toEqual({ seq: 0, started: expect.any(Number), origin: expect.any(String) });
  await user.click(button);
  expect(screen.getByLabelText("Stamped click")).toHaveTextContent(
    JSON.stringify({ click: 1, stamp: { ...initial, seq: 1 } }),
  );
  expect(store.getState().syncStamp).toEqual({ ...initial, seq: 1 });
});

/** A window that joined a deck where another window ("existing") is already presenting. */
async function joinExisting() {
  vi.useFakeTimers();
  onTestFinished(() => {
    vi.useRealTimers();
  });
  window.history.replaceState(null, "", "/#/2");
  const hub = createMemoryHub();
  const applies: (() => void)[] = [];
  let remoteNav = { slide: 2, click: 0 };
  const remote = createSyncSession({
    id: "existing",
    startedAt: 0,
    transport: hub.connect(),
    current: () => ({ nav: remoteNav }),
    onRemote: (next) => {
      remoteNav = next.nav;
    },
  });
  const store = createDeckStore(makeSource().manifest, {
    transport: hub.connect(),
    present(_change, apply) {
      applies.push(apply);
    },
  });
  onTestFinished(() => {
    store.destroy();
    remote.close();
    window.history.replaceState(null, "", "/");
  });
  await vi.runAllTimersAsync();
  return {
    store,
    remote,
    applies,
    publish: async (click: number) => {
      remoteNav = { slide: 2, click };
      remote.publish({ nav: remoteNav });
      await vi.runAllTimersAsync();
      return remoteNav;
    },
  };
}

test("a delayed presentation applies the latest remote position with the stamp it was published under", async () => {
  const { store, remote, applies, publish } = await joinExisting();
  const presented: DeckState[] = [];
  store.subscribe(() => presented.push(store.getState()));
  await publish(1);
  const first = remote.getStamp();
  const latest = await publish(2);
  expect(store.getState().nav.click).toBe(0);
  act(() => {
    for (const apply of applies) apply();
  });
  expect(presented).toEqual([
    expect.objectContaining({ nav: latest, syncStamp: remote.getStamp() }),
  ]);
  expect(store.getState().syncStamp).not.toEqual(first);
});

test("a local step after adopting a remote stamp is published with the next sequence number", async () => {
  const { store, remote, applies, publish } = await joinExisting();
  await publish(1);
  act(() => {
    for (const apply of applies) apply();
  });
  const adopted = store.getState().syncStamp;
  act(() => store.dispatch({ type: "next" }));
  act(() => applies.at(-1)?.());
  const stamp = store.getState().syncStamp;
  expect(stamp.seq).toBe(adopted.seq + 1);
  expect(stamp.origin).not.toBe("existing");
  await vi.runAllTimersAsync();
  expect(remote.getStamp()).toEqual(stamp);
});
