import { TERM_STATE } from "@react-decks/core";
import { expect, test, vi } from "vitest";
import { marker, pane, setup } from "./sessions.test-support";

test("a forward position of one queues its command before the shell is ready", async () => {
  const { sessions, shell, a } = setup();
  sessions.attach(pane, a.socket);
  sessions.position("demo", 1, false, a.socket);
  expect(a.received.at(-1)).toEqual({
    event: TERM_STATE,
    data: { id: "demo", click: 1, busy: true, queued: [1], ran: [] },
  });
  expect(shell().writes).toEqual([]);
  shell().data(marker);
  await vi.advanceTimersByTimeAsync(600);
  expect(shell().writes).toEqual(["sleep 3", "\r"]);
});

test.each([false, true])("returning to zero resets a used session with entered=%s", (entered) => {
  const { sessions, shells, shell, a } = setup();
  sessions.attach(pane, a.socket);
  shell().data(marker);
  sessions.position("demo", 1, false, a.socket);
  sessions.position("demo", 0, entered, a.socket);
  shell().data(marker);
  expect(shells).toHaveLength(2);
  expect(shell().writes).toEqual([]);
  expect(a.received.at(-1)).toEqual({
    event: TERM_STATE,
    data: { id: "demo", click: 0, busy: false, queued: [], ran: [] },
  });
  sessions.position("demo", 1, false, a.socket);
  expect(shell().writes).toEqual(["sleep 3"]);
});

test("repeats, jumps, steps back and already run commands only move the position", async () => {
  const { sessions, shell, a } = setup();
  sessions.attach(pane, a.socket);
  shell().data(marker);
  sessions.position("demo", 1, false, a.socket);
  await vi.advanceTimersByTimeAsync(600);
  shell().data(marker);
  for (const click of [1, 4, 1]) {
    sessions.position("demo", click, false, a.socket);
    expect(a.received.at(-1)).toEqual({
      event: TERM_STATE,
      data: { id: "demo", click, busy: false, queued: [], ran: [1] },
    });
  }
  expect(shell().writes).toEqual(["sleep 3", "\r"]);
});

test("a late position from one window cannot suppress another window's next command", async () => {
  const { sessions, shell, a, b } = setup();
  const three = { ...pane, commands: [...pane.commands, "echo third"] };
  sessions.attach(three, a.socket);
  sessions.attach(three, b.socket);
  for (const click of [1, 2]) sessions.position("demo", click, false, a.socket);
  sessions.position("demo", 1, false, b.socket);
  sessions.position("demo", 3, false, a.socket);
  for (const _ of [1, 2, 3]) {
    shell().data(marker);
    await vi.advanceTimersByTimeAsync(600);
  }
  shell().data(marker);
  expect(shell().writes).toEqual(["sleep 3", "\r", "echo done", "\r", "echo third", "\r"]);
  expect(a.received.at(-1)).toEqual({
    event: TERM_STATE,
    data: { id: "demo", click: 3, busy: false, queued: [], ran: [1, 2, 3] },
  });
});

test("two windows reporting 1, 2, 1, 2 run each command once", async () => {
  const { sessions, shell, a, b } = setup();
  sessions.attach(pane, a.socket);
  sessions.attach(pane, b.socket);
  shell().data(marker);
  sessions.position("demo", 1, false, a.socket);
  sessions.position("demo", 2, false, a.socket);
  sessions.position("demo", 1, false, b.socket);
  sessions.position("demo", 2, false, b.socket);
  for (const _ of [1, 2]) {
    await vi.advanceTimersByTimeAsync(600);
    shell().data(marker);
  }
  expect(shell().writes).toEqual(["sleep 3", "\r", "echo done", "\r"]);
  expect(a.received.at(-1)).toEqual({
    event: TERM_STATE,
    data: { id: "demo", click: 2, busy: false, queued: [], ran: [1, 2] },
  });
  expect(b.received.at(-1)).toEqual(a.received.at(-1));
  sessions.position("demo", 1, false, a.socket);
  sessions.position("demo", 2, false, a.socket);
  await vi.advanceTimersByTimeAsync(600);
  shell().data(marker);
  expect(shell().writes).toEqual(["sleep 3", "\r", "echo done", "\r"]);
});

test("entering at zero resets manual input even when the server is already at zero", () => {
  const { sessions, shells, shell, a } = setup();
  sessions.attach(pane, a.socket);
  shell().data(marker);
  sessions.input("demo", "pwd", a.socket);
  sessions.position("demo", 0, false, a.socket);
  expect(shells).toHaveLength(1);
  sessions.position("demo", 0, true, a.socket);
  expect(shells).toHaveLength(2);
  expect(shell().writes).toEqual([]);
});

test("returning to zero drops queued commands without restarting an unused shell", async () => {
  const { sessions, shells, shell, a, b } = setup();
  sessions.attach(pane, a.socket);
  sessions.position("demo", 1, false, a.socket);
  sessions.position("demo", 2, false, a.socket);
  sessions.position("demo", 0, true, a.socket);
  sessions.position("demo", 0, true, b.socket);
  shell().data(marker);
  await vi.advanceTimersByTimeAsync(600);
  shell().data(marker);
  expect(shells).toHaveLength(1);
  expect(shell().writes).toEqual([]);
  expect(a.received.at(-1)).toEqual({
    event: TERM_STATE,
    data: { id: "demo", click: 0, busy: false, queued: [], ran: [] },
  });
});
