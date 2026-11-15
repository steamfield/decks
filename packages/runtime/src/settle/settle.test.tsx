import { act, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { expect, it, onTestFinished, vi } from "vitest";
import { makeSource } from "../deck.test-support";
import { mountDeck, registerSettleProbe } from "../index";

it.each(["#/1", "#/presenter/1", "#/overview", "#/print"])(
  "settled waits for a lazy slide to render in %s",
  async (hash) => {
    vi.useFakeTimers();
    onTestFinished(() => {
      vi.useRealTimers();
    });
    window.history.replaceState(null, "", `/${hash}`);
    const source = makeSource();
    const module = Promise.withResolvers<{ default: () => ReactElement }>();
    const root = document.createElement("div");
    document.body.append(root);
    let unmount = () => {};
    act(() => {
      unmount = mountDeck(
        {
          ...source,
          slides: Object.fromEntries(
            source.manifest.slides.map(({ id }) => [
              id,
              id === "slide-1"
                ? () => module.promise
                : async () => ({ default: () => <p>{id}</p> }),
            ]),
          ),
        },
        root,
      );
    });
    onTestFinished(() => {
      act(unmount);
      root.remove();
      window.history.replaceState(null, "", "/");
    });
    const results: string[] = [];
    const wait = window.__deck?.settled().then(() => results.push("settled"));
    await act(async () => vi.advanceTimersByTimeAsync(100));
    expect(results).toEqual([]);
    await act(async () => {
      module.resolve({ default: () => <h1>Lazy slide arrived</h1> });
    });
    await act(async () => vi.advanceTimersByTimeAsync(500));
    await wait;
    expect(screen.getByRole("heading", { name: "Lazy slide arrived" })).toBeVisible();
    expect(results).toEqual(["settled"]);
  },
);

it("settled waits two consecutive quiet frames and unregister removes a busy probe", async () => {
  vi.useFakeTimers();
  onTestFinished(() => {
    vi.useRealTimers();
  });
  const root = document.createElement("div");
  document.body.append(root);
  let unmount = () => {};
  act(() => {
    unmount = mountDeck(makeSource(), root);
  });
  onTestFinished(() => {
    act(unmount);
    root.remove();
  });
  await act(async () => vi.advanceTimersByTimeAsync(20));
  expect(screen.getByRole("heading", { name: "Title 1" })).toBeVisible();
  let busy = true;
  const remove = registerSettleProbe(() => busy);
  onTestFinished(remove);
  const results: string[] = [];
  const wait = window.__deck?.settled().then(() => results.push("settled"));
  await act(async () => vi.advanceTimersToNextFrame());
  expect(results).toEqual([]);
  busy = false;
  await act(async () => vi.advanceTimersToNextFrame());
  expect(results).toEqual([]);
  busy = true;
  await act(async () => vi.advanceTimersToNextFrame());
  remove();
  await act(async () => vi.advanceTimersToNextFrame());
  expect(results).toEqual([]);
  await act(async () => vi.advanceTimersToNextFrame());
  await wait;
  expect(results).toEqual(["settled"]);
  act(unmount);
  expect(window.__deck).toBeUndefined();
});
