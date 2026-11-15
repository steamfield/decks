import { act } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, onTestFinished, vi } from "vitest";
import { deliver, setupWindowSync as setup } from "../deck.test-support";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

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
