import { TERM_DATA, TERM_GONE, TERM_READY, TERM_STATE, type TermPaneSpec } from "../protocol";

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
  promptMarker: string;
  log(reason: string): void;
}) {
  type Session = {
    pane: TermPaneSpec;
    clients: Set<TermClient>;
    pty?: ReturnType<PtySpawn>;
    ready: boolean;
    busy: boolean;
    inputReceived: boolean;
    ran: Set<number>;
    queued: number[];
    buffer: string;
    tail: string;
    cancel?: () => void;
  };
  const sessions = new Map<string, Session>();
  const state = (s: Session) => ({
    id: s.pane.id,
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
  const start = (pane: TermPaneSpec, clients: Set<TermClient>) => {
    const s: Session = {
      pane,
      clients,
      ready: false,
      busy: true,
      inputReceived: false,
      ran: new Set(),
      queued: [],
      buffer: "",
      tail: "",
    };
    sessions.set(pane.id, s);
    try {
      const cwd =
        pane.cwd === "temp"
          ? options.tempDir()
          : Object.hasOwn(options.dirs, pane.cwd)
            ? options.dirs[pane.cwd]
            : undefined;
      if (!cwd) throw new Error(`Unknown terminal directory "${pane.cwd}"`);
      s.pty = options.spawn({ rows: pane.rows, cols: pane.cols, cwd, env: options.env });
      s.pty.onExit((reason) => gone(s, reason));
      s.pty.onData((chunk) => {
        if (sessions.get(pane.id) !== s) return;
        const text = s.tail + chunk;
        const prompted = text.includes(options.promptMarker);
        s.tail = text.slice(-(options.promptMarker.length - 1));
        const bytes = new TextEncoder().encode(s.buffer + chunk);
        let from = Math.max(0, bytes.length - 200 * 1024);
        while (from < bytes.length && ((bytes[from] ?? 0) & 0xc0) === 0x80) from++;
        s.buffer = new TextDecoder().decode(bytes.subarray(from));
        if (!s.ready && !prompted) return;
        let printed = chunk;
        if (!s.ready) {
          s.ready = true;
          broadcast(s, TERM_READY, { id: pane.id, buffer: "" });
          printed = s.buffer;
        }
        broadcast(s, TERM_DATA, {
          id: pane.id,
          chunk: printed,
          ...(s.cancel ? { immediate: true } : {}),
        });
        if (prompted) {
          s.cancel?.();
          s.cancel = undefined;
          s.busy = false;
          const next = s.queued.shift();
          if (next !== undefined) run(s, next);
          else broadcast(s, TERM_STATE, state(s));
        }
      });
    } catch (error) {
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
      if (s.ready) {
        client.send(TERM_READY, { id: pane.id, buffer: s.buffer });
      }
      if (s.ready || s.queued.length > 0) client.send(TERM_STATE, state(s));
    },
    step(id: string, click: number, client: TermClient) {
      const s = find(id, client);
      if (!s) return;
      if (
        !Number.isInteger(click) ||
        click < 1 ||
        s.pane.commands[click - 1] === undefined ||
        s.ran.has(click) ||
        s.queued.includes(click) ||
        (click > 1 && !s.ran.has(click - 1) && !s.queued.includes(click - 1))
      ) {
        client.send(TERM_STATE, state(s));
        return;
      }
      if (s.busy || !s.ready || s.queued.length > 0) {
        s.queued.push(click);
        broadcast(s, TERM_STATE, state(s));
      } else run(s, click);
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
    reset(id: string, client: TermClient) {
      const s = find(id, client);
      if (!s) return;
      if (s.ran.size === 0 && !s.busy && !s.inputReceived) {
        client.send(TERM_STATE, state(s));
        return;
      }
      stop(s);
      start(s.pane, s.clients);
      const fresh = sessions.get(id);
      if (fresh) broadcast(fresh, TERM_STATE, state(fresh));
    },
    detach(client: TermClient) {
      for (const s of sessions.values()) s.clients.delete(client);
    },
    close() {
      for (const s of sessions.values()) stop(s);
    },
  };
}
