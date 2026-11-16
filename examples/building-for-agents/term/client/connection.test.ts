import { expect, test } from "vitest";
import {
  TERM_ATTACH,
  TERM_DATA,
  TERM_GONE,
  TERM_INPUT,
  TERM_READY,
  TERM_RESET,
  TERM_STATE,
  TERM_STEP,
} from "../protocol";
import { createConnection, type TermTransport } from "./connection";

function setup() {
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
  const pane = { id: "demo", rows: 24, cols: 92, cwd: "temp", commands: ["ls", "pwd", "date"] };
  const connection = createConnection(transport, pane);
  const emit = (event: string, message: unknown) => {
    for (const receive of listeners.get(event) ?? []) receive(message);
  };
  return { connection, sent, pane, emit };
}

test("an unanswered attach keeps the recording without an error", () => {
  const { connection, sent, pane } = setup();
  connection.navigate(true, 0);
  expect(sent).toEqual([{ event: TERM_ATTACH, data: { pane } }]);
  expect(connection.getSnapshot()).toEqual({ live: false, busy: false, reason: "" });
});

test("an ineligible pane never attaches, steps or accepts input", () => {
  const { connection, sent } = setup();
  connection.navigate(false, 0);
  connection.navigate(false, 1);
  connection.input("ls\r");
  expect(sent).toEqual([]);
});

test("ready swaps to live and replays output; busy state changes the tag state", () => {
  const { connection, emit } = setup();
  const output: string[] = [];
  connection.navigate(true, 1);
  emit(TERM_READY, { id: "demo", buffer: "old output" });
  connection.subscribeOutput((chunk) => output.push(chunk));
  emit(TERM_DATA, { id: "demo", chunk: "new output" });
  emit(TERM_STATE, { id: "demo", busy: true, ran: [1] });
  expect(connection.getSnapshot()).toEqual({ live: true, busy: true, reason: "" });
  expect(output).toEqual(["\u001bcold output", "new output"]);
  emit(TERM_READY, { id: "demo", buffer: "fresh" });
  expect(output.at(-1)).toBe("\u001bcfresh");
});

test.each([
  { from: 2, to: 1 },
  { from: 0, to: 2 },
  { from: 3, to: 3 },
])("click $from to $to never sends a step", ({ from, to }) => {
  const { connection, sent, pane, emit } = setup();
  connection.navigate(true, from);
  emit(TERM_READY, { id: "demo", buffer: "" });
  connection.navigate(true, to);
  expect(sent).toEqual([{ event: TERM_ATTACH, data: { pane } }]);
});

test("arrival at the last click sends no step, including after inactive changes", () => {
  const { connection, sent, pane, emit } = setup();
  connection.navigate(false, 0);
  connection.navigate(false, 2);
  connection.navigate(true, 3);
  emit(TERM_READY, { id: "demo", buffer: "" });
  expect(sent).toEqual([{ event: TERM_ATTACH, data: { pane } }]);
});

test("one forward click sends one step while live, including a busy attempt for the server to reject", () => {
  const { connection, sent, pane, emit } = setup();
  connection.navigate(true, 0);
  connection.navigate(true, 1);
  emit(TERM_READY, { id: "demo", buffer: "" });
  connection.navigate(true, 2);
  connection.navigate(true, 2);
  emit(TERM_STATE, { id: "demo", busy: true, ran: [2] });
  connection.navigate(true, 3);
  expect(sent).toEqual([
    { event: TERM_ATTACH, data: { pane } },
    { event: TERM_STEP, data: { id: "demo", click: 2 } },
    { event: TERM_STEP, data: { id: "demo", click: 3 } },
  ]);
});

test("observed activation at click zero attaches then resets, but a mount or reload only attaches", () => {
  const { connection, sent, pane } = setup();
  connection.navigate(false, 0);
  connection.navigate(true, 0);
  connection.navigate(true, 0);
  expect(sent).toEqual([
    { event: TERM_ATTACH, data: { pane } },
    { event: TERM_RESET, data: { id: "demo" } },
  ]);
  const fresh = setup();
  fresh.connection.navigate(true, 0);
  expect(fresh.sent).toEqual([{ event: TERM_ATTACH, data: { pane } }]);
});

test("navigating back to click zero resets even within one visit", () => {
  const { connection, sent, pane } = setup();
  connection.navigate(true, 2);
  connection.navigate(true, 0);
  expect(sent).toEqual([
    { event: TERM_ATTACH, data: { pane } },
    { event: TERM_RESET, data: { id: "demo" } },
  ]);
});

test("gone and a dropped socket return to the recording with a reason", () => {
  const { connection, emit } = setup();
  connection.navigate(true, 0);
  emit(TERM_READY, { id: "demo", buffer: "" });
  emit(TERM_GONE, { id: "demo", reason: "Shell exited (1)" });
  expect(connection.getSnapshot()).toEqual({
    live: false,
    busy: false,
    reason: "Shell exited (1)",
  });
  emit(TERM_READY, { id: "demo", buffer: "" });
  emit("vite:ws:disconnect", {});
  expect(connection.getSnapshot()).toEqual({ live: false, busy: false, reason: "connection lost" });
});

test("input is sent while live and leaving the slide or unmounting detaches all handlers", () => {
  const { connection, sent, pane, emit } = setup();
  connection.navigate(true, 1);
  emit(TERM_READY, { id: "demo", buffer: "" });
  connection.input("ls\r");
  connection.navigate(false, 2);
  emit(TERM_READY, { id: "demo", buffer: "stale" });
  emit(TERM_GONE, { id: "demo", reason: "stale" });
  connection.input("ignored");
  expect(connection.getSnapshot()).toEqual({ live: false, busy: false, reason: "" });
  connection.navigate(true, 2);
  connection.detach();
  emit(TERM_READY, { id: "demo", buffer: "stale" });
  expect(connection.getSnapshot().live).toBe(false);
  expect(sent).toEqual([
    { event: TERM_ATTACH, data: { pane } },
    { event: TERM_INPUT, data: { id: "demo", data: "ls\r" } },
    { event: TERM_ATTACH, data: { pane } },
  ]);
});

test("messages for other panes never change the pane or its output", () => {
  const { connection, emit } = setup();
  const output: string[] = [];
  connection.subscribeOutput((chunk) => output.push(chunk));
  connection.navigate(true, 0);
  emit(TERM_READY, { id: "other", buffer: "wrong" });
  emit(TERM_DATA, { id: "other", chunk: "wrong" });
  emit(TERM_STATE, { id: "other", busy: true, ran: [1] });
  emit(TERM_GONE, { id: "other", reason: "wrong" });
  expect(connection.getSnapshot()).toEqual({ live: false, busy: false, reason: "" });
  expect(output).toEqual(["\u001bc"]);
});
