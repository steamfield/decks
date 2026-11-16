import { expect, test, vi } from "vitest";
import { TERM_GONE, TERM_STATE } from "../protocol";
import { marker, pane, setup } from "./sessions.test-support";

const three = { ...pane, commands: [...pane.commands, "echo third"] };

test("three steps before readiness run in order, one per prompt, and are recorded only when written", async () => {
  const { sessions, shell, a, b } = setup();
  sessions.attach(three, a.socket);
  for (const click of [1, 2, 3]) sessions.step("demo", click, a.socket);
  const waiting = {
    event: TERM_STATE,
    data: { id: "demo", busy: true, ran: [], queued: [1, 2, 3] },
  };
  expect(a.received.at(-1)).toEqual(waiting);
  sessions.attach(three, b.socket);
  expect(b.received).toEqual([waiting]);
  await vi.advanceTimersByTimeAsync(600);
  expect(shell().writes).toEqual([]);
  for (const click of [1, 2, 3]) {
    shell().data(marker);
    expect(shell().writes).toEqual(
      three.commands
        .slice(0, click)
        .flatMap((command, i) => (i === click - 1 ? [command] : [command, "\r"])),
    );
    expect(a.received.at(-1)).toEqual({
      event: TERM_STATE,
      data: {
        id: "demo",
        busy: true,
        ran: [1, 2, 3].slice(0, click),
        queued: [1, 2, 3].slice(click),
      },
    });
    expect(b.received.at(-1)).toEqual(a.received.at(-1));
    await vi.advanceTimersByTimeAsync(600);
    expect(shell().writes).toEqual(
      three.commands.slice(0, click).flatMap((command) => [command, "\r"]),
    );
  }
  shell().data(marker);
  expect(a.received.at(-1)).toEqual({
    event: TERM_STATE,
    data: { id: "demo", busy: false, ran: [1, 2, 3], queued: [] },
  });
});

test("a busy shell queues a duplicate step once and runs it at the next prompt", async () => {
  const { sessions, shell, a, b } = setup();
  sessions.attach(pane, a.socket);
  sessions.attach(pane, b.socket);
  shell().data(marker);
  sessions.step("demo", 1, a.socket);
  await vi.advanceTimersByTimeAsync(600);
  sessions.step("demo", 2, a.socket);
  sessions.step("demo", 2, b.socket);
  const waiting = { event: TERM_STATE, data: { id: "demo", busy: true, ran: [1], queued: [2] } };
  expect(a.received.at(-1)).toEqual(waiting);
  expect(b.received.at(-1)).toEqual(waiting);
  await vi.advanceTimersByTimeAsync(600);
  expect(shell().writes).toEqual(["sleep 3", "\r"]);
  shell().data(marker);
  expect(shell().writes).toEqual(["sleep 3", "\r", "echo done"]);
  await vi.advanceTimersByTimeAsync(600);
  shell().data(marker);
  shell().data(marker);
  expect(shell().writes).toEqual(["sleep 3", "\r", "echo done", "\r"]);
  expect(a.received.at(-1)).toEqual({
    event: TERM_STATE,
    data: { id: "demo", busy: false, ran: [1, 2], queued: [] },
  });
});

test("a jump whose predecessor was never accepted is refused", () => {
  const { sessions, shell, a } = setup();
  sessions.attach(three, a.socket);
  sessions.step("demo", 3, a.socket);
  expect(a.received.at(-1)).toEqual({
    event: TERM_STATE,
    data: { id: "demo", busy: true, ran: [], queued: [] },
  });
  shell().data(marker);
  sessions.step("demo", 2, a.socket);
  expect(a.received.at(-1)).toEqual({
    event: TERM_STATE,
    data: { id: "demo", busy: false, ran: [], queued: [] },
  });
  expect(shell().writes).toEqual([]);
});

test.each([false, true])("reset drops two waiting steps when readiness is %s", async (ready) => {
  const { sessions, shell, a } = setup();
  sessions.attach(three, a.socket);
  const old = shell();
  if (ready) {
    old.data(marker);
    sessions.step("demo", 1, a.socket);
    await vi.advanceTimersByTimeAsync(600);
  }
  for (const click of ready ? [2, 3] : [1, 2]) sessions.step("demo", click, a.socket);
  expect(a.received.at(-1)).toEqual({
    event: TERM_STATE,
    data: { id: "demo", busy: true, ran: ready ? [1] : [], queued: ready ? [2, 3] : [1, 2] },
  });
  const writes = [...old.writes];
  sessions.reset("demo", a.socket);
  expect(old.killed).toBe(true);
  expect(a.received.at(-1)).toEqual({
    event: TERM_STATE,
    data: { id: "demo", busy: true, ran: [], queued: [] },
  });
  old.data(marker);
  for (const _ of [1, 2, 3]) {
    shell().data(marker);
    await vi.advanceTimersByTimeAsync(600);
  }
  expect(old.writes).toEqual(writes);
  expect(shell().writes).toEqual([]);
});

test("manual input is written ahead of two waiting steps, which follow in order", async () => {
  const { sessions, shell, a } = setup();
  sessions.attach(pane, a.socket);
  shell().data(marker);
  const manual = 'read command; eval "$command"\r';
  sessions.input("demo", manual, a.socket);
  sessions.step("demo", 1, a.socket);
  sessions.step("demo", 2, a.socket);
  sessions.input("demo", "echo manual\r", a.socket);
  expect(shell().writes).toEqual([manual, "echo manual\r"]);
  shell().data(marker);
  expect(shell().writes).toEqual([manual, "echo manual\r", "sleep 3"]);
  await vi.advanceTimersByTimeAsync(600);
  shell().data(marker);
  expect(shell().writes).toEqual([manual, "echo manual\r", "sleep 3", "\r", "echo done"]);
  await vi.advanceTimersByTimeAsync(600);
  shell().data(marker);
  expect(shell().writes).toEqual([manual, "echo manual\r", "sleep 3", "\r", "echo done", "\r"]);
  expect(a.received.at(-1)).toEqual({
    event: TERM_STATE,
    data: { id: "demo", busy: false, ran: [1, 2], queued: [] },
  });
});

test("an exit drops the queue, reports once to both clients and leaves the next session empty", async () => {
  const { sessions, shell, a, b, logs } = setup();
  sessions.attach(three, a.socket);
  sessions.attach(three, b.socket);
  const old = shell();
  old.data(marker);
  sessions.step("demo", 1, a.socket);
  await vi.advanceTimersByTimeAsync(600);
  sessions.step("demo", 2, a.socket);
  sessions.step("demo", 3, a.socket);
  expect(a.received.at(-1)).toEqual({
    event: TERM_STATE,
    data: { id: "demo", busy: true, ran: [1], queued: [2, 3] },
  });
  old.exit("Shell exited (1)");
  old.exit("late exit");
  old.data(marker);
  await vi.advanceTimersByTimeAsync(600);
  const gone = { event: TERM_GONE, data: { id: "demo", reason: "Shell exited (1)" } };
  expect(a.received.filter((message) => message.event === TERM_GONE)).toEqual([gone]);
  expect(b.received.filter((message) => message.event === TERM_GONE)).toEqual([gone]);
  expect(logs).toEqual(["demo: Shell exited (1)"]);
  expect(old.writes).toEqual(["sleep 3", "\r"]);
  sessions.attach(three, a.socket);
  shell().data(marker);
  expect(shell().writes).toEqual([]);
  expect(a.received.at(-1)).toEqual({
    event: TERM_STATE,
    data: { id: "demo", busy: false, ran: [], queued: [] },
  });
});
