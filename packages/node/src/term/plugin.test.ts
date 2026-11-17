import { execFileSync } from "node:child_process";
import { readFile, symlink } from "node:fs/promises";
import { join } from "node:path";
import {
  TERM_ATTACH,
  TERM_DATA,
  TERM_GONE,
  TERM_INPUT,
  TERM_POSITION,
  TERM_READY,
  TERM_STATE,
} from "@react-decks/core";
import { createLogger, createServer, type ViteDevServer } from "vite";
import { expect, inject, onTestFinished, test, vi } from "vitest";
import { loadDeck } from "../dev/config";
import { dev } from "../dev/server";
import { fixture } from "../dev/server.test-support";
import { liveTerm } from "./plugin";

test("the published package ships its pty helper and private zsh dotfile", async () => {
  const dist = join(inject("builtPackage"), "dist/term");
  expect(await readFile(join(dist, "shell_pty.py"), "utf8")).toBe(
    await readFile(new URL("../../term/shell_pty.py", import.meta.url), "utf8"),
  );
  expect(await readFile(join(dist, "zsh/.zshrc"), "utf8")).toBe(
    await readFile(new URL("../../term/zsh/.zshrc", import.meta.url), "utf8"),
  );
});

async function connect(server: ViteDevServer) {
  const address = server.httpServer?.address();
  if (!address || typeof address === "string") throw new Error("Missing Vite port");
  const socket = new WebSocket(`ws://127.0.0.1:${address.port}`, "vite-hmr");
  const events: {
    event: string;
    data: {
      id?: string;
      buffer?: string;
      chunk?: string;
      reason?: string;
      busy?: boolean;
      ran?: number[];
    };
  }[] = [];
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(String(data));
    if (message.type === "custom") events.push(message);
  });
  onTestFinished(() => socket.close());
  await vi.waitFor(() => expect(socket.readyState).toBe(WebSocket.OPEN), { timeout: 10_000 });
  const send = (event: string, data: unknown) =>
    socket.send(JSON.stringify({ type: "custom", event, data }));
  return { socket, events, send };
}

test.each([
  { host: "0.0.0.0", platform: "darwin", reason: 'host "0.0.0.0" is not loopback' },
  { host: "127.0.0.1", platform: "win32", reason: "Windows is not supported" },
] as const)(
  "attach is unanswered on $host with platform $platform",
  async ({ host, platform, reason }) => {
    const { dir } = await fixture(onTestFinished);
    const warnings: string[] = [];
    const logger = createLogger("silent");
    logger.warn = (message) => {
      warnings.push(message);
    };
    const server = await createServer({
      configFile: false,
      root: dir,
      customLogger: logger,
      server: { host, port: 0 },
      plugins: [liveTerm(dir, platform)],
    });
    onTestFinished(() => server.close());
    await server.listen();
    const client = await connect(server);
    server.ws.on("term-test:barrier", (_data, socket) => socket.send("term-test:barrier"));
    client.send(TERM_ATTACH, {
      pane: { id: "disabled", rows: 24, cols: 92, cwd: "unknown", commands: [] },
    });
    client.send("term-test:barrier", {});
    await vi.waitFor(
      () => expect(client.events.map((e) => e.event)).toContain("term-test:barrier"),
      { timeout: 10_000 },
    );
    expect(client.events.map((e) => e.event)).toEqual(["term-test:barrier"]);
    expect(warnings).toEqual([`Live terminal disabled: ${reason}`]);
  },
);

const realShell = test.skipIf(
  process.platform !== "darwin" || process.env.DECKS_TEST_LIVE_SHELL !== "1",
);

test("live terminal registration survives a deck config restart", async () => {
  const { dir, put } = await fixture(onTestFinished);
  const server = await dev(await loadDeck(dir), { port: 0, liveTerm: true });
  onTestFinished(() => server.close());
  await fetch(server.url);
  await put(
    "deck.config.ts",
    'export default { title: "Restarted terminal deck", vite: { optimizeDeps: { noDiscovery: true, include: [] } } };',
  );
  await vi.waitFor(
    async () => expect(await (await fetch(server.url)).text()).toContain("Restarted terminal deck"),
    { timeout: 10_000 },
  );
  const socket = new WebSocket(server.url.replace("http", "ws"), "vite-hmr");
  onTestFinished(() => socket.close());
  const messages: { event: string; data: unknown }[] = [];
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(String(data));
    if (message.type === "custom") messages.push({ event: message.event, data: message.data });
  });
  await vi.waitFor(() => expect(socket.readyState).toBe(WebSocket.OPEN), { timeout: 10_000 });
  socket.send(
    JSON.stringify({
      type: "custom",
      event: TERM_ATTACH,
      data: { pane: { id: "restart", rows: 24, cols: 92, cwd: "unknown", commands: [] } },
    }),
  );
  await vi.waitFor(
    () =>
      expect(messages).toEqual([
        {
          event: TERM_GONE,
          data: {
            id: "restart",
            reason:
              'Shell could not start: Pane "restart" has unknown terminal directory "unknown"',
          },
        },
      ]),
    { timeout: 10_000 },
  );
});

