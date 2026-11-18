import { once } from "node:events";
import { get } from "node:http";
import { createServer, isIPv4 } from "node:net";
import getPort from "get-port";
import { createLogger } from "vite";
import { expect, onTestFinished, test } from "vitest";
import WebSocket from "ws";
import { loadDeck } from "../dev/config";
import { dev } from "../dev/server";
import { fixture, waitForWatcher } from "../dev/server.test-support";
import { createRelay } from "./relay";
import {
  connectRemote,
  connectWindow,
  deckConfig,
  firstDeck,
  pageText,
  play,
  remoteFixture,
} from "./remote.test-support";
import { mdnsName, startRemoteServer } from "./remote-server";

test("refuses the page with 403 and logs the address when the token is missing or wrong", async () => {
  const app = await remoteFixture();
  for (const query of ["", "?token=wrong"]) {
    const url = new URL(query || "/", app.url);
    const req = get({
      hostname: "127.0.0.1",
      port: url.port,
      path: url.pathname + url.search,
      headers: { host: url.host },
    });
    const [response] = await once(req, "response");
    expect(response.statusCode).toBe(403);
    expect(response.headers["content-type"]).toContain("text/plain");
    const body = [];
    for await (const chunk of response) body.push(chunk);
    expect(Buffer.concat(body).toString()).toMatch(/forbidden/i);
  }
  expect(app.warnings).toEqual([
    "Remote presenter: refused request from 127.0.0.1",
    "Remote presenter: refused request from 127.0.0.1",
  ]);
});

async function refused(url: URL, origin: string, host?: string) {
  const socket = new WebSocket(url, { origin, headers: host ? { host } : {} });
  // ws reports a rejected handshake as a client error when its response is not intercepted.
  onTestFinished(() => socket.terminate());
  const result = await Promise.race([
    once(socket, "error").then(([error]) => String(error)),
    new Promise<string>((resolve) => socket.once("open", () => resolve("opened"))),
  ]);
  expect(result).toContain("403");
}

test("refuses a socket upgrade without the token", async () => {
  const app = await remoteFixture();
  app.socketUrl.search = "";
  await refused(app.socketUrl, app.url.origin);
  expect(app.warnings).toEqual([`Remote presenter: refused request from ${app.url.hostname}`]);
});

test("refuses a socket upgrade from a foreign Origin", async () => {
  const app = await remoteFixture();
  await refused(app.socketUrl, "http://foreign.invalid");
  expect(app.warnings).toEqual([`Remote presenter: refused request from ${app.url.hostname}`]);
});

test("refuses the page and the socket with the right token under a foreign Host", async () => {
  const app = await remoteFixture();
  // A DNS-rebound name reaches the same address and port but sends its own Host and Origin.
  const host = `evil.example:${app.url.port}`;
  const req = get({
    hostname: "127.0.0.1",
    port: app.url.port,
    path: app.url.pathname + app.url.search,
    headers: { host },
  });
  const [response] = await once(req, "response");
  response.resume();
  expect(response.statusCode).toBe(403);
  await refused(app.socketUrl, `http://${host}`, host);
});

test("a localhost dev host with --remote is loopback and logs no override warning", async () => {
  const app = await remoteFixture({ "deck.config.ts": deckConfig("Test deck", "localhost") });
  expect(await pageText(app.devUrl)).toContain("<title>Test deck</title>");
  expect(app.warnings).toEqual([]);
});

test("keeps the remote socket open and routing across a deck.config.ts restart", async () => {
  const app = await remoteFixture();
  const remote = await connectRemote(app);
  const oldWindow = await connectWindow(app.devUrl);
  await oldWindow.report(play);
  await remote.at(2, { type: "position", slide: 1, click: 0, elapsed: null });
  const closed = once(oldWindow.socket, "close");
  await app.put("deck.config.ts", deckConfig("Restarted", "0.0.0.0"));
  await closed;
  const updated = { type: "deck", deck: { ...firstDeck, title: "Restarted" } };
  await waitForWatcher(() => expect(remote.messages).toContainEqual(updated));
  await waitForWatcher(async () =>
    expect(await (await fetch(app.devUrl)).text()).toContain("<title>Restarted</title>"),
  );
  expect(remote.messages.slice(3)).toContainEqual({ type: "waiting" });
  expect(app.warnings.join("\n")).toContain("overriding dev server host");
  const window = await connectWindow(app.devUrl);
  expect(await window.address()).toMatchObject({ address: "127.0.0.1" });
  await window.report(play);
  await waitForWatcher(() =>
    expect(remote.messages.at(-1)).toEqual({ type: "position", slide: 1, click: 0, elapsed: null }),
  );
  remote.send({ type: "next" });
  await waitForWatcher(() => expect(window.intents).toEqual([{ type: "next" }]));
});

