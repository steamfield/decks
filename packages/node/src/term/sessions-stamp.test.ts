import { type SyncStamp, TERM_STATE } from "@react-decks/core";
import { expect, test, vi } from "vitest";
import { marker, pane, setup } from "./sessions.test-support";

test("a late entered report cannot reset a newer command, including across a reset and spec edit", async () => {
  const { sessions, shells, shell, a, b } = setup();
  sessions.attach(pane, a.socket);
  sessions.attach(pane, b.socket);
  shell().data(marker);
  const report = (click: number, seq: number, entered = false, client = a.socket) =>
    sessions.position(pane.id, click, entered, client, { seq, started: 1, origin: "a" });
  report(0, 1, true);
  report(1, 2);
  report(0, 1, true, b.socket);
  report(1, 2, false, b.socket);
  await vi.advanceTimersByTimeAsync(600);
  shell().data(marker);
  expect(shells).toHaveLength(1);
  expect(shell().writes).toEqual(["sleep 3", "\r"]);
  report(0, 3, true);
  report(1, 2, false, b.socket);
  shell().data(marker);
  expect(shells).toHaveLength(2);
  expect(shell().writes).toEqual([]);
  sessions.attach({ ...pane, cols: 60 }, b.socket);
  shell().data(marker);
  report(1, 2, false, b.socket);
  expect(shells).toHaveLength(3);
  expect(shell().writes).toEqual([]);
  report(1, 4);
  await vi.advanceTimersByTimeAsync(600);
  expect(shell().writes).toEqual(["sleep 3", "\r"]);
});

test.each([
  { seq: 5, started: 10, origin: "a" },
  { seq: 5, started: 0, origin: "0" },
] satisfies SyncStamp[])("sync ties reject older started/origin $started $origin", (older) => {
  const { sessions, shells, shell, a } = setup();
  sessions.attach(pane, a.socket);
  shell().data(marker);
  sessions.position(pane.id, 1, false, a.socket, { seq: 5, started: 0, origin: "a" });
  sessions.position(pane.id, 0, true, a.socket, older);
  expect(shells).toHaveLength(1);
  expect(a.received.at(-1)).toEqual({
    event: TERM_STATE,
    data: { id: pane.id, click: 1, busy: true, ran: [1], queued: [] },
  });
});

test("only the last detach forgets the watermark, so a sole reloaded window can run the next command", async () => {
  const { sessions, shell, a, b } = setup();
  sessions.attach(pane, a.socket);
  sessions.attach(pane, b.socket);
  shell().data(marker);
  sessions.position(pane.id, 1, false, a.socket, { seq: 99, started: 0, origin: "a" });
  await vi.advanceTimersByTimeAsync(600);
  shell().data(marker);
  sessions.detach(a.socket);
  sessions.position(pane.id, 2, false, b.socket, { seq: 1, started: 100, origin: "b" });
  expect(shell().writes).toEqual(["sleep 3", "\r"]);
  sessions.detach(b.socket);
  sessions.attach(pane, a.socket);
  sessions.position(pane.id, 2, false, a.socket, { seq: 1, started: 200, origin: "reload" });
  await vi.advanceTimersByTimeAsync(600);
  shell().data(marker);
  expect(shell().writes).toEqual(["sleep 3", "\r", "echo done", "\r"]);
});