realShell(
  "two HMR clients share queued commands, replay on reload, and reset once on reentry",
  async () => {
    const { dir, put } = await fixture(onTestFinished);
    await put(".zshrc", "print PERSONAL_RC_LOADED\n");
    vi.stubEnv("HOME", dir);
    onTestFinished(() => {
      vi.unstubAllEnvs();
    });
    const server = await createServer({
      configFile: false,
      root: dir,
      server: { host: "127.0.0.1", port: 0 },
      logLevel: "silent",
      plugins: [liveTerm(dir)],
    });
    onTestFinished(() => server.close());
    await server.listen();
    const a = await connect(server);
    const b = await connect(server);
    const pane = {
      id: "real",
      rows: 24,
      cols: 92,
      cwd: "temp",
      commands: [
        "printf 'waiting-for-input\\n'; read gate; echo deck-$((6*7))",
        "echo second-$((6*7))",
        "echo third-$((6*7))",
      ],
    };
    a.send(TERM_ATTACH, { pane });
    b.send(TERM_ATTACH, { pane });
    await vi.waitFor(() => expect(a.events.some((e) => e.event === TERM_READY)).toBe(true), {
      timeout: 10_000,
    });
    for (const click of [1, 2, 3]) a.send(TERM_POSITION, { id: pane.id, click, entered: false });
    for (const click of [1, 2, 3]) b.send(TERM_POSITION, { id: pane.id, click, entered: false });
    await vi.waitFor(
      () =>
        expect(
          a.events
            .filter((e) => e.event === TERM_DATA)
            .map((e) => e.data.chunk)
            .join(""),
        ).toContain("\r\nwaiting-for-input\r\n"),
      { timeout: 10_000 },
    );
    a.socket.close();
    const reloaded = await connect(server);
    reloaded.send(TERM_ATTACH, { pane });
    await vi.waitFor(() => expect(reloaded.events.some((e) => e.event === TERM_READY)).toBe(true), {
      timeout: 10_000,
    });
    expect(reloaded.events.find((e) => e.event === TERM_READY)?.data.buffer).toContain(
      "\r\nwaiting-for-input\r\n",
    );
    reloaded.send(TERM_INPUT, { id: pane.id, data: "\r" });
    await vi.waitFor(
      () =>
        expect(b.events.filter((e) => e.event === TERM_STATE).at(-1)?.data).toEqual({
          id: "real",
          click: 3,
          busy: false,
          ran: [1, 2, 3],
          queued: [],
        }),
      { timeout: 10_000 },
    );
    const output = b.events
      .filter((e) => e.event === TERM_DATA)
      .map((e) => e.data.chunk)
      .join("");
    expect(output.match(/\r\ndeck-42\r\n/g)).toHaveLength(1);
    expect(output.match(/\r\nsecond-42\r\n/g)).toHaveLength(1);
    expect(output.match(/\r\nthird-42\r\n/g)).toHaveLength(1);
    expect(output).not.toContain("PERSONAL_RC_LOADED");
    expect(output).toContain("\u001b[32m");
    for (const click of [2, 1, 2]) b.send(TERM_POSITION, { id: pane.id, click, entered: false });
    server.ws.on("term-test:barrier", (_data, client) => client.send("term-test:barrier"));
    b.send("term-test:barrier", {});
    await vi.waitFor(
      () => expect(b.events.some((e) => e.event === "term-test:barrier")).toBe(true),
      { timeout: 10_000 },
    );
    expect(b.events.filter((e) => e.event === TERM_STATE).at(-1)?.data).toEqual({
      id: "real",
      click: 2,
      busy: false,
      ran: [1, 2, 3],
      queued: [],
    });
    b.send(TERM_POSITION, { id: pane.id, click: 0, entered: true });
    reloaded.send(TERM_POSITION, { id: pane.id, click: 0, entered: true });
    await vi.waitFor(() => expect(b.events.filter((e) => e.event === TERM_READY)).toHaveLength(2), {
      timeout: 10_000,
    });
    expect(b.events.filter((e) => e.event === TERM_STATE).at(-1)?.data).toEqual({
      id: "real",
      click: 0,
      busy: false,
      ran: [],
      queued: [],
    });
  },
);

realShell("missing zsh reports one line and leaves the Vite server running", async () => {
  const { dir, put } = await fixture(onTestFinished);
  await put("bin/.keep", "");
  await symlink(
    execFileSync("python3", ["-c", "import sys; print(sys.executable)"], {
      encoding: "utf8",
    }).trim(),
    join(dir, "bin/python3"),
  );
  vi.stubEnv("PATH", join(dir, "bin"));
  onTestFinished(() => {
    vi.unstubAllEnvs();
  });
  const warnings: string[] = [];
  const logger = createLogger("silent");
  logger.warn = (message) => {
    warnings.push(message);
  };
  const server = await createServer({
    configFile: false,
    root: dir,
    customLogger: logger,
    server: { host: "127.0.0.1", port: 0 },
    plugins: [liveTerm(dir)],
  });
  onTestFinished(() => server.close());
  await server.listen();
  const client = await connect(server);
  client.send(TERM_ATTACH, {
    pane: { id: "missing-zsh", rows: 24, cols: 92, cwd: "temp", commands: [] },
  });
  await vi.waitFor(() => expect(client.events.some((e) => e.event === TERM_GONE)).toBe(true), {
    timeout: 10_000,
  });
  expect(client.events.filter((e) => e.event === TERM_GONE)).toHaveLength(1);
  expect(warnings).toHaveLength(1);
  expect(warnings[0]).toContain("missing-zsh");
  expect(warnings[0]).not.toMatch(/[\r\n]/);
  expect(client.events.some((e) => e.event === TERM_READY)).toBe(false);
  const address = server.resolvedUrls?.local[0];
  if (!address) throw new Error("No Vite URL");
  expect((await fetch(new URL("/", address))).status).toBe(404);
});
