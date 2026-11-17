import { TERM_ATTACH, TERM_GONE, TERM_POSITION, TERM_READY } from "@react-decks/core";
import { useSlide } from "@react-decks/runtime";
import { act, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { setup } from "../kit.test-support";
import type { TermTransport } from "./connection";
import { useLiveTerm } from "./use-live-term";

const pane = { id: "demo", rows: 12, cols: 60, cwd: "temp", commands: ["echo hello", "ls"] };

function Subject({ transport }: { transport: TermTransport }) {
  const { clicks, isActive } = useSlide();
  const live = useLiveTerm(
    transport,
    { ...pane, commands: [...pane.commands] },
    isActive,
    clicks,
    isActive,
  );
  return (
    <>
      {live.live ? "Shell output" : "Recorded hello"}
      {live.reason && <div role="status">{live.reason}</div>}
    </>
  );
}

test("equivalent inline pane specs preserve the connection, click reports and failure status", async () => {
  const sent: { event: string; data: unknown }[] = [];
  const listeners = new Map<string, Set<(data: unknown) => void>>();
  const transport: TermTransport = {
    on(event, receive) {
      const handlers = listeners.get(event) ?? new Set();
      handlers.add(receive);
      listeners.set(event, handlers);
    },
    off(event, receive) {
      listeners.get(event)?.delete(receive);
    },
    send(event, data) {
      sent.push({ event, data });
    },
  };
  const view = await setup(() => <Subject transport={transport} />);
  expect(screen.getByText("Recorded hello")).toBeVisible();
  expect(sent).toEqual([{ event: TERM_ATTACH, data: { pane } }]);
  await act(async () => {
    for (const receive of listeners.get(TERM_READY) ?? []) receive({ id: "demo", buffer: "hello" });
  });
  expect(screen.getByText("Shell output")).toBeVisible();
  await view.next();
  expect(sent).toEqual([
    { event: TERM_ATTACH, data: { pane } },
    { event: TERM_POSITION, data: { id: "demo", click: 1, entered: false } },
  ]);
  await act(async () => {
    for (const receive of listeners.get(TERM_GONE) ?? [])
      receive({ id: "demo", reason: "Shell exited (1)" });
  });
  expect(screen.getByText("Recorded hello")).toBeVisible();
  expect(screen.getByRole("status")).toHaveTextContent("Shell exited (1)");
  await act(async () => {
    for (const receive of listeners.get("vite:ws:disconnect") ?? []) receive({});
  });
  expect(screen.getByRole("status")).toHaveTextContent("connection lost");
});
