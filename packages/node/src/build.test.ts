import { access, readdir, readFile, rm } from "node:fs/promises";

import { join } from "node:path";

import { describe, expect, it, onTestFinished } from "vitest";
import { fixture as createFixture, serve, testVite } from "./deck.test-support";
import { build, dev, loadDeck } from "./index";

const fixture = (files?: Record<string, string>) => createFixture(onTestFinished, files);
describe("build", () => {
  it("fails a build in the slide compiler when an uncounted body does not parse", async () => {
    const { dir } = await fixture({ "slides/01-first.mdx": "# Broken\n\n<Step at={3}>" });
    await expect(build(await loadDeck(dir), { outDir: join(dir, "site") })).rejects.toThrow(
      /01-first\.mdx/,
    );
  });
  it("fails a build naming both files when component exports collide", async () => {
    const { dir } = await fixture({
      "components/Badge.tsx": "export default function Badge() {}",
      "components/Other.tsx": "export { default as Badge } from './Badge';",
    });
    await expect(build(await loadDeck(dir), { outDir: join(dir, "site") })).rejects.toThrow(
      /Badge.*components\/Badge\.tsx.*components\/Other\.tsx/,
    );
  });
  it("rejects runtime wildcard re-exports naming the component file", async () => {
    const { dir } = await fixture({ "components/Barrel.tsx": 'export * from "./nested/Badge";' });
    await expect(build(await loadDeck(dir), { outDir: join(dir, "site") })).rejects.toThrow(
      /components\/Barrel\.tsx.*wildcard/,
    );
  });
  it("keeps a deck's public favicon in development and under a build base", async () => {
    const app = await serve({ "public/favicon.ico": "Deck icon" });
    expect(await app.get("/")).toContain('<link rel="icon" href="/favicon.ico">');
    expect(await app.get("/favicon.ico")).toBe("Deck icon");
    const outDir = join(app.dir, "site");
    await build(await loadDeck(app.dir), { outDir, base: "/talk/" });
    expect(await readFile(join(outDir, "index.html"), "utf8")).toContain(
      '<link rel="icon" href="/talk/favicon.ico">',
    );
    expect(await readFile(join(outDir, "favicon.ico"), "utf8")).toBe("Deck icon");
  });
  it.each(["./", "/talk/"])(
    "builds HTML and assets with base %s without creating deck index.html",
    async (base) => {
      const { dir } = await fixture({
        "styles/index.css": "body { margin: 0; }",
        "public/hello.txt": "Static public",
      });
      const outDir = join(dir, "output");
      await build(await loadDeck(dir), { outDir, base });
      const html = await readFile(join(outDir, "index.html"), "utf8");
      expect(html).toContain(`src="${base}assets/`);
      expect(html).toContain(`href="${base}assets/`);
      expect(await readFile(join(outDir, "hello.txt"), "utf8")).toBe("Static public");
      expect((await readdir(join(outDir, "assets"))).some((name) => name.endsWith(".js"))).toBe(
        true,
      );
      await expect(access(join(dir, "index.html"))).rejects.toThrow();
    },
  );
  it("merges deck Vite options last and runs deck plugins in dev and build", async () => {
    const { dir } = await fixture({
      "deck.config.ts": `export default {title:"Plugin deck", vite: {...${JSON.stringify(testVite)},base:"/configured/",build:{outDir:"wrong"},plugins:[{name:"deck-html",transformIndexHtml(html) {return html.replace("</head>","<meta name='deck-plugin' content='applied'></head>")}}]}}`,
    });
    const deck = await loadDeck(dir);
    const server = await dev(deck, { port: 0 });
    onTestFinished(() => server.close());
    const response = await fetch(server.url);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("name='deck-plugin' content='applied'");
    const outDir = join(dir, "site");
    await build(deck, { outDir, base: "/argument/" });
    const html = await readFile(join(outDir, "index.html"), "utf8");
    expect(html).toContain("name='deck-plugin' content='applied'");
    expect(html).toContain('src="/argument/assets/');
  });
  it("empties the build output and never ships the absolute deck path", async () => {
    const { dir } = await fixture({
      "slides/02-deleted.mdx": "# Deleted",
      "public/deleted.txt": "Old public",
    });
    const output = await fixture();
    const outDir = join(output.dir, "site");
    await build(await loadDeck(dir), { outDir });
    await rm(join(dir, "slides/02-deleted.mdx"));
    await rm(join(dir, "public/deleted.txt"));
    await build(await loadDeck(dir), { outDir });
    const cleanOutDir = join(output.dir, "clean");
    await build(await loadDeck(dir), { outDir: cleanOutDir });
    expect((await readdir(outDir, { recursive: true })).sort()).toEqual(
      (await readdir(cleanOutDir, { recursive: true })).sort(),
    );
    await expect(access(join(outDir, "deleted.txt"))).rejects.toThrow();
    expect(await readFile(join(outDir, "index.html"), "utf8")).not.toContain(dir);
  });
  it("uses the ResolvedDeck supplied to the plugin instead of rereading config", async () => {
    const { dir, put } = await fixture();
    const deck = await loadDeck(dir);
    await put("deck.config.ts", 'export default { title: "Changed on disk" };');
    await build(deck, { outDir: join(dir, "site") });
    expect(await readFile(join(dir, "site/index.html"), "utf8")).toContain(
      "<title>Test deck</title>",
    );
  });
  it("uses the deck's configured build base when the caller omits base", async () => {
    const { dir } = await fixture({
      "deck.config.ts": 'export default { title: "Deck base", vite: { base: "/configured/" } };',
    });
    await build(await loadDeck(dir), { outDir: join(dir, "site") });
    expect(await readFile(join(dir, "site/index.html"), "utf8")).toContain(
      'src="/configured/assets/',
    );
  });
});
