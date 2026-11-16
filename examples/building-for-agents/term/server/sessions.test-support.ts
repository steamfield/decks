import { onTestFinished, vi } from "vitest";
import type { TermPaneSpec } from "../protocol";
import { createSessions, type PtySpawn, type TermClient } from "./sessions";

export const marker = "\u001b]133;A\u0007";
export const pane: TermPaneSpec = {
  id: "demo",
  rows: 24,
  cols: 92,
  cwd: "temp",
  commands: ["sleep 3", "echo done"],
};

export function setup(fail = false) {
  vi.useFakeTimers();
  onTestFinished(() => {
    vi.useRealTimers();
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
    tempDir: () => `/temp/${shells.length}`,
    dirs: { repo: "/repository" },
    env: { TERM: "xterm-256color" },
    promptMarker: marker,
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
  return { sessions, shells, shell, a, b, logs };
}
