import { mkdir, readdir } from "node:fs/promises";
import { createServer } from "node:net";
import { join } from "node:path";
import { TERM_ATTACH, TERM_GONE } from "@react-decks/core";
import { expect, it, onTestFinished, vi } from "vitest";
import { cli, fixture } from "../dev/server.test-support";

it.each([false, true])("dev answers terminal attach only with --live-term=%s", async (enabled) => {
  const { dir } = await fixture(onTestFinished, {
    "deck.config.ts": `export default { title: "Test deck", vite: { optimizeDeps: { noDiscovery: true, include: [] }, plugins: [{ name: "term-test-barrier", configureServer(server) { server.ws.on("term-test:barrier", (_data, client) => client.send("term-test:barrier")); } }] } };`,
  });
  const process = cli(dir, ["dev", ".", "--port", "0", ...(enabled ? ["--live-term"] : [])]);
  const url = await process.url();
  const socket = new WebSocket(url.replace("http", "ws"), "vite-hmr");
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
      data: { pane: { id: "cli", rows: 24, cols: 92, cwd: "unknown-key", commands: [] } },
    }),
  );
  socket.send(JSON.stringify({ type: "custom", event: "term-test:barrier", data: {} }));
  await vi.waitFor(() => expect(messages.some((m) => m.event === "term-test:barrier")).toBe(true), {
    timeout: 10_000,
  });
  expect(messages.filter((m) => m.event !== "term-test:barrier")).toEqual(
    enabled
      ? [
          {
            event: TERM_GONE,
            data: {
              id: "cli",
              reason:
                'Shell could not start: Pane "cli" has unknown terminal directory "unknown-key"',
            },
          },
        ]
      : [],
  );
});

it.each(["build", "check", "lint", "export", "shot", "new", "init", "hook"])(
  "rejects --live-term on %s",
  async (command) => {
    const { dir } = await fixture(onTestFinished);
    const process = cli(dir, [command, ".", "--live-term"]);
    expect((await process.exit)[0]).toBe(1);
    expect(process.output().stderr).toBe(
      `decks ${command}: --live-term is only available on decks dev.\n`,
    );
  },
);

it("accepts boolean negation while serving a deck", async () => {
  const { dir } = await fixture(onTestFinished);
  const process = cli(dir, ["dev", ".", "--no-open", "--port", "0"]);
  await process.url();
  expect(process.output().stderr).toBe("");
});

it.each([
  [["--port"], "--port needs a value. Pass --port <n>, a whole number from 0 to 65535."],
  [["--open=false"], "--open does not take a value. Use --open or --no-open."],
  [["extra"], 'unexpected argument "extra". Pass one deck alias or directory.'],
])("explains invalid dev arguments %s", async (args, message) => {
  const { dir } = await fixture(onTestFinished);
  const process = cli(dir, ["dev", ".", ...args]);
  expect((await process.exit)[0]).toBe(1);
  expect(process.output().stderr).toBe(`decks dev: ${message}\n`);
});

it("rejects an unknown build option with the command's options", async () => {
  const { dir } = await fixture(onTestFinished);
  const process = cli(dir, ["build", ".", "--bogus", "1"]);
  expect((await process.exit)[0]).toBe(1);
  expect(process.output().stderr).toBe(
    "decks build: unknown option --bogus. Options: --out, --base.\n",
  );
});

it("keeps an explicit dev port strict without an EADDRINUSE stack", async () => {
  const occupied = createServer();
  await new Promise<void>((resolve) => occupied.listen(0, "localhost", resolve));
  onTestFinished(
    () =>
      new Promise<void>((resolve, reject) =>
        occupied.close((error) => (error ? reject(error) : resolve())),
      ),
  );
  const address = occupied.address();
  if (!address || typeof address === "string") throw new Error("No TCP port");
  const { dir } = await fixture(onTestFinished);
  const process = cli(dir, ["dev", ".", "--port", String(address.port)]);
  expect((await process.exit)[0]).toBe(1);
  expect(process.output().stderr).toBe(
    `decks dev: port ${address.port} is already in use. Stop what is using it or pass a different --port.\n`,
  );
  expect(process.output().stdout).not.toContain("http:");
});

