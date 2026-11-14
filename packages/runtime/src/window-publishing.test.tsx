import { act, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { deliver, setupWindowSync as setup } from "./deck.test-support";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

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
