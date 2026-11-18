import { once } from "node:events";
import { get } from "node:http";
import { syncBuiltinESMExports } from "node:module";
import { createServer } from "node:net";
import os, { hostname, networkInterfaces } from "node:os";
import getPort from "get-port";
import { createLogger } from "vite";
import { expect, onTestFinished, test, vi } from "vitest";
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
  play,
  remoteFixture,
} from "./remote.test-support";
import { startRemoteServer } from "./remote-server";

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
    expect.stringContaining("127.0.0.1"),
    expect.stringContaining("127.0.0.1"),
  ]);
});

async function refused(url: URL, origin: string) {
  const socket = new WebSocket(url, { origin });
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
  expect(app.warnings).toHaveLength(1);
});

test("refuses a socket upgrade from a foreign Origin", async () => {
  const app = await remoteFixture();
  await refused(app.socketUrl, "http://foreign.invalid");
  expect(app.warnings).toHaveLength(1);
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
  if (app.url.hostname !== "127.0.0.1") {
    const lan = new URL(app.devUrl);
    lan.hostname = app.url.hostname;
    await expect(fetch(lan)).rejects.toThrow();
  }
  const window = await connectWindow(app.devUrl);
  await window.report(play);
  await waitForWatcher(() =>
    expect(remote.messages.at(-1)).toEqual({ type: "position", slide: 1, click: 0, elapsed: null }),
  );
  remote.send({ type: "next" });
  await waitForWatcher(() => expect(window.intents).toEqual([{ type: "next" }]));
});

test("prints the remote URLs after the dev URL", async () => {
  const app = await remoteFixture();
  const hosts = Object.values(networkInterfaces()).flatMap((nic) =>
    (nic ?? [])
      .filter((address) => address.family === "IPv4" && !address.internal)
      .map((address) => address.address),
  );
  const urls = [
    ...new Set(hosts.length ? hosts : ["127.0.0.1"]),
    `${hostname().toLowerCase().split(".")[0]}.local`,
  ].map((host) => `http://${host}:${app.url.port}/${app.url.search}`);
  const output = app.lines.join("\n");
  expect(output.indexOf(app.devUrl)).toBeGreaterThanOrEqual(0);
  expect(output.indexOf("Remote presenter:")).toBeGreaterThan(output.indexOf(app.devUrl));
  expect(output.indexOf(app.url.href)).toBeGreaterThan(output.indexOf("Remote presenter:"));
  expect(output.match(/http:\/\/[^\s]+\?token=[\da-f]+/g)).toEqual(urls);
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

test("serves the printed mDNS name when the machine is named Talk-Mac.local", async () => {
  const host = vi.spyOn(os, "hostname").mockReturnValue("Talk-Mac.local");
  syncBuiltinESMExports();
  onTestFinished(() => {
    host.mockRestore();
    syncBuiltinESMExports();
  });
  const app = await remoteFixture();
  const line = app.lines.find((line) => line.startsWith("http://talk-mac.local:"));
  if (!line) throw Error("Missing talk-mac.local URL");
  const url = new URL(line);
  const req = get({
    hostname: "127.0.0.1",
    port: url.port,
    path: url.pathname + url.search,
    headers: { host: url.host },
  });
  const [response] = await once(req, "response");
  response.resume();
  expect(response.statusCode).toBe(200);
});

test("prints the mDNS name without the DHCP domain the hostname carries", async () => {
  const host = vi.spyOn(os, "hostname").mockReturnValue("Rileys-MBP.lan");
  syncBuiltinESMExports();
  onTestFinished(() => {
    host.mockRestore();
    syncBuiltinESMExports();
  });
  const app = await remoteFixture();
  expect(
    app.lines.filter((line) => /\.local:/.test(line)).map((line) => new URL(line).hostname),
  ).toEqual(["rileys-mbp.local"]);
});

test("accepts Vite's loopback and shared socket defaults from a config plugin", async () => {
  const { dir } = await fixture(onTestFinished, {
    "deck.config.ts": `export default {title:"Shared transport",
    vite:{plugins:[{name:"loopback-default", config:()=>({server:{host:false,ws:{port:0}}})}]}}`,
  });
  const server = await dev(await loadDeck(dir), { port: await getPort(), remote: { port: 0 } });
  onTestFinished(() => server.close());
  expect(await (await fetch(server.url)).text()).toContain("<title>Shared transport</title>");
});
