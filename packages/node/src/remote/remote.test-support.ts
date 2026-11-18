import { lookup } from "node:dns/promises";
import { once } from "node:events";
import { get } from "node:http";
import { REMOTE_INTENT, REMOTE_POSITION, type RemotePosition } from "@react-decks/core";
import { createLogger } from "vite";
import { expect, onTestFinished } from "vitest";
import WebSocket from "ws";
import { loadDeck } from "../dev/config";
import { dev } from "../dev/server";
import { fixture, waitForWatcher } from "../dev/server.test-support";

export const firstDeck = {
  title: "Test deck",
  slides: [{ id: "01-first", title: "01-first", clicks: 0, notes: [] }],
};

export function deckConfig(title: string, host = "127.0.0.1") {
  return `export default { title: ${JSON.stringify(title)}, vite: {
    server: {host: ${JSON.stringify(host)}}, optimizeDeps: {noDiscovery: true, include: []},
    plugins: [{ name: "window-barrier", configureServer(server) {
      server.ws.on("test:barrier", (data, client) => client.send("test:barrier", data));
      server.ws.on("test:address", (_data, client) =>
        client.send("test:address", server.httpServer.address()));
    }}]
  }};`;
}

export async function remoteFixture(files: Record<string, string> = {}) {
  const deck = await fixture(onTestFinished, {
    "deck.config.ts": deckConfig("Test deck"),
    ...files,
  });
  const loaded = await loadDeck(deck.dir);
  const lines: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const customLogger = {
    ...createLogger("silent"),
    info: (line: string) => lines.push(line),
    error: (line: string) => errors.push(line),
    warn: (line: string) => warnings.push(line),
  };
  const server = await dev(
    { ...loaded, config: { ...loaded.config, vite: { ...loaded.config.vite, customLogger } } },
    { port: 0, remote: { port: 0 } },
  );
  onTestFinished(() => server.close());
  const printed = lines.join("\n").match(/http:\/\/[^\s]+\/\?token=[\da-f]{32}/)?.[0];
  if (!printed) throw new Error("No remote presenter URL in startup output");
  const url = new URL(printed);
  const socketUrl = new URL(`/ws${url.search}`, url);
  socketUrl.protocol = "ws:";
  return { ...deck, url, socketUrl, devUrl: server.url, lines, warnings, errors };
}

export async function connectRemote(app: Awaited<ReturnType<typeof remoteFixture>>) {
  const socket = new WebSocket(app.socketUrl, { origin: app.url.origin });
  const messages: unknown[] = [];
  socket.on("message", (data) => messages.push(JSON.parse(data.toString())));
  onTestFinished(() => socket.terminate());
  await once(socket, "open");
  const at = async (i: number, message: unknown) =>
    waitForWatcher(() => expect(messages[i]).toEqual(message));
  return { socket, messages, at, send: (data: unknown) => socket.send(JSON.stringify(data)) };
}

export async function connectWindow(devUrl: string) {
  const socket = new WebSocket(devUrl.replace("http", "ws"), "vite-hmr");
  const intents: unknown[] = [];
  const frames: unknown[] = [];
  const barriers: number[] = [];
  const addresses: unknown[] = [];
  socket.on("message", (data) => {
    const frame = JSON.parse(data.toString());
    frames.push(frame);
    if (frame.event === REMOTE_INTENT) intents.push(frame.data);
    if (frame.event === "test:barrier") barriers.push(frame.data);
    if (frame.event === "test:address") addresses.push(frame.data);
  });
  onTestFinished(() => socket.terminate());
  await once(socket, "open");
  let sequence = 0;
  async function barrier() {
    const id = ++sequence;
    socket.send(JSON.stringify({ type: "custom", event: "test:barrier", data: id }));
    await waitForWatcher(() => expect(barriers).toContain(id));
  }
  async function report(data: RemotePosition) {
    socket.send(JSON.stringify({ type: "custom", event: REMOTE_POSITION, data }));
    await barrier();
  }
  /** The dev server's bound TCP address, as its own `httpServer.address()` reports it. */
  async function address() {
    socket.send(JSON.stringify({ type: "custom", event: "test:address" }));
    await waitForWatcher(() => expect(addresses).toHaveLength(1));
    return addresses[0];
  }
  return { socket, intents, report, barrier, frames, address };
}

export const play = { slide: 1, click: 0, view: "play", focused: true } as const;

/**
 * The body of a GET to a dev URL, connecting as a browser would: a `localhost` URL is tried at
 * each address the name resolves to. Vite can listen on ::1 while Node's own clients connect to
 * 127.0.0.1 only (Linux containers), which a browser falls back from.
 */
export async function pageText(url: string) {
  const { hostname, port, pathname, search, host } = new URL(url);
  const addresses =
    hostname === "localhost" ? await lookup(hostname, { all: true }) : [{ address: hostname }];
  const failures: unknown[] = [];
  for (const { address } of addresses) {
    const request = get({ hostname: address, port, path: pathname + search, headers: { host } });
    try {
      const [response] = await once(request, "response");
      const body = [];
      for await (const chunk of response) body.push(chunk);
      return Buffer.concat(body).toString();
    } catch (cause) {
      failures.push(cause);
    }
  }
  throw new AggregateError(
    failures,
    `Cannot GET ${url} at ${addresses.map((a) => a.address).join(", ")}`,
  );
}
