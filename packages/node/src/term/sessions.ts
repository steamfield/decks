import { rmSync } from "node:fs";
import {
  type SyncStamp,
  TERM_DATA,
  TERM_GONE,
  TERM_READY,
  TERM_STATE,
  type TermPaneSpec,
} from "@react-decks/core";

const promptMarker = "\u001b]133;A\u0007";

export type PtySpawn = (spec: {
  rows: number;
  cols: number;
  cwd: string;
  env: Record<string, string | undefined>;
}) => {
  write(data: string): void;
  kill(): void;
  onData(receive: (data: string) => void): void;
  onExit(receive: (reason: string) => void): void;
};

export interface TermClient {
  send(event: string, data: unknown): void;
}

export function createSessions(options: {
  spawn: PtySpawn;
  clock: { later(run: () => void, ms: number): () => void };
  tempDir(): string;
  dirs: Record<string, string>;
  env: Record<string, string | undefined>;
  log(reason: string): void;
}) {
  type Session = {
    pane: TermPaneSpec;
    clients: Set<TermClient>;
    pty?: ReturnType<PtySpawn>;
    ready: boolean;
    click: number;
    busy: boolean;
    inputReceived: boolean;
    ran: Set<number>;
    queued: number[];
    stamp?: SyncStamp;
    buffer: Buffer[];
    bytes: number;
    tail: string;
    cancel?: () => void;
  };
  const sessions = new Map<string, Session>();
  const replay = (s: Session) => {
    const bytes = Buffer.concat(s.buffer, s.bytes);
    let from = Math.max(0, bytes.length - 200 * 1024);
    while (from < bytes.length && ((bytes[from] ?? 0) & 0xc0) === 0x80) from++;
    return bytes.toString("utf8", from);
  };
  const state = (s: Session) => ({
    id: s.pane.id,
    click: s.click,
    busy: s.busy,
    ran: [...s.ran],
    queued: [...s.queued],
  });
  const broadcast = (s: Session, event: string, data: unknown) => {
    for (const client of s.clients) client.send(event, data);
  };
  const stop = (s: Session) => {
    sessions.delete(s.pane.id);
    s.queued = [];
    s.cancel?.();
    s.pty?.kill();
  };
  const gone = (s: Session, detail: string) => {
    if (sessions.get(s.pane.id) !== s) return;
    const reason = detail.replace(/[\r\n]+/g, " ");
    stop(s);
    broadcast(s, TERM_GONE, { id: s.pane.id, reason });
    options.log(`${s.pane.id}: ${reason}`);
  };
  const run = (s: Session, click: number) => {
    const command = s.pane.commands[click - 1];
    if (!s.pty || command === undefined) return;
    s.busy = true;
    s.pty.write(command);
    s.ran.add(click);
    broadcast(s, TERM_STATE, state(s));
    s.cancel = options.clock.later(() => {
      s.cancel = undefined;
      if (sessions.get(s.pane.id) === s) s.pty?.write("\r");
    }, 600);
  };
  const start = (pane: TermPaneSpec, clients: Set<TermClient>, stamp?: SyncStamp) => {
    const s: Session = {
      pane,
      clients,
      ready: false,
      click: 0,
      busy: true,
      inputReceived: false,
      ran: new Set(),
      queued: [],
      stamp,
      buffer: [],
      bytes: 0,
      tail: "",
    };
    sessions.set(pane.id, s);
    let temporary: string | undefined;
    const cleanup = () => {
      if (temporary === undefined) return;
      const path = temporary;
      temporary = undefined;
      try {
        rmSync(path, { recursive: true, force: true });
      } catch (error) {
        options.log(
          `${pane.id}: could not remove temporary directory "${path}": ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    };
    try {
      if (pane.cwd === "temp") temporary = options.tempDir();
      const cwd =
        pane.cwd === "temp"
          ? temporary
          : Object.hasOwn(options.dirs, pane.cwd)
            ? options.dirs[pane.cwd]
            : undefined;
      if (!cwd) throw new Error(`Pane "${pane.id}" has unknown terminal directory "${pane.cwd}"`);
      s.pty = options.spawn({ rows: pane.rows, cols: pane.cols, cwd, env: options.env });
      s.pty.onExit((reason) => {
        cleanup();
        gone(s, reason);
      });
      s.pty.onData((chunk) => {
        if (sessions.get(pane.id) !== s) return;
        const text = s.tail + chunk;
        const prompted = text.includes(promptMarker);
        s.tail = text.slice(-(promptMarker.length - 1));
        const bytes = Buffer.from(chunk);
        s.buffer.push(bytes);
        s.bytes += bytes.length;
        while (s.buffer[0] && s.bytes - s.buffer[0].length >= 200 * 1024) {
          s.bytes -= s.buffer.shift()?.length ?? 0;
        }
        if (!s.ready && !prompted) return;
        let printed = chunk;
        if (!s.ready) {
          s.ready = true;
          broadcast(s, TERM_READY, { id: pane.id, buffer: "" });
          printed = replay(s);
        }
        broadcast(s, TERM_DATA, {
          id: pane.id,
          chunk: printed,
          ...(s.cancel ? { immediate: true } : {}),
        });
        if (prompted && !s.cancel) {
          s.busy = false;
          const next = s.queued.shift();
          if (next !== undefined) run(s, next);
          else broadcast(s, TERM_STATE, state(s));
        }
      });
    } catch (error) {
      if (!s.pty) cleanup();
      gone(s, `Shell could not start: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  const find = (id: string, client: TermClient) => {
    const s = sessions.get(id);
    if (!s) client.send(TERM_GONE, { id, reason: `Unknown terminal pane "${id}"` });
    return s;
  };
  return {
    attach(pane: TermPaneSpec, client: TermClient) {
      const s = sessions.get(pane.id);
      if (!s) return start(pane, new Set([client]));
      s.clients.add(client);
      if (
        s.pane.rows !== pane.rows ||
        s.pane.cols !== pane.cols ||
        s.pane.cwd !== pane.cwd ||
        s.pane.commands.length !== pane.commands.length ||
        s.pane.commands.some((command, index) => command !== pane.commands[index])
      ) {
        stop(s);
        start(pane, s.clients, s.stamp);
        const fresh = sessions.get(pane.id);
        if (fresh) broadcast(fresh, TERM_STATE, state(fresh));
        return;
      }
      if (s.ready) {
        client.send(TERM_READY, { id: pane.id, buffer: replay(s) });
      }
      if (s.ready || s.queued.length > 0) client.send(TERM_STATE, state(s));
    },
    position(id: string, click: number, entered: boolean, client: TermClient, stamp: SyncStamp) {
      const s = find(id, client);
      if (!s) return;
      if (
        s.stamp &&
        (stamp.seq < s.stamp.seq ||
          (stamp.seq === s.stamp.seq &&
            (stamp.started > s.stamp.started ||
              (stamp.started === s.stamp.started && stamp.origin < s.stamp.origin))))
      )
        return;
      // One press publishes one sync stamp, so a report whose click moved as far as its stamp
      // did is consecutive presses a coalesced view transition presented at once, not a jump.
      const presses = s.stamp && s.stamp.origin === stamp.origin ? stamp.seq - s.stamp.seq : 1;
      s.stamp = stamp;
      const previous = s.click;
      s.click = click;
      if (click === 0) {
        // Navigation back to zero cancels work that has not reached the shell yet.
        s.queued = [];
        if ((previous > 0 || entered) && (s.ran.size > 0 || s.inputReceived)) {
          stop(s);
          start(s.pane, s.clients, s.stamp);
          const fresh = sessions.get(id);
          if (fresh) broadcast(fresh, TERM_STATE, state(fresh));
          return;
        }
      }
      const steps =
        click - previous > 1 && click - previous === presses
          ? Array.from({ length: click - previous }, (_, i) => previous + i + 1)
          : [click];
      // `run` broadcasts the state it leaves; anything after it still needs one.
      let unsent = true;
      for (const step of steps) {
        if (
          step <= 0 ||
          s.pane.commands[step - 1] === undefined ||
          s.ran.has(step) ||
          s.queued.includes(step) ||
          !s.pane.commands
            .slice(0, step - 1)
            .every((_, index) => s.ran.has(index + 1) || s.queued.includes(index + 1))
        )
          continue;
        if (s.busy || !s.ready || s.queued.length > 0) {
          s.queued.push(step);
          unsent = true;
        } else {
          run(s, step);
          unsent = false;
        }
      }
      if (unsent) broadcast(s, TERM_STATE, state(s));
    },
    input(id: string, data: string, client: TermClient) {
      const s = find(id, client);
      if (!s) return;
      s.inputReceived = true;
      if (/[\r\n]/.test(data)) {
        s.busy = true;
        broadcast(s, TERM_STATE, state(s));
      }
      s.pty?.write(data);
    },
    detach(client: TermClient) {
      for (const s of sessions.values()) {
        s.clients.delete(client);
        if (s.clients.size === 0) s.stamp = undefined;
      }
    },
    close() {
      for (const s of sessions.values()) stop(s);
    },
  };
}
