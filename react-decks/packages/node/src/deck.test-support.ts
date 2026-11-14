import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { createServer } from "vite";
import { expect, onTestFinished, vi } from "vitest";
import { loadDeck, type ResolvedDeck, reactDecks, scanSlides } from "./index";

export const testVite = { optimizeDeps: { noDiscovery: true, include: [] } };

export function cli(cwd: string, args: string[]) {
  const child = spawn(
    resolve("node_modules/.bin/tsx"),
    [resolve("packages/node/src/cli.ts"), ...args],
    {
      cwd,
      env: { ...process.env, NO_COLOR: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (data) => {
    stdout += String(data);
  });
  child.stderr.on("data", (data) => {
    stderr += String(data);
  });
  const exit = once(child, "close");
  onTestFinished(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGTERM");
      await exit;
    }
  });
  return { child, exit, output: () => ({ stdout, stderr }) };
}

export const waitForWatcher = (assertion: () => void | Promise<void>) =>
  vi.waitFor(assertion, { timeout: 10_000 });

export async function fixture(
  cleanup: (callback: () => Promise<void>) => void,
  files: Record<string, string> = {},
) {
  const root = resolve(".tmp");
  await mkdir(root, { recursive: true });
  const dir = await mkdtemp(join(root, "node-"));
  cleanup(() => rm(dir, { recursive: true, force: true }));
  await mkdir(join(dir, "node_modules/@react-decks"), { recursive: true });
  for (const name of ["node", "runtime", "motion"])
    await symlink(resolve("packages", name), join(dir, "node_modules/@react-decks", name), "dir");
  const put = async (file: string, text: string) => {
    await mkdir(dirname(join(dir, file)), { recursive: true });
    await writeFile(join(dir, file), text);
  };
  for (const [file, text] of Object.entries({
    "package.json": '{ "private": true, "type": "module" }',
    "deck.config.ts": `export default ${JSON.stringify({ title: "Test deck", vite: testVite })};`,
    "slides/01-first.mdx": "# First slide",
    ...files,
  }))
    await put(file, text);
  return { dir, put };
}

export async function testServer(deck: ResolvedDeck) {
  const server = await createServer({
    configFile: false,
    plugins: reactDecks(deck),
    ...testVite,
    server: { port: 0 },
    logLevel: "silent",
  });
  onTestFinished(() => server.close());
  return server;
}

export async function serve(files: Record<string, string> = {}) {
  const markers = Array.from({ length: 8 }, (_, index) => `sentinel-${index}.css`);
  const deck = await fixture(onTestFinished, {
    ...Object.fromEntries(markers.map((file) => [file, "body { --sentinel: 0; }"])),
    ...files,
  });
  const server = await testServer(await loadDeck(deck.dir));
  await server.listen();
  const url = server.resolvedUrls?.local[0];
  if (!url) throw new Error("No Vite URL");
  const get = async (path: string) => {
    const response = await fetch(new URL(path, url));
    const text = await response.text();
    expect(response.status, text).toBe(200);
    return text;
  };
  const socket = new WebSocket(
    `${url.replace("http", "ws")}?token=${server.config.webSocketToken}`,
    "vite-hmr",
  );
  const messages: string[] = [];
  socket.addEventListener("message", (event) => messages.push(String(event.data)));
  onTestFinished(() => socket.close());
  await waitForWatcher(() =>
    expect(messages.some((message) => message.includes('"type":"connected"'))).toBe(true),
  );
  await waitForWatcher(() =>
    expect(server.watcher.getWatched()[join(deck.dir, "slides")]).toContain("01-first.mdx"),
  );
  for (const file of markers) await get(`/${file}`);
  await waitForWatcher(() =>
    expect(server.watcher.getWatched()[deck.dir]).toEqual(expect.arrayContaining(markers)),
  );
  let sentinel = 0;
  async function checkpoint() {
    const file = markers[sentinel++];
    if (!file) throw new Error("The four-edit HMR fixture has no unused checkpoint marker");
    const start = messages.length;
    await deck.put(file, "body { --sentinel: 1; }");
    await waitForWatcher(() =>
      expect(
        messages
          .slice(start)
          .some((message) => message.includes('"type":"update"') && message.includes(`"/${file}"`)),
        `${file}: ${messages.slice(start).join("\n")}`,
      ).toBe(true),
    );
  }
  return { ...deck, server, url, get, messages, checkpoint };
}

export const virtual = (name: string) => `/@id/__x00__virtual:react-decks/${name}`;

export async function virtualModule(app: Awaited<ReturnType<typeof serve>>, name: string) {
  // Loading the virtual id in SSR would recompute data and hide a stale client response.
  const file = `observed-${name}-${crypto.randomUUID()}.mjs`;
  await app.put(file, await app.get(virtual(name)));
  return app.server.ssrLoadModule(`/${file}`);
}

export const manifest = (app: Awaited<ReturnType<typeof serve>>) => virtualModule(app, "manifest");

export async function scanMotion(body: string) {
  const { dir } = await fixture(onTestFinished, {
    "components/motion.tsx":
      'export { Step, Steps, Stagger, TextReveal, Highlight, CountUp, Draw } from "@react-decks/motion";',
    "slides/01-first.mdx": body,
  });
  return scanSlides(await loadDeck(dir));
}
