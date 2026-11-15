import { join } from "node:path";
import { createLogger, createServer } from "vite";
import { describe, expect, it, onTestFinished, vi } from "vitest";
import { loadDeck } from "./config";
import { createDeckPlugins } from "./plugins";
import { cli, fixture, serve, testVite, virtual, waitForWatcher } from "./server.test-support";

describe("scan recovery", { timeout: 60_000 }, () => {
  const coldFailures: Record<string, string>[] = [
    { "slides/01-first.mdx": '---\nclicks: "two"\n---\n# Broken' },
    { "components/Badge.tsx": "export function Badge( {" },
    { "layers/side.tsx": "export default function Side(){return null}" },
  ];
  it.each(coldFailures)(
    "serves a cold-start author failure and exits when stopped: %j",
    async (files) => {
      const { dir } = await fixture(onTestFinished, files);
      const process = cli(dir, ["dev", ".", "--port", "0"]);
      const url = await process.url();
      expect((await fetch(url)).status).toBe(200);
      expect((await fetch(new URL(virtual("manifest"), url))).status).toBe(500);
      process.child.kill("SIGTERM");
      await process.exit;
    },
  );

  it.each([
    { label: "ordinary", hook: 'configureServer(){throw new TypeError("Startup plugin failed")}' },
    {
      label: "ordered",
      hook: 'configureServer:{order:"pre",handler(){throw new TypeError("Startup plugin failed")}}',
    },
  ])(
    "exits after a non-author $label configureServer failure instead of leaking its watcher",
    async ({ hook }) => {
      const { dir } = await fixture(onTestFinished, {
        "deck.config.ts": `export default {title:"Failure",vite:{...${JSON.stringify(testVite)},plugins:[{name:"broken-startup",${hook}}]}}`,
      });
      const process = cli(dir, ["dev", ".", "--port", "0"]);
      const [code] = await process.exit;
      expect(code).toBe(1);
      expect(process.output().stderr).toContain("Startup plugin failed");
    },
  );

  it("restarts a recovered config even while a slide is invalid", async () => {
    const app = await serve();
    await app.get(virtual("manifest"));
    await app.put("deck.config.ts", "export default {title:42}");
    await waitForWatcher(() => expect(app.messages.join()).toContain("title must be a string"));
    await app.put("slides/01-first.mdx", '---\nclicks: "two"\n---\n# Broken');
    await app.put(
      "deck.config.ts",
      `export default ${JSON.stringify({ title: "Recovered", vite: testVite })}`,
    );
    await waitForWatcher(async () =>
      expect(await app.get("/")).toContain("<title>Recovered</title>"),
    );
    await app.put("slides/01-first.mdx", "# Fixed");
    await waitForWatcher(async () =>
      expect(await app.get(virtual("manifest"))).toContain('"title":"Recovered"'),
    );
  });

  it("clears a duplicate-name scan failure when the other component is edited", async () => {
    const app = await serve({
      "components/A.tsx": "export function Badge(){return null}",
      "components/B.tsx": "export function Other(){return null}",
    });
    await app.get(virtual("manifest"));
    await app.get("/components/B.tsx");
    await app.put("components/B.tsx", "export function Badge(){return null}");
    await waitForWatcher(() => expect(app.messages.join()).toContain("Duplicate component Badge"));
    expect((await fetch(new URL(virtual("manifest"), app.url))).status).toBe(500);
    await app.put("components/A.tsx", "export function Renamed(){return null}");
    await waitForWatcher(async () =>
      expect((await fetch(new URL(virtual("manifest"), app.url))).status).toBe(200),
    );
  });

  it("clears a slide counting failure when a component shadows the motion name", async () => {
    const app = await serve({ "components/A.tsx": "export function Badge(){return null}" });
    await app.get(virtual("manifest"));
    await app.get("/slides/01-first.mdx");
    await app.put("slides/01-first.mdx", "<Step at={value}>Text</Step>");
    await waitForWatcher(() => expect(app.messages.join()).toContain("at must be a literal"));
    await app.put("components/A.tsx", "export function Step(){return null}");
    await waitForWatcher(async () =>
      expect((await fetch(new URL(virtual("manifest"), app.url))).status).toBe(200),
    );
  });

  it("prints no orphan config header when the same invalid source is saved twice", async () => {
    const { dir, put } = await fixture(onTestFinished);
    const infos: string[] = [];
    const errors: string[] = [];
    const logger = createLogger("silent");
    logger.info = (message) => infos.push(message);
    logger.error = (message) => errors.push(message);
    const server = await createServer({
      configFile: false,
      plugins: createDeckPlugins(await loadDeck(dir)).plugins,
      ...testVite,
      server: { port: 0 },
      customLogger: logger,
    });
    onTestFinished(() => server.close());
    await server.listen();
    const url = server.resolvedUrls?.local[0];
    if (!url) throw new Error("No URL");
    const socket = new WebSocket(url.replace("http", "ws"), "vite-hmr");
    onTestFinished(() => socket.close());
    const messages: string[] = [];
    socket.addEventListener("message", (event) => messages.push(String(event.data)));
    await waitForWatcher(() => expect(messages.join()).toContain('"type":"connected"'));
    await waitForWatcher(() =>
      expect(server.watcher.getWatched()[dir]).toContain("deck.config.ts"),
    );
    for (let save = 0; save < 2; save++) {
      const previous = messages.filter((message) => message.includes('"type":"error"')).length;
      await put("deck.config.ts", "export default {title:42}");
      await waitForWatcher(() =>
        expect(
          messages.filter((message) => message.includes('"type":"error"')).length,
        ).toBeGreaterThan(previous),
      );
    }
    expect(infos.filter((line) => line.includes("is invalid, still serving"))).toHaveLength(1);
    expect(errors).toHaveLength(1);
    await put(
      "deck.config.ts",
      `export default ${JSON.stringify({ title: "Repaired", vite: testVite })}`,
    );
    await waitForWatcher(() =>
      expect(infos).toContain("deck.config.ts is valid again, restarting."),
    );
  });

  it("ignores a structural event after stop even before Vite closes", async () => {
    const { dir } = await fixture(onTestFinished);
    const lifecycle = createDeckPlugins(await loadDeck(dir));
    const server = await createServer({
      configFile: false,
      plugins: lifecycle.plugins,
      ...testVite,
      server: { port: 0 },
      logLevel: "silent",
    });
    onTestFinished(() => server.close());
    await server.listen();
    const url = server.resolvedUrls?.local[0];
    if (!url) throw new Error("No URL");
    const socket = new WebSocket(url.replace("http", "ws"), "vite-hmr");
    onTestFinished(() => socket.close());
    const received: string[] = [];
    socket.addEventListener("message", (event) => received.push(String(event.data)));
    await waitForWatcher(() => expect(received.join()).toContain('"type":"connected"'));
    await lifecycle.stop();
    vi.useFakeTimers();
    try {
      server.watcher.emit("add", join(dir, "slides/02-late.mdx"));
      await vi.advanceTimersByTimeAsync(100);
    } finally {
      vi.useRealTimers();
    }
    // The ping response follows any reload sent by the timer on this same connection.
    const pong = new Promise<void>((resolve) =>
      socket.addEventListener("message", (event) => {
        if (String(event.data).includes("pong")) resolve();
      }),
    );
    server.ws.send({ type: "custom", event: "pong", data: null });
    await pong;
    expect(received.join()).not.toContain('"type":"full-reload"');
  });
});
