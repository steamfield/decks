import { TERM_DATA, TERM_READY, TERM_STATE } from "@react-decks/core";
import { expect, test, vi } from "vitest";
import { marker, pane, setup } from "./sessions.test-support";

test.each([{ commands: ["echo edited"] }, { rows: 12 }, { cols: 60 }, { cwd: "repo" }])(
  "an edited pane spec $commands $rows $cols $cwd restarts for every attached window",
  async (edit) => {
    const { sessions, shells, shell, a, b, tempRoot } = setup();
    sessions.attach(pane, a.socket);
    const old = shell();
    old.data(marker);
    sessions.position(pane.id, 1, false, a.socket);
    const updated = { ...pane, ...edit };
    sessions.attach(updated, b.socket);
    expect(shells).toHaveLength(2);
    expect(old.killed).toBe(true);
    expect(shell().spec).toEqual({
      rows: updated.rows,
      cols: updated.cols,
      cwd: updated.cwd === "repo" ? "/repository" : join(tempRoot, "1"),
      env: { TERM: "xterm-256color" },
    });
    const fresh = {
      event: TERM_STATE,
      data: { id: pane.id, click: 0, busy: true, ran: [], queued: [] },
    };
    expect(a.received.at(-1)).toEqual(fresh);
    expect(b.received).toEqual([fresh]);
    old.exit("late exit");
    old.data("old output");
    shell().data(marker);
    expect(b.received.slice(1)).toEqual([
      { event: TERM_READY, data: { id: pane.id, buffer: "" } },
      { event: TERM_DATA, data: { id: pane.id, chunk: marker } },
      { event: TERM_STATE, data: { id: pane.id, click: 0, busy: false, ran: [], queued: [] } },
    ]);
    sessions.position(pane.id, 1, false, b.socket);
    await vi.advanceTimersByTimeAsync(600);
    expect(old.writes).toEqual(["sleep 3"]);
    expect(shell().writes).toEqual([updated.commands[0], "\r"]);
  },
);

import { join } from "node:path";
