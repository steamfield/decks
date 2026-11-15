import { gsap, useTimeline, useTween } from "@react-decks/motion";
import { act, screen } from "@testing-library/react";
import { createElement } from "react";
import { expect, it, onTestFinished } from "vitest";
import { DUR, prefersReducedMotion, resolvePosition } from "../index";
import { setup, tick } from "../kit.test-support";

function Probe() {
  const state = useTween({ x: 0 });
  useTimeline((tl, beat) => {
    beat(0);
    for (let n = 1; n <= 3; n++) {
      tl.to(state, { x: n, duration: DUR.scale, ease: "none" });
      beat(n);
    }
  });
  return createElement("output", { "aria-label": "Position" }, state.x.toFixed(3));
}
const position = () => Number(screen.getByLabelText("Position").textContent);

it("preserves normal timing but bounds interrupted forward travel to one beat", async () => {
  const view = await setup(Probe);
  await view.next();
  await tick(DUR.scale / 10);
  expect(position()).toBe(0.1);
  const before = position();
  await view.next();
  await tick(0);
  expect(position()).toBe(before);
  await tick(DUR.scale);
  expect(position()).toBe(2);
});

it("bounds interrupted reverse travel and lands exactly on the requested beat", async () => {
  const view = await setup(Probe, { click: 3 });
  await view.previous();
  await tick(DUR.scale / 10);
  expect(position()).toBe(2.9);
  const before = position();
  await view.previous();
  await tick(0);
  expect(position()).toBe(before);
  await tick(DUR.scale);
  expect(position()).toBe(1);
});

it("seeks immediately on a jump or when the slide becomes inactive", async () => {
  const view = await setup(Probe);
  await act(async () => view.store.dispatch({ type: "go", slide: 1, click: 2 }));
  expect(position()).toBe(2);
  await view.next();
  await tick(DUR.scale / 10);
  expect(position()).toBe(2.1);
  await act(async () => view.store.dispatch({ type: "nextSlide" }));
  expect(position()).toBe(3);
});

it("resolves numeric, label, recent, end and relative positions before group insertion", () => {
  const tl = gsap.timeline({ paused: true });
  onTestFinished(() => {
    tl.kill();
  });
  expect(resolvePosition(tl, "<")).toBe(0);
  tl.to({ x: 0 }, { x: 1, duration: DUR.scale }, DUR.card);
  tl.addLabel("stop", DUR.card);
  const end = tl.duration();
  expect(resolvePosition(tl, 0.5)).toBe(0.5);
  expect(resolvePosition(tl, "stop")).toBe(DUR.card);
  expect(resolvePosition(tl, "<")).toBe(DUR.card);
  expect(resolvePosition(tl, ">")).toBe(end);
  expect(resolvePosition(tl, undefined)).toBe(end);
  expect(resolvePosition(tl, "missing")).toBe(end);
  expect(resolvePosition(tl, "+=0.14")).toBe(end + 0.14);
  expect(resolvePosition(tl, "-=0.14")).toBe(end - 0.14);
  expect(resolvePosition(tl, "-=99")).toBe(0);
});

it("reads the runtime's live or instant motion policy", async () => {
  await setup(Probe);
  expect(prefersReducedMotion()).toBe(false);
  document.documentElement.setAttribute("data-deck-motion", "instant");
  expect(prefersReducedMotion()).toBe(true);
});
