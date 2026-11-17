import type { SyncStamp, TermPaneSpec } from "@react-decks/core";
import { onTestFinished, vi } from "vitest";
import { createSessions, type PtySpawn, type TermClient } from "./sessions";

export const marker = "\u001b]133;A\u0007";
export const pane: TermPaneSpec = {
  id: "demo",
  rows: 24,
  cols: 92,
  cwd: "temp",
  commands: ["sleep 3", "echo done"],
};

export function setup(fail = false, tempDir?: () => string, dirs = { repo: "/repository" }) {
  mkdirSync(resolve(".tmp"), { recursive: true });
  const tempRoot = mkdtempSync(resolve(".tmp/term-sessions-"));
  vi.useFakeTimers();
  onTestFinished(() => {
    vi.useRealTimers();
    rmSync(tempRoot, { recursive: true, force: true });
  });
  const shells: {
    spec: Parameters<PtySpawn>[0];
    writes: string[];
    killed: boolean;
    data(chunk: string): void;
    exit(reason: string): void;
  }[] = [];
  const logs: string[] = [];
  const sessions = createSessions({
    spawn(spec) {
      if (fail) throw new Error("python3 missing");
      const writes: string[] = [];
      const shell = {
        spec,
        writes,
        killed: false,
        data: (_chunk: string) => {},
        exit: (_reason: string) => {},
      };
      shells.push(shell);
      return {
        write: (data) => shell.writes.push(data),
        kill: () => {
          shell.killed = true;
        },
        onData: (receive) => {
          shell.data = receive;
        },
        onExit: (receive) => {
          shell.exit = receive;
        },
      };
    },
    clock: {
      later(run, ms) {
        const timer = setTimeout(run, ms);
        return () => clearTimeout(timer);
      },
    },
    tempDir:
      tempDir ??
      (() => {
        const path = join(tempRoot, String(shells.length));
        mkdirSync(path, { recursive: true });
        return path;
      }),
    dirs,
    env: { TERM: "xterm-256color" },
    log: (reason) => logs.push(reason),
  });
  const client = () => {
    const received: { event: string; data: unknown }[] = [];
    const socket: TermClient = {
      send: (event, data) => {
        received.push({ event, data });
      },
    };
    return { socket, received };
  };
  const a = client();
  const b = client();
  const shell = () => {
    const current = shells.at(-1);
    if (!current) throw new Error("No shell was spawned");
    return current;
  };
  let seq = 0;
  return {
    tempRoot,
    sessions: {
      ...sessions,
      position(
        id: string,
        click: number,
        entered: boolean,
        client: TermClient,
        stamp: SyncStamp = { seq: ++seq, started: 0, origin: "test" },
      ) {
        sessions.position(id, click, entered, client, stamp);
      },
    },
    shells,
    shell,
    a,
    b,
    logs,
  };
}

import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
