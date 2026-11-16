import { expect, test, vi } from "vitest";
import { TERM_STATE } from "../protocol";
import { marker, pane, setup } from "./sessions.test-support";

test.each(["\r", "\n"])(
  "typed input with %j stays busy until the prompt and rejects a prepared step",
  async (enter) => {
    const { sessions, shell, a, b } = setup();
    sessions.attach(pane, a.socket);
    sessions.attach(pane, b.socket);
    shell().data(marker);
    sessions.input("demo", `sleep 30${enter}`, a.socket);
    expect(a.received.at(-1)).toEqual({
      event: TERM_STATE,
      data: { id: "demo", busy: true, ran: [] },
    });
    expect(b.received).toEqual(a.received);
    sessions.step("demo", 1, b.socket);
    await vi.advanceTimersByTimeAsync(600);
    expect(shell().writes).toEqual([`sleep 30${enter}`]);
    shell().data(marker);
    expect(a.received.at(-1)).toEqual({
      event: TERM_STATE,
      data: { id: "demo", busy: false, ran: [] },
    });
    sessions.step("demo", 1, a.socket);
    expect(shell().writes).toEqual([`sleep 30${enter}`, "sleep 3"]);
  },
);

test("reset clears manual input even when no prepared click has run", () => {
  const { sessions, shells, shell, a } = setup();
  sessions.attach(pane, a.socket);
  const old = shell();
  old.data(marker);
  sessions.input("demo", "cd /tmp\r", a.socket);
  old.data(marker);
  sessions.reset("demo", a.socket);
  expect(old.killed).toBe(true);
  expect(shells).toHaveLength(2);
  expect(shell().spec.cwd).toBe("/temp/1");
  shell().data(marker);
  sessions.reset("demo", a.socket);
  expect(shells).toHaveLength(2);
});
