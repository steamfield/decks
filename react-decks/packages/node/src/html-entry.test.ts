import { access } from "node:fs/promises";

import { join } from "node:path";

import { describe, expect, it, onTestFinished } from "vitest";
import { fixture as createFixture, serve, virtual } from "./deck.test-support";
import { dev, loadDeck } from "./index";

const fixture = (files?: Record<string, string>) => createFixture(onTestFinished, files);
describe("html-entry", () => {
  it("serves all HTML metadata, the entry and public files without creating index.html", async () => {
    const app = await serve({
      "deck.config.ts":
        'export default {title:"A <talk> & friends",author:"A & B",htmlAttrs:{lang:"en","data-theme":"dark"}}',
      "styles/index.css": "body { margin: 0; }",
      "public/hello.txt": "Hello public",
    });
    const html = await app.get("/");
    expect(html).toContain('<html lang="en" data-theme="dark">');
    expect(html).toContain("<title>A &lt;talk&gt; &amp; friends</title>");
    expect(html).toContain('<meta name="author" content="A &amp; B">');
    expect(html).toContain('<link rel="icon" href="data:,">');
    expect(html).toContain(`<meta name="decks:entry" content="${app.dir}">`);
    expect(html).toContain(`<meta name="decks:name" content="${app.dir.split("/").at(-1)}">`);
    expect(html).toContain('<div id="deck-root"></div>');
    expect(html).toContain('type="module" src="/virtual:react-decks/entry"');
    expect(html).toContain("/@vite/client");
    const entry = await app.get(virtual("entry"));
    expect(entry).toMatch(/\bmountDeck\s*\(/);
    expect(entry).toMatch(/\bimport\s*\([^)]*virtual:react-decks\/notes/);
    expect(entry).toContain("/styles/index.css");
    expect(await app.get("/hello.txt")).toBe("Hello public");
    await expect(access(join(app.dir, "index.html"))).rejects.toThrow();
  });
  it("omits author metadata and optional CSS when absent", async () => {
    const app = await serve();
    expect(await app.get("/")).not.toContain('name="author"');
    expect(await app.get(virtual("entry"))).not.toContain("/styles/index.css");
  });
  it("starts and closes dev with no deck index.html written", async () => {
    const { dir } = await fixture();
    const server = await dev(await loadDeck(dir), { port: 0 });
    onTestFinished(() => server.close());
    expect((await fetch(server.url)).status).toBe(200);
    await expect(access(join(dir, "index.html"))).rejects.toThrow();
  });
});
