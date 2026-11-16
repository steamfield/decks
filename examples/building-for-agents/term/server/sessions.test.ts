import { expect, test, vi } from "vitest";
import { TERM_DATA, TERM_GONE, TERM_READY, TERM_STATE } from "../protocol";
import { marker, pane, setup } from "./sessions.test-support";

test("attach starts one shell and both early clients become ready at its first split prompt", () => {
  const { sessions, shells, shell, a, b } = setup();
  sessions.attach(pane, a.socket);
  sessions.attach(pane, b.socket);
  expect(shells).toHaveLength(1);
  expect(shell().spec).toEqual({
    rows: 24,
    cols: 92,
    cwd: "/temp/0",
    env: { TERM: "xterm-256color" },
  });
  shell().data(marker.slice(0, 3));
  expect(a.received).toEqual([]);
  shell().data(`${marker.slice(3)}$ `);
  expect(a.received).toEqual([
    { event: TERM_READY, data: { id: "demo", buffer: "" } },
    { event: TERM_DATA, data: { id: "demo", chunk: `${marker}$ ` } },
    { event: TERM_STATE, data: { id: "demo", busy: false, ran: [], queued: [] } },
  ]);
  expect(b.received).toEqual(a.received);
});

test("a later attach replays the bounded buffer and state without resetting the shared shell", async () => {
  const { sessions, shells, shell, a, b } = setup();
  sessions.attach({ ...pane, cwd: "repo" }, a.socket);
  shell().data(marker);
  sessions.step(pane.id, 1, a.socket);
  await vi.advanceTimersByTimeAsync(600);
  shell().data("λ".repeat(210 * 1024));
  shell().data("tail");
  sessions.attach(pane, b.socket);
  expect(shells).toHaveLength(1);
  expect(shell().spec.cwd).toBe("/repository");
  expect(b.received).toEqual([
    { event: TERM_READY, data: { id: "demo", buffer: `${"λ".repeat(100 * 1024 - 2)}tail` } },
    { event: TERM_STATE, data: { id: "demo", busy: true, ran: [1], queued: [] } },
  ]);
  shell().data("shared");
  expect(a.received.at(-1)).toEqual(b.received.at(-1));
});

test("a step types once and waits before its carriage return, and a prompt makes it idle", async () => {
  const { sessions, shell, a } = setup();
  sessions.attach(pane, a.socket);
  shell().data(marker);
  sessions.step("demo", 1, a.socket);
  expect(a.received.at(-1)).toEqual({
    event: TERM_STATE,
    data: { id: "demo", busy: true, ran: [1], queued: [] },
  });
  expect(shell().writes).toEqual(["sleep 3"]);
  shell().data("sleep 3");
  expect(a.received.at(-1)).toEqual({
    event: TERM_DATA,
    data: { id: "demo", chunk: "sleep 3", immediate: true },
  });
  await vi.advanceTimersByTimeAsync(599);
  expect(shell().writes).toEqual(["sleep 3"]);
  await vi.advanceTimersByTimeAsync(1);
  expect(shell().writes).toEqual(["sleep 3", "\r"]);
  shell().data("\r\ndone\r\n");
  expect(a.received.at(-1)).toEqual({
    event: TERM_DATA,
    data: { id: "demo", chunk: "\r\ndone\r\n" },
  });
  shell().data(marker);
  sessions.step("demo", 1, a.socket);
  expect(shell().writes).toEqual(["sleep 3", "\r"]);
  expect(a.received.at(-1)).toEqual({
    event: TERM_STATE,
    data: { id: "demo", busy: false, ran: [1], queued: [] },
  });
});

test("input reaches the shell and a detached client stops receiving output", () => {
  const { sessions, shell, a, b } = setup();
  sessions.attach(pane, a.socket);
  sessions.attach(pane, b.socket);
  shell().data(marker);
  sessions.input("demo", "ls\r", a.socket);
  sessions.detach(a.socket);
  const before = [...a.received];
  shell().data("files");
  expect(shell().writes).toEqual(["ls\r"]);
  expect(a.received).toEqual(before);
  expect(b.received.at(-1)).toEqual({ event: TERM_DATA, data: { id: "demo", chunk: "files" } });
});

