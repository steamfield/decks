import { EventEmitter, once } from "node:events";
import { readFile } from "node:fs/promises";

import { join } from "node:path";

import { describe, expect, it, onTestFinished } from "vitest";
import { dev, loadDeck } from "../index";
import {
  fixture as createFixture,
  manifest,
  serve,
  testVite,
  waitForWatcher,
} from "./server.test-support";

const fixture = (files?: Record<string, string>) => createFixture(onTestFinished, files);
describe("config-restart", { timeout: 60_000 }, () => {
  it("does not resend a repaired config error to clients connecting before restart resolves", async () => {
    const app = await serve();
    const original = await readFile(join(app.dir, "deck.config.ts"), "utf8");
    await app.put("deck.config.ts", "export default { title: 42 }");
    await waitForWatcher(() =>
      expect(app.messages.some((message) => message.includes("title must be a string"))).toBe(true),
    );

    const connect = async () => {
      const socket = new WebSocket(app.url.replace("http", "ws"), "vite-hmr");
      const messages: string[] = [];
      socket.addEventListener("message", (event) => messages.push(String(event.data)));
      onTestFinished(() => socket.close());
      await waitForWatcher(() =>
        expect(messages.some((message) => message.includes('"type":"connected"'))).toBe(true),
      );
      return { socket, messages };
    };
    const invalid = await connect();
    await waitForWatcher(() =>
      expect(invalid.messages.some((message) => message.includes("title must be a string"))).toBe(
        true,
      ),
    );
    invalid.socket.close();
    const reconnected = await connect();
    await waitForWatcher(() =>
      expect(
        reconnected.messages.some((message) => message.includes("title must be a string")),
      ).toBe(true),
    );

    const events = new EventEmitter();
    const listening = once(events, "listening");
    const released = once(events, "release");
    const completed = once(events, "completed");
    const restart = app.server.restart.bind(app.server);
    // Keep Vite's real replacement listening while its caller still awaits restart.
    app.server.restart = async (forceOptimize) => {
      await restart(forceOptimize);
      events.emit("listening");
      await released;
    };
    const info = app.server.config.logger.info;
    app.server.config.logger.info = (message) => {
      info(message);
      if (message === "deck.config.ts is valid again, restarting.") events.emit("completed");
    };
    try {
      await app.put("deck.config.ts", original);
      await listening;
      const during = await connect();
      app.server.ws.send({ type: "custom", event: "during-restart", data: null });
      await waitForWatcher(() =>
        expect(during.messages.some((message) => message.includes("during-restart"))).toBe(true),
      );
      expect(during.messages.filter((message) => message.includes('"type":"error"'))).toEqual([]);
      events.emit("release");
      await completed;
      const after = await connect();
      app.server.ws.send({ type: "custom", event: "after-restart", data: null });
      await waitForWatcher(() => {
        for (const client of [during, after])
          expect(client.messages.some((message) => message.includes("after-restart"))).toBe(true);
      });
      for (const client of [during, after])
        expect(client.messages.filter((message) => message.includes('"type":"error"'))).toEqual([]);
    } finally {
      events.emit("release");
    }
  });
  it("reconciles a config save made while the server is starting", async () => {
    const app = await fixture({
      "release.txt": "Waiting",
      "deck.config.ts": `import { watch, writeFileSync } from "node:fs";
export default { title: "Startup title", vite: { ...${JSON.stringify(testVite)}, plugins: [{ name: "pause-startup",
  async configResolved() {
    await new Promise(resolve => {
      const watcher = watch(new URL("./release.txt", import.meta.url), () => { watcher.close(); resolve(); });
      writeFileSync(new URL("./startup-started.txt", import.meta.url), "Ready");
    });
  }
}] } };`,
    });
    const starting = dev(await loadDeck(app.dir), { port: 0 });
    try {
      await waitForWatcher(async () =>
        expect(await readFile(join(app.dir, "startup-started.txt"), "utf8")).toBe("Ready"),
      );
      await app.put(
        "deck.config.ts",
        `import { writeFileSync } from "node:fs";
export default { title: "Saved during startup", vite: { ...${JSON.stringify(testVite)}, plugins: [{ name: "restart-listened",
  configureServer(server) {
    server.httpServer.once("listening", () =>
      writeFileSync(new URL("./restart-listened.txt", import.meta.url), "Ready"));
  }
}] } };`,
      );
    } finally {
      await app.put("release.txt", "Continue");
    }
    const server = await starting;
    onTestFinished(() => server.close());
    await waitForWatcher(async () =>
      expect(await readFile(join(app.dir, "restart-listened.txt"), "utf8")).toBe("Ready"),
    );
    await waitForWatcher(async () =>
      expect(await (await fetch(server.url)).text()).toContain(
        "<title>Saved during startup</title>",
      ),
    );
  }, 40_000);
  it("restarts and serves new HTML and manifest when deck.config.ts changes", async () => {
    const app = await serve();
    expect(await app.get("/")).toContain("Test deck");
    expect((await manifest(app)).manifest.title).toBe("Test deck");
    await app.put(
      "deck.config.ts",
      'export default {title:"Restarted deck",canvas:{width:800,height:600}}',
    );
    // One save can reach the watcher as two events and restart twice, so a request made
    // between them is reset: both assertions wait for the server to come back.
    await waitForWatcher(async () => {
      expect(await app.get("/")).toContain("Restarted deck");
      expect((await manifest(app)).manifest.canvas.width).toBe(800);
    });
  });
  it("serializes config saves during restart and serves the latest title", async () => {
    const app = await serve({ "release.txt": "Waiting" });
    await app.get("/");
    await app.put(
      "deck.config.ts",
      `import { watch, writeFileSync } from "node:fs";
export default { title: "First save", vite: { plugins: [{ name: "pause-restart",
  async configResolved() {
    await new Promise(resolve => {
      const watcher = watch(new URL("./release.txt", import.meta.url), () => { watcher.close(); resolve(); });
      writeFileSync(new URL("./restart-started.txt", import.meta.url), "Ready");
    });
  }
}] } };`,
    );
    await waitForWatcher(async () =>
      expect(await readFile(join(app.dir, "restart-started.txt"), "utf8")).toBe("Ready"),
    );
    await app.put("deck.config.ts", 'export default { title: "Second save" };');
    await app.put("release.txt", "Continue");
    await waitForWatcher(async () =>
      expect(await app.get("/")).toContain("<title>Second save</title>"),
    );
    expect((await manifest(app)).manifest.title).toBe("Second save");
  });
  it("drops removed Vite overrides and replaces deck plugins when config restarts", async () => {
    const { dir, put } = await fixture({
      "deck.config.ts": `export default { title:"Before restart", vite:{...${JSON.stringify(testVite)},base:"/old/",plugins:[{name:"old-html",transformIndexHtml(html){return html.replace("</head>","<meta name=old-plugin></head>")}}]} };`,
    });
    const server = await dev(await loadDeck(dir), { port: 0 });
    onTestFinished(() => server.close());
    expect(await (await fetch(server.url)).text()).toContain("name=old-plugin");
    await put(
      "deck.config.ts",
      `export default { title:"After restart", vite:{...${JSON.stringify(testVite)},plugins:[{name:"new-html",transformIndexHtml(html){return html.replace("</head>","<meta name=new-plugin></head>")}}]} };`,
    );
    const rootUrl = new URL("/", server.url);
    await waitForWatcher(async () => {
      const response = await fetch(rootUrl, { redirect: "manual" });
      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain("After restart");
      expect(html).toContain("name=new-plugin");
      expect(html).not.toContain("name=old-plugin");
    });
  });
});
