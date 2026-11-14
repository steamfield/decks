import { readFile } from "node:fs/promises";

import { join } from "node:path";

import { describe, expect, it, onTestFinished } from "vitest";
import {
  fixture as createFixture,
  manifest,
  serve,
  testVite,
  waitForWatcher,
} from "./deck.test-support";
import { dev, loadDeck } from "./index";

const fixture = (files?: Record<string, string>) => createFixture(onTestFinished, files);
describe("config-restart", { timeout: 60_000 }, () => {
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
