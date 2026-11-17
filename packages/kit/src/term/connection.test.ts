import {
  TERM_ATTACH,
  TERM_DATA,
  TERM_GONE,
  TERM_INPUT,
  TERM_POSITION,
  TERM_READY,
  TERM_STATE,
} from "@react-decks/core";
import { expect, test } from "vitest";
import { createConnection, type TermTransport } from "./connection";

const stamp = { seq: 1, started: 0, origin: "window" };

function setup() {
  const sent: { event: string; data: unknown }[] = [];
  const events = new EventTarget();
  const handlers = new Map<(data: unknown) => void, EventListener>();
  const transport: TermTransport = {
    on(event, receive) {
      const handler = (message: Event) => {
        if (message instanceof CustomEvent) receive(message.detail);
      };
      handlers.set(receive, handler);
      events.addEventListener(event, handler);
    },
    off(event, receive) {
      const handler = handlers.get(receive);
      if (handler) events.removeEventListener(event, handler);
      handlers.delete(receive);
    },
    send(event, data) {
      sent.push({ event, data });
    },
  };
  const pane = { id: "demo", rows: 24, cols: 92, cwd: "temp", commands: ["ls", "pwd", "date"] };
  const connection = createConnection(transport, pane);
  const emit = (event: string, detail: unknown) =>
    events.dispatchEvent(new CustomEvent(event, { detail }));
  const navigate = (active: boolean, click: number) =>
    connection.navigate(active, click, active, stamp);
  return { connection, sent, pane, emit, navigate };
}

test("an unanswered attach and a reload send no position and keep the recording", () => {
  const { connection, sent, pane, navigate } = setup();
  navigate(true, 2);
  navigate(true, 2);
  expect(sent).toEqual([{ event: TERM_ATTACH, data: { pane } }]);
  expect(connection.getSnapshot()).toEqual({ live: false, busy: false, reason: "", queued: [] });
});

test("an ineligible pane never attaches, reports a position or accepts input", () => {
  const { connection, sent, navigate } = setup();
  navigate(false, 0);
  navigate(false, 1);
  connection.input("ls\r");
  expect(sent).toEqual([]);
});

test("ready replays output and server state preserves its queue through readiness", () => {
  const { connection, emit, navigate } = setup();
  const output: { chunk: string; replay: boolean; immediate: boolean }[] = [];
  navigate(true, 1);
  emit(TERM_STATE, { id: "demo", click: 1, busy: true, ran: [], queued: [1] });
  emit(TERM_READY, { id: "demo", buffer: "old output" });
  connection.subscribeOutput((chunk, replay, immediate) =>
    output.push({ chunk, replay, immediate }),
  );
  emit(TERM_DATA, { id: "demo", chunk: "new output", immediate: true });
  expect(connection.getSnapshot()).toEqual({ live: true, busy: true, reason: "", queued: [1] });
  emit(TERM_STATE, { id: "demo", click: 1, busy: false, ran: [1], queued: [] });
  expect(connection.getSnapshot()).toEqual({ live: true, busy: false, reason: "", queued: [] });
  emit(TERM_READY, { id: "demo", buffer: "fresh" });
  expect(output).toEqual([
    { chunk: "\u001bcold output", replay: true, immediate: false },
    { chunk: "new output", replay: false, immediate: true },
    { chunk: "\u001bcfresh", replay: true, immediate: false },
  ]);
});

test("every active click change reports once, including jumps, steps back and before readiness", () => {
  const { sent, pane, navigate, emit } = setup();
  navigate(true, 0);
  navigate(true, 1);
  emit(TERM_READY, { id: "demo", buffer: "" });
  navigate(true, 3);
  navigate(true, 3);
  navigate(true, 2);
  navigate(true, 0);
  expect(sent).toEqual([
    { event: TERM_ATTACH, data: { pane } },
    ...[1, 3, 2, 0].map((click) => ({
      event: TERM_POSITION,
      data: { id: "demo", click, entered: false, stamp },
    })),
  ]);
});

