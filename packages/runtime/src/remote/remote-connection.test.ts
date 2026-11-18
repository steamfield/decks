import { act, screen } from "@testing-library/react";
import { expect, it, onTestFinished, vi } from "vitest";
import { install } from "../deck.test-support";
import { deck, remotePage } from "./remote.test-support";

function clock() {
  vi.useFakeTimers();
  onTestFinished(() => {
    vi.useRealTimers();
  });
  vi.setSystemTime(new Date(2026, 0, 1, 13, 45));
  return (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
}

it("a missed pong shows Disconnected since and reconnects with growing backoff up to 10 seconds", async () => {
  const advance = clock();
  install(globalThis, "fetch", async () => new Response(null, { status: 503 }));
  const page = remotePage();
  page.present();
  await advance(5000);
  expect(page.sent).toEqual([{ type: "ping" }]);
  page.deliver({ type: "pong" });
  await advance(4999);
  page.position(1, 1, 2000);
  await advance(9999);
  expect(page.sent).toEqual([{ type: "ping" }, { type: "ping" }, { type: "ping" }]);
  expect(screen.queryByText(/Disconnected since/)).toBeNull();
  await advance(1);
  expect(screen.getByText("Disconnected since 13:45:19")).toBeVisible();
  const start = Date.now();
  let offset = 0;
  for (const delay of [1000, 2000, 4000, 8000, 10000]) {
    offset += delay;
    await advance(delay);
    expect(page.sockets.at(-1)?.at).toBe(start + offset);
    act(() => page.sockets.at(-1)?.close());
  }
  await advance(10000);
  expect(page.sockets.at(-1)?.at).toBe(start + offset + 10000);
  act(() => page.sockets.at(-1)?.open());
  page.deliver({ type: "deck", deck });
  page.position(2, 0, 90000);
  expect(screen.queryByText(/Disconnected since/)).toBeNull();
  expect(screen.getByRole("heading", { name: "Departure" })).toBeVisible();
  expect(screen.getByLabelText("Elapsed time")).toHaveTextContent("01:30");
});

it("a refused reconnect shows the expired-link message and stops retrying", async () => {
  const advance = clock();
  const probes: { url: string; cache?: RequestCache }[] = [];
  install(globalThis, "fetch", async (url: string | URL, options: RequestInit) => {
    probes.push({ url: String(url), cache: options.cache });
    return new Response(null, { status: 403 });
  });
  const page = remotePage();
  page.present();
  act(() => page.sockets[0]?.close());
  expect(screen.getByText("Disconnected since 13:45:00")).toBeVisible();
  await advance(1000);
  await act(async () => page.sockets[1]?.close());
  expect(probes).toEqual([{ url: location.href, cache: "no-store" }]);
  expect(
    screen.getByText("This link has expired. Scan the new code from the laptop."),
  ).toBeVisible();
  await advance(60000);
  expect(page.sockets).toHaveLength(2);
});

it("a live replacement socket shows Waiting for the deck until its position arrives", async () => {
  const advance = clock();
  const page = remotePage();
  page.present();
  act(() => page.sockets[0]?.close());
  await advance(1000);
  act(() => page.sockets[1]?.open());
  page.deliver({ type: "pong" });
  expect(screen.getByRole("status")).toHaveTextContent("Waiting for the deck");
  page.deliver({ type: "deck", deck });
  expect(screen.getByRole("status")).toHaveTextContent("Waiting for the deck");
  page.position(2);
  expect(screen.getByRole("heading", { name: "Departure" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
});

it("a stalled token check does not hide a later refusal", async () => {
  const advance = clock();
  let online = false;
  install(globalThis, "fetch", async (_url: string, options: RequestInit) => {
    if (online) return new Response(null, { status: 403 });
    return new Promise<Response>((_resolve, reject) => {
      options.signal?.addEventListener("abort", () =>
        reject(new DOMException("Aborted", "AbortError")),
      );
    });
  });
  const page = remotePage();
  act(() => page.sockets[0]?.close());
  await advance(1000);
  await act(async () => page.sockets[1]?.close());
  online = true;
  for (const delay of [2000, 4000, 8000]) {
    await advance(delay);
    await act(async () => page.sockets.at(-1)?.close());
  }
  expect(screen.getByRole("status")).toHaveTextContent("This link has expired.");
});

it("malformed relay frames leave the last notes visible and a later position still arrives", () => {
  const page = remotePage();
  page.present();
  const validSlide = deck.slides[0];
  for (const frame of [
    "{",
    "null",
    '{"type":"new-protocol"}',
    '{"type":"deck","deck":{}}',
    '{"type":"position","click":1,"slide":1e400,"elapsed":0}',
    '{"type":"position","click":"1","slide":1,"elapsed":0}',
    '{"type":"position","click":1,"slide":1,"elapsed":"started"}',
    ...[
      { ...validSlide, title: 3 },
      { ...validSlide, clicks: null },
      { ...validSlide, notes: [{ click: 1, html: 4 }] },
    ].map((slide) =>
      JSON.stringify({ type: "deck", deck: { title: "Field notes", slides: [slide] } }),
    ),
  ]) {
    act(() => page.sockets[0]?.frame(frame));
    expect(screen.getByRole("heading", { name: "Arrival" })).toBeVisible();
    expect(screen.getByText("Introduce the site.")).toBeVisible();
  }
  page.position(2);
  expect(screen.getByRole("heading", { name: "Departure" })).toBeVisible();
});

it("unmounting a disconnected remote cancels its pending retry", async () => {
  const advance = clock();
  const page = remotePage();
  act(() => page.sockets[0]?.close());
  page.dispose();
  await advance(15000);
  expect(page.sockets).toHaveLength(1);
  expect(screen.queryByRole("status")).toBeNull();
});

it("a second disconnect before resynchronization still shows the last received notes", async () => {
  const advance = clock();
  const page = remotePage();
  page.present();
  page.position(1, 2);
  act(() => page.sockets[0]?.close());
  await advance(1000);
  act(() => page.sockets[1]?.open());
  page.deliver({ type: "deck", deck });
  act(() => page.sockets[1]?.close());
  expect(screen.getByRole("status")).toHaveTextContent("Disconnected since");
  expect(screen.getByText("click 2 of 3")).toBeVisible();
  expect(screen.getByRole("region", { name: "Notes" })).toHaveTextContent("Describe the river.");
});
