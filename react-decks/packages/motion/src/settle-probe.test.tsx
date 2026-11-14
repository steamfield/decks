import { type DeckSource, mountDeck } from "@react-decks/runtime";
import { act } from "@testing-library/react";
import { expect, it, onTestFinished, vi } from "vitest";
import { gsap } from "./index";

function mount() {
  vi.useFakeTimers();
  const source: DeckSource = {
    manifest: {
      name: "probe",
      title: "Probe",
      canvas: { width: 1920, height: 1080 },
      slides: [{ no: 1, id: "one", title: "One", file: "one.mdx", clicks: 0 }],
    },
    slides: { one: async () => ({ default: () => <h1>Probe</h1> }) },
    components: {},
    frontmatter: {},
  };
  const root = document.createElement("div");
  document.body.append(root);
  let unmount = () => {};
  act(() => {
    unmount = mountDeck(source, root);
  });
  onTestFinished(() => {
    act(unmount);
    root.remove();
    vi.useRealTimers();
  });
}

it("settled includes a delayed finite tween nested under a running timeline", async () => {
  mount();
  const timeline = gsap.timeline().to({ x: 0 }, { x: 1, duration: 10, delay: 10 });
  onTestFinished(() => {
    timeline.kill();
  });
  const results: string[] = [];
  const wait = window.__deck?.settled().then(() => results.push("done"));
  await act(async () => vi.advanceTimersByTimeAsync(100));
  expect(results).toEqual([]);
  timeline.totalProgress(1);
  await act(async () => vi.advanceTimersByTimeAsync(100));
  await wait;
  expect(results).toEqual(["done"]);
});

it("settled ignores paused ancestors and an infinite child inside a finite timeline", async () => {
  mount();
  const paused = gsap.timeline({ paused: true }).to({ x: 0 }, { x: 1, duration: 10 });
  const loop = gsap.timeline().to({ x: 0 }, { x: 1, duration: 1, repeat: -1 });
  onTestFinished(() => {
    paused.kill();
    loop.kill();
  });
  const results: string[] = [];
  const wait = window.__deck?.settled().then(() => results.push("done"));
  await act(async () => vi.advanceTimersByTimeAsync(100));
  await wait;
  expect(results).toEqual(["done"]);
});

it("settled waits through a finite parent's repeat delay until its final iteration ends", async () => {
  mount();
  const timeline = gsap
    .timeline({ repeat: 1, repeatDelay: 10 })
    .to({ x: 0 }, { x: 1, duration: 1 });
  onTestFinished(() => {
    timeline.kill();
  });
  timeline.totalTime(2);
  const results: string[] = [];
  const wait = window.__deck?.settled().then(() => results.push("done"));
  await act(async () => vi.advanceTimersByTimeAsync(100));
  expect(results).toEqual([]);
  timeline.totalProgress(1);
  await act(async () => vi.advanceTimersByTimeAsync(100));
  await wait;
  expect(results).toEqual(["done"]);
});