test("prints the dev URL, then LAN IPv4 remote URLs and the mDNS one last, each serving 200", async () => {
  const app = await remoteFixture();
  const urls = app.lines.filter((line) => line.includes("?token=")).map((line) => new URL(line));
  // Vite may log first (a cold dependency optimizer), so the order is checked from the dev URL.
  const dev = app.lines.indexOf(app.devUrl);
  expect(app.lines.slice(dev, dev + 2)).toEqual([app.devUrl, "Remote presenter:"]);
  expect(app.lines.indexOf(urls[0]?.href ?? "")).toBeGreaterThan(dev + 1);
  const kinds = urls.map(({ hostname }) =>
    isIPv4(hostname) ? "IPv4" : hostname.endsWith(".local") ? "mDNS" : hostname,
  );
  expect(kinds).toEqual([...urls.slice(1).map(() => "IPv4"), "mDNS"]);
  // Each request names its printed host, as a phone resolving that name would send it.
  const statuses = await Promise.all(
    urls.map(async (url) => {
      const req = get({
        hostname: "127.0.0.1",
        port: url.port,
        path: url.pathname + url.search,
        headers: { host: url.host },
      });
      const [response] = await once(req, "response");
      response.resume();
      return response.statusCode;
    }),
  );
  expect(statuses).toEqual(urls.map(() => 200));
});

test.each([
  ["Talk-Mac.local", "talk-mac.local"],
  ["rileys-mbp.lan", "rileys-mbp.local"],
  ["m4", "m4.local"],
])("names the machine %s as %s for mDNS", (hostname, name) => {
  expect(mdnsName(hostname)).toBe(name);
});

test.each(["hmr", "ws", "ws.port", "ws.server", "host"])(
  "rejects an incompatible final vite.server.%s before serving remote",
  async (setting) => {
    const { dir } = await fixture(onTestFinished);
    const deck = await loadDeck(dir);
    const server =
      setting === "ws.port"
        ? { ws: { port: await getPort() } }
        : setting === "ws.server"
          ? { ws: { server: createServer() } }
          : setting === "host"
            ? { host: "0.0.0.0" }
            : { [setting]: false };
    const plugins = [{ name: "final-host", config: () => ({ server }) }];
    const starting = dev(
      { ...deck, config: { ...deck.config, vite: { ...deck.config.vite, plugins } } },
      { port: 0, remote: { port: 0 } },
    );
    await expect(
      starting.then((running) => {
        onTestFinished(() => running.close());
      }),
    ).rejects.toThrow(`vite.server.${setting}`);
  },
);

test("chooses an available remote port above a low dev port", async () => {
  const { dir, put } = await fixture(onTestFinished);
  await put("index.html", "<title>Demo</title>");
  const lines: string[] = [];
  const close = await startRemoteServer(
    "http://127.0.0.1:80/",
    undefined,
    createRelay(firstDeck),
    async () => ({ dir, cleanup: async () => {} }),
    { ...createLogger("silent"), info: (line) => lines.push(line) },
  );
  onTestFinished(close);
  const url = lines.find((line) => line.includes("?token="));
  if (!url) throw Error("Missing remote URL");
  expect(Number(new URL(url).port)).toBeGreaterThan(80);
  expect(await (await fetch(url)).text()).toContain("Demo");
});

test("moves to the next free port if another listener takes the default during startup", async () => {
  const { dir, put } = await fixture(onTestFinished);
  await put("index.html", "Remote page");
  const reservation = createServer();
  await new Promise<void>((done) => reservation.listen(0, "0.0.0.0", done));
  const address = reservation.address();
  if (!address || typeof address === "string") throw Error("Missing TCP address");
  const candidate = address.port;
  await new Promise<void>((done) => reservation.close(() => done()));
  onTestFinished(() => new Promise<void>((done) => reservation.close(() => done())));
  const lines: string[] = [];
  const close = await startRemoteServer(
    `http://127.0.0.1:${candidate - 1}/`,
    undefined,
    createRelay(firstDeck),
    async () => {
      await new Promise<void>((done) => reservation.listen(candidate, "0.0.0.0", done));
      return { dir, cleanup: async () => {} };
    },
    { ...createLogger("silent"), info: (line) => lines.push(line) },
  );
  onTestFinished(close);
  const url = lines.find((line) => line.includes("?token="));
  if (!url) throw Error("Missing remote URL");
  expect(Number(new URL(url).port)).toBeGreaterThan(candidate);
  expect(await (await fetch(url)).text()).toBe("Remote page");
});

test("accepts Vite's loopback and shared socket defaults from a config plugin", async () => {
  const { dir } = await fixture(onTestFinished, {
    "deck.config.ts": `export default {title:"Shared transport",
    vite:{plugins:[{name:"loopback-default", config:()=>({server:{host:false,ws:{port:0}}})}]}}`,
  });
  const server = await dev(await loadDeck(dir), { port: 0, remote: { port: 0 } });
  onTestFinished(() => server.close());
  expect(await pageText(server.url)).toContain("<title>Shared transport</title>");
});
