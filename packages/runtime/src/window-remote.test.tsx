import { act } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { deliver, setupWindowSync as setup } from "./deck.test-support";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

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

it("concurrent local and remote publications do not echo the remote state", async () => {
  const { store, peer } = setup();
  const remote = peer();
  await deliver();
  act(() => store.dispatch({ type: "go", slide: 3 }));
  remote.publish({ nav: { slide: 2, click: 3 } });
  await deliver();
  expect(remote.applied).toEqual([]);
});