test("reset while busy kills the old shell, forgets ran clicks and uses a new temporary directory", async () => {
  const { sessions, shells, shell, a, b } = setup();
  sessions.attach(pane, a.socket);
  sessions.attach(pane, b.socket);
  const old = shell();
  old.data(marker);
  sessions.step("demo", 1, a.socket);
  await vi.advanceTimersByTimeAsync(600);
  sessions.reset("demo", a.socket);
  expect(old.killed).toBe(true);
  expect(shells).toHaveLength(2);
  expect(shell().spec.cwd).toBe("/temp/1");
  old.exit("late exit");
  old.data(marker);
  shell().data(marker);
  expect(a.received.at(-1)).toEqual({
    event: TERM_STATE,
    data: { id: "demo", busy: false, ran: [], queued: [] },
  });
  expect(a.received).toEqual(b.received);
  sessions.reset("demo", b.socket);
  expect(shells).toHaveLength(2);
  sessions.step("demo", 1, a.socket);
  expect(shell().writes).toEqual(["sleep 3"]);
});

test("a reset on a fresh idle session does nothing", () => {
  const { sessions, shells, shell, a } = setup();
  sessions.attach(pane, a.socket);
  shell().data(marker);
  sessions.reset("demo", a.socket);
  expect(shells).toHaveLength(1);
  expect(shell().killed).toBe(false);
  expect(shell().writes).toEqual([]);
});

test.each(["reset", "exit"])(
  "%s during command typing cancels the pending carriage return",
  async (action) => {
    const { sessions, shell, a } = setup();
    sessions.attach(pane, a.socket);
    const old = shell();
    old.data(marker);
    sessions.step("demo", 1, a.socket);
    if (action === "reset") sessions.reset("demo", a.socket);
    else old.exit("Shell exited (0)");
    await vi.advanceTimersByTimeAsync(600);
    expect(old.writes).toEqual(["sleep 3"]);
    if (action === "reset") expect(shell().writes).toEqual([]);
  },
);

test("an exit between attach and step notifies both clients once and a later attach starts again", () => {
  const { sessions, shells, shell, a, b, logs } = setup();
  sessions.attach(pane, a.socket);
  sessions.attach(pane, b.socket);
  shell().exit("Shell exited\n(1)");
  shell().exit("late exit");
  expect(a.received).toEqual([
    { event: TERM_GONE, data: { id: "demo", reason: "Shell exited (1)" } },
  ]);
  expect(b.received).toEqual(a.received);
  expect(logs).toEqual(["demo: Shell exited (1)"]);
  sessions.step("demo", 1, a.socket);
  expect(a.received.at(-1)).toEqual({
    event: TERM_GONE,
    data: { id: "demo", reason: 'Unknown terminal pane "demo"' },
  });
  sessions.attach(pane, a.socket);
  expect(shells).toHaveLength(2);
});

test("spawn failure replies gone and logs its cause once", () => {
  const { sessions, a, logs } = setup(true);
  sessions.attach(pane, a.socket);
  expect(a.received).toEqual([
    { event: TERM_GONE, data: { id: "demo", reason: "Shell could not start: python3 missing" } },
  ]);
  expect(logs).toEqual(["demo: Shell could not start: python3 missing"]);
});

test("an unknown directory names the browser's directory key without spawning", () => {
  const { sessions, a, shells } = setup();
  sessions.attach({ ...pane, cwd: "/arbitrary/path" }, a.socket);
  expect(shells).toEqual([]);
  expect(a.received).toEqual([
    {
      event: TERM_GONE,
      data: {
        id: "demo",
        reason: 'Shell could not start: Unknown terminal directory "/arbitrary/path"',
      },
    },
  ]);
});

test.each(["step", "input", "reset"])("%s for an unknown pane names it in gone", (event) => {
  const { sessions, a } = setup();
  if (event === "step") sessions.step("missing", 1, a.socket);
  else if (event === "input") sessions.input("missing", "ls", a.socket);
  else sessions.reset("missing", a.socket);
  expect(a.received).toEqual([
    { event: TERM_GONE, data: { id: "missing", reason: 'Unknown terminal pane "missing"' } },
  ]);
});

test("closing the server kills every shell and cancels pending input", async () => {
  const { sessions, shells, shell, a } = setup();
  sessions.attach(pane, a.socket);
  shell().data(marker);
  sessions.step("demo", 1, a.socket);
  sessions.attach({ ...pane, id: "other" }, a.socket);
  sessions.close();
  await vi.advanceTimersByTimeAsync(600);
  expect(shells.map((s) => s.killed)).toEqual([true, true]);
  expect(shells.map((s) => s.writes)).toEqual([["sleep 3"], []]);
});
