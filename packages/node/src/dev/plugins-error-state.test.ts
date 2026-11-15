import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { createLogger } from "vite";
import { describe, expect, it, onTestFinished } from "vitest";
import { dev, loadDeck } from "../index";
import { cli, fixture, serve, testVite, virtual, waitForWatcher } from "./server.test-support";

describe("dev error state", { timeout: 60_000 }, () => {
  it("keeps invalid frontmatter reported after a reload and reports its repair", async () => {
    const { dir, put } = await fixture(onTestFinished);
    const process = cli(dir, ["dev", ".", "--port", "0"]);
    const url = await process.url();
    await fetch(new URL(virtual("manifest"), url));
    await fetch(new URL("/slides/01-first.mdx", url));
    await put("slides/01-first.mdx", '---\nclicks: "two"\n---\n# First slide');
    const message =
      'slides/01-first.mdx: frontmatter clicks must be a whole number 0 or greater, got "two".';
    await waitForWatcher(() => expect(process.output().stderr).toBe(`${message}\n`));
    const reload = await fetch(new URL(virtual("manifest"), url));
    expect(reload.status).toBe(500);
    expect(await reload.text()).toContain(message.replaceAll('"', '\\"'));
    await put("slides/01-first.mdx", "# Repaired");
    await waitForWatcher(() =>
      expect(process.output().stdout).toContain("slides/01-first.mdx: fixed"),
    );
    expect((await fetch(new URL(virtual("manifest"), url))).status).toBe(200);
    expect(process.output().stderr).toBe(`${message}\n`);
  });

  it.each([
    {
      label: "wrong type",
      source: "export default {title:42}",
      message: "deck.config.ts: title must be a string, got 42.",
    },
    {
      label: "no default export",
      source: "export const title = 'Deck'",
      message:
        'deck.config.ts has no default export. Write: export default defineDeck({ title: "..." })',
    },
    {
      label: "empty file",
      source: "",
      message:
        'deck.config.ts has no default export. Write: export default defineDeck({ title: "..." })',
    },
  ])(
    "keeps the last config for $label, persists its error, and announces a valid save",
    async ({ source, message }) => {
      const { dir, put } = await fixture(onTestFinished);
      const process = cli(dir, ["dev", ".", "--port", "0"]);
      const url = await process.url();
      await fetch(new URL(virtual("manifest"), url));
      await put("deck.config.ts", source);
      await waitForWatcher(() => expect(process.output().stderr).toBe(`${message}\n`));
      expect(process.output().stdout).toContain(
        "deck.config.ts is invalid, still serving the last valid config:",
      );
      expect(await (await fetch(url)).text()).toContain("<title>Test deck</title>");
      const lastValid = await fetch(new URL(virtual("manifest"), url));
      expect(lastValid.status).toBe(200);
      expect(await lastValid.text()).toContain("Test deck");
      await put(
        "deck.config.ts",
        `export default ${JSON.stringify({ title: "Recovered", vite: testVite })}`,
      );
      await waitForWatcher(async () =>
        expect(await (await fetch(url)).text()).toContain("<title>Recovered</title>"),
      );
      expect(process.output().stdout).toContain("deck.config.ts is valid again, restarting.");
      expect(process.output().stderr).toBe(`${message}\n`);
      await put("deck.config.ts", source);
      await waitForWatcher(() => expect(process.output().stderr).toBe(`${message}\n`.repeat(2)));
    },
  );

  it("reloads a slide that never compiled even when its metadata is unchanged", async () => {
    const app = await serve({ "slides/01-first.mdx": "<div" });
    await app.get(virtual("manifest"));
    expect((await fetch(new URL("/slides/01-first.mdx", app.url))).status).toBe(500);
    const start = app.messages.length;
    await app.put("slides/01-first.mdx", "# Repaired");
    await waitForWatcher(() =>
      expect(
        app.messages.slice(start).some((message) => message.includes('"type":"full-reload"')),
      ).toBe(true),
    );
    expect(await app.get("/slides/01-first.mdx")).toContain("Repaired");
  });

  it("reloads after repairing a component validation failure even if its exports did not change", async () => {
    const app = await serve({ "components/Badge.tsx": "export function Badge(){return null}" });
    await app.get(virtual("manifest"));
    await app.get(virtual("components"));
    await app.get("/components/Badge.tsx");
    await app.put("components/Badge.tsx", "export function Badge( {");
    await waitForWatcher(() =>
      expect(app.messages.some((message) => message.includes('"type":"error"'))).toBe(true),
    );
    expect((await fetch(new URL(virtual("manifest"), app.url))).status).toBe(500);
    const start = app.messages.length;
    await app.put("components/Badge.tsx", "export function Badge(){return null}");
    await waitForWatcher(() =>
      expect(
        app.messages.slice(start).some((message) => message.includes('"type":"full-reload"')),
      ).toBe(true),
    );
    expect((await fetch(new URL(virtual("manifest"), app.url))).status).toBe(200);
  });

  it("waits for an in-flight config restart before close resolves", async () => {
    const { dir, put } = await fixture(onTestFinished, { "release.txt": "Wait" });
    const errors: string[] = [];
    const logger = createLogger("silent");
    logger.error = (message) => errors.push(message);
    const deck = await loadDeck(dir);
    const server = await dev(
      { ...deck, config: { ...deck.config, vite: { ...testVite, customLogger: logger } } },
      { port: 0 },
    );
    onTestFinished(() => server.close());
    await fetch(server.url);
    await put(
      "deck.config.ts",
      `import {watch,writeFileSync} from "node:fs";
export default {title:"Restarting",vite:{...${JSON.stringify(testVite)},plugins:[{name:"pause-restart",async configResolved(){
await new Promise(resolve=>{const watcher=watch(new URL("./release.txt",import.meta.url),()=>{watcher.close();resolve()});writeFileSync(new URL("./restarting.txt",import.meta.url),"Ready")});
}}]}}`,
    );
    await waitForWatcher(async () =>
      expect(await readFile(join(dir, "restarting.txt"), "utf8")).toBe("Ready"),
    );
    const closed = server.close();
    await put("release.txt", "Continue");
    await closed;
    await rm(dir, { recursive: true, force: true });
    await expect(fetch(server.url)).rejects.toThrow();
    expect(errors).toEqual([]);
  });

  it("stops an immediate save-and-close before reading the removed deck", async () => {
    const { dir, put } = await fixture(onTestFinished);
    const errors: string[] = [];
    const logger = createLogger("silent");
    logger.error = (message) => errors.push(message);
    const deck = await loadDeck(dir);
    const server = await dev(
      { ...deck, config: { ...deck.config, vite: { ...testVite, customLogger: logger } } },
      { port: 0 },
    );
    await fetch(server.url);
    await put("deck.config.ts", 'export default {title:"Saved"}');
    await server.close();
    await rm(dir, { recursive: true, force: true });
    await expect(fetch(server.url)).rejects.toThrow();
    expect(errors).toEqual([]);
  });

  it("clears a component failure when its file is removed", async () => {
    const app = await serve({ "components/Badge.tsx": "export function Badge(){return null}" });
    await app.get(virtual("manifest"));
    await app.get("/components/Badge.tsx");
    await app.put("components/Badge.tsx", "export function Badge( {");
    await waitForWatcher(() =>
      expect(app.messages.some((message) => message.includes('"type":"error"'))).toBe(true),
    );
    expect((await fetch(new URL(virtual("manifest"), app.url))).status).toBe(500);
    await rm(join(app.dir, "components/Badge.tsx"));
    await waitForWatcher(async () =>
      expect((await fetch(new URL(virtual("manifest"), app.url))).status).toBe(200),
    );
  });

  it("recovers when a slide is added after the deck temporarily has none", async () => {
    const app = await serve();
    await app.get(virtual("manifest"));
    await rm(join(app.dir, "slides/01-first.mdx"));
    await waitForWatcher(async () =>
      expect((await fetch(new URL(virtual("manifest"), app.url))).status).toBe(500),
    );
    await app.put("slides/02-restored.mdx", "# Restored");
    await waitForWatcher(async () =>
      expect(await app.get(virtual("manifest"))).toContain("02-restored"),
    );
  });

  it("serves the previous config until its replacement server can accept requests", async () => {
    const { dir, put } = await fixture(onTestFinished, { "release.txt": "Wait" });
    const server = await dev(await loadDeck(dir), { port: 0 });
    onTestFinished(() => server.close());
    await fetch(server.url);
    try {
      await put(
        "deck.config.ts",
        `import {watch,writeFileSync} from "node:fs";
export default {title:"Next config",vite:{...${JSON.stringify(testVite)},plugins:[{name:"pause-config",async configResolved(){
await new Promise(resolve=>{const watcher=watch(new URL("./release.txt",import.meta.url),()=>{watcher.close();resolve()});writeFileSync(new URL("./restarting.txt",import.meta.url),"Ready")});
}}]}}`,
      );
      await waitForWatcher(async () =>
        expect(await readFile(join(dir, "restarting.txt"), "utf8")).toBe("Ready"),
      );
      expect(await (await fetch(server.url)).text()).toContain("<title>Test deck</title>");
    } finally {
      await put("release.txt", "Continue");
    }
    await waitForWatcher(async () =>
      expect(await (await fetch(server.url)).text()).toContain("<title>Next config</title>"),
    );
  });
});