test.each([0, 3])(
  "activation at click %s attaches then reports entered, even after inactive changes",
  (click) => {
    const { sent, pane, navigate } = setup();
    navigate(false, 0);
    navigate(false, 2);
    navigate(true, click);
    navigate(true, click);
    expect(sent).toEqual([
      { event: TERM_ATTACH, data: { pane } },
      { event: TERM_POSITION, data: { id: "demo", click, entered: true, stamp } },
    ]);
  },
);

test("reenabling motion on an already active slide only attaches", () => {
  const { connection, sent, pane } = setup();
  connection.navigate(false, 0, true, stamp);
  connection.navigate(true, 0, true, stamp);
  expect(sent).toEqual([{ event: TERM_ATTACH, data: { pane } }]);
});

test("gone and a dropped socket return to the recording with a reason", () => {
  const { connection, emit, navigate } = setup();
  navigate(true, 0);
  emit(TERM_READY, { id: "demo", buffer: "" });
  emit(TERM_GONE, { id: "demo", reason: "Shell exited (1)" });
  expect(connection.getSnapshot()).toEqual({
    live: false,
    busy: false,
    reason: "Shell exited (1)",
    queued: [],
  });
  emit(TERM_READY, { id: "demo", buffer: "" });
  emit("vite:ws:disconnect", {});
  expect(connection.getSnapshot()).toEqual({
    live: false,
    busy: false,
    reason: "connection lost",
    queued: [],
  });
});

test("live input reaches the shell and detached panes ignore later messages and keys", () => {
  const { connection, sent, pane, emit, navigate } = setup();
  navigate(true, 1);
  emit(TERM_READY, { id: "demo", buffer: "" });
  connection.input("ls\r");
  navigate(false, 2);
  emit(TERM_READY, { id: "demo", buffer: "stale" });
  emit(TERM_GONE, { id: "demo", reason: "stale" });
  connection.input("ignored");
  expect(connection.getSnapshot()).toEqual({ live: false, busy: false, reason: "", queued: [] });
  navigate(true, 2);
  connection.detach();
  emit(TERM_READY, { id: "demo", buffer: "stale" });
  expect(connection.getSnapshot().live).toBe(false);
  expect(sent).toEqual([
    { event: TERM_ATTACH, data: { pane } },
    { event: TERM_INPUT, data: { id: "demo", data: "ls\r" } },
    { event: TERM_ATTACH, data: { pane } },
    { event: TERM_POSITION, data: { id: "demo", click: 2, entered: true, stamp } },
  ]);
});

test("messages for other panes never change the pane or its output", () => {
  const { connection, emit, navigate } = setup();
  const output: string[] = [];
  connection.subscribeOutput((chunk) => output.push(chunk));
  navigate(true, 0);
  emit(TERM_READY, { id: "other", buffer: "wrong" });
  emit(TERM_DATA, { id: "other", chunk: "wrong" });
  emit(TERM_STATE, { id: "other", click: 1, busy: true, ran: [1], queued: [] });
  emit(TERM_GONE, { id: "other", reason: "wrong" });
  expect(connection.getSnapshot()).toEqual({ live: false, busy: false, reason: "", queued: [] });
  expect(output).toEqual(["\u001bc"]);
});

test("a new output subscriber receives only the bounded 200 KB tail", () => {
  const { connection, emit, navigate } = setup();
  const output: string[] = [];
  navigate(true, 0);
  emit(TERM_READY, { id: "demo", buffer: "a".repeat(200 * 1024) });
  emit(TERM_DATA, { id: "demo", chunk: "new" });
  connection.subscribeOutput((chunk) => output.push(chunk));
  expect(output).toEqual([`\u001bc${"a".repeat(200 * 1024 - 3)}new`]);
});