it.each<{ args: string[]; code: number; channel: "stderr" | "stdout" }>([
  { args: [], code: 1, channel: "stderr" },
  { args: ["wat"], code: 1, channel: "stdout" },
])("prints top-level usage for $args", async ({ args, code, channel }) => {
  const { dir } = await fixture(onTestFinished);
  const process = cli(dir, args);
  expect((await process.exit)[0]).toBe(code);
  const usage = process.output()[channel];
  expect(usage).toContain("USAGE decks");
  expect(usage).not.toMatch(/cli\.ts|undefined/);
  expect(usage).toContain("Serve a deck");
  expect(usage).toContain("Build a static deck");
});

it.each([
  ["build", "Output directory", "Base URL"],
  ["dev", "Port to listen on", "Open the deck"],
])("prints %s options in its help", async (command, first, second) => {
  const { dir } = await fixture(onTestFinished);
  const process = cli(dir, [command, "--help"]);
  expect((await process.exit)[0]).toBe(0);
  expect(process.output().stdout).toContain(`USAGE decks ${command}`);
  expect(process.output().stdout).not.toMatch(/cli\.ts|undefined/);
  expect(process.output().stdout).toContain(first);
  expect(process.output().stdout).toContain(second);
});

it.each(["dev", "build", "export", "shot"])(
  "names the registered decks when %s is given no deck",
  async (command) => {
    const { dir } = await fixture(onTestFinished, {
      "decks.json": JSON.stringify({ talk: { dir: "." }, demo: { dir: "." } }),
    });
    const process = cli(dir, [command]);
    expect((await process.exit)[0]).toBe(1);
    expect(process.output().stderr).toBe(
      `decks ${command}: which deck? Pass an alias from decks.json or a deck directory. Registered: talk, demo. For example: decks ${command} talk\n`,
    );
  },
);

it("suggests decks new when no deck is registered and none is given", async () => {
  const { dir } = await fixture(onTestFinished);
  const process = cli(dir, ["dev"]);
  expect((await process.exit)[0]).toBe(1);
  expect(process.output().stderr).toBe(
    "decks dev: which deck? Pass a deck directory (no decks are registered in decks.json; decks new <alias> creates one). For example: decks dev <directory>\n",
  );
});

it("names a missing argument after the deck and points at help", async () => {
  const { dir } = await fixture(onTestFinished);
  const process = cli(dir, ["shot", "."]);
  expect((await process.exit)[0]).toBe(1);
  expect(process.output().stderr).toBe(
    "decks shot: missing <slide>. Run decks shot --help for usage.\n",
  );
});

it("rejects --remote and --remote-port on decks build with the only-on-dev message", async () => {
  const { dir } = await fixture(onTestFinished);
  for (const args of [["--remote"], ["--remote-port", "3040"]]) {
    const process = cli(dir, ["build", ".", ...args]);
    expect((await process.exit)[0]).toBe(1);
    expect(process.output().stderr).toBe("decks build: --remote is only available on decks dev.\n");
  }
});

it("keeps the LAN presenter disabled when a port accompanies --no-remote", async () => {
  const { dir } = await fixture(onTestFinished);
  const child = cli(dir, ["dev", ".", "--no-remote", "--port", "0", "--remote-port", "0"]);
  await child.url();
  expect(child.output().stdout).not.toContain("Remote presenter:");
});

it.each(["SIGINT", "SIGTERM"] as const)("deletes the remote page after %s", async (signal) => {
  const { dir } = await fixture(onTestFinished);
  const temp = join(dir, "temp");
  await mkdir(temp);
  vi.stubEnv("TMPDIR", temp);
  onTestFinished(() => {
    vi.unstubAllEnvs();
  });
  const child = cli(dir, ["dev", ".", "--remote", "--port", "0", "--remote-port", "0"]);
  await child.url();
  expect((await readdir(temp)).filter((name) => name.startsWith("deck-remote-"))).toHaveLength(1);
  child.child.kill(signal);
  await child.exit;
  expect((await readdir(temp)).filter((name) => name.startsWith("deck-remote-"))).toEqual([]);
});
