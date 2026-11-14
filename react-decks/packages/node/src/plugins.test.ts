import { access, readdir, readFile, rename, rm } from "node:fs/promises";
import { join } from "node:path";
import { createServer } from "vite";
import { describe, expect, it, onTestFinished, vi } from "vitest";
import { fixture as createFixture } from "./deck.test-support";
import { build, dev, loadDeck, reactDecks } from "./index";

const fixture = (files?: Record<string, string>) => createFixture(onTestFinished, files);

async function serve(files: Record<string, string> = {}) {
  const deck = await fixture(files);
  const server = await createServer({
    configFile: false,
    plugins: reactDecks(await loadDeck(deck.dir)),
    server: { port: 0 },
    logLevel: "silent",
  });
  onTestFinished(() => server.close());
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
  await vi.waitFor(() =>
    expect(messages.some((message) => message.includes('"type":"connected"'))).toBe(true),
  );
  await vi.waitFor(() =>
    expect(server.watcher.getWatched()[join(deck.dir, "slides")]).toContain("01-first.mdx"),
  );
  return { ...deck, server, url, get, messages };
}

const virtual = (name: string) => `/@id/__x00__virtual:react-decks/${name}`;

describe("deck modules and HTML", () => {
  it("serves manifest loaders and all frontmatter while hidden slides never compile", async () => {
    const app = await serve({
      "slides/02-hidden.mdx": "---\nhide: true\n---\n<broken",
      "slides/03-last.mdx": "---\ncustom: yes\n---\n# Last",
    });
    const code = await app.get(virtual("manifest"));
    expect(code).toContain('"no":1');
    expect(code).toContain('"no":2');
    expect(code).toContain('"custom":"yes"');
    expect(code).toContain('import("/slides/01-first.mdx")');
    expect(code).not.toContain("02-hidden");
    expect(await app.get("/slides/01-first.mdx")).toContain("First slide");
  });
  it("provides named exports and defaults under basenames and ignores subdirectories", async () => {
    const app = await serve({
      "components/Badge.tsx":
        "export default function Badge() { return <span>Badge</span> }; export const Accent = () => <b>Accent</b>;",
      "components/Other.tsx": "export function Other() { return <i>Other</i> }",
      "components/nested/ignored.tsx": 'throw new Error("must not load")',
    });
    const module = await app.server.ssrLoadModule("virtual:react-decks/components");
    expect(Object.keys(module.components).sort()).toEqual(["Accent", "Badge", "Other"]);
    for (const component of Object.values(module.components))
      expect(typeof component).toBe("function");
  });
  it("names both files when component exports collide", async () => {
    const app = await serve({
      "components/Badge.tsx": "export default function Badge() {}",
      "components/Other.tsx": "export function Badge() {}",
    });
    await expect(app.server.ssrLoadModule("virtual:react-decks/components")).rejects.toThrow(
      /Badge.*components\/Badge\.tsx.*components\/Other\.tsx/,
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
  it("accepts a component exported as both named and default from the same file", async () => {
    const app = await serve({
      "components/Badge.tsx": "export function Badge() {} export default Badge;",
    });
    const module = await app.server.ssrLoadModule("virtual:react-decks/components");
    expect(Object.keys(module.components)).toEqual(["Badge"]);
    expect(typeof module.components.Badge).toBe("function");
  });
  it("rejects runtime wildcard re-exports naming the component file", async () => {
    const { dir } = await fixture({ "components/Barrel.tsx": 'export * from "./nested/Badge";' });
    await expect(build(await loadDeck(dir), { outDir: join(dir, "site") })).rejects.toThrow(
      /components\/Barrel\.tsx.*wildcard/,
    );
  });
  it("ignores type exports while providing explicit re-exports", async () => {
    const app = await serve({
      "components/Barrel.tsx":
        'export type * from "./nested/Badge"; export type Props = {}; export { Badge as Renamed } from "./nested/Badge";',
      "components/nested/Badge.tsx": "export function Badge() { return null; }",
    });
    const module = await app.server.ssrLoadModule("virtual:react-decks/components");
    expect(Object.keys(module.components)).toEqual(["Renamed"]);
    expect(typeof module.components.Renamed).toBe("function");
  });
  it.each(["<Notes >\n**Secret**\n</Notes >", "<Notes\n>\n**Secret**\n</Notes\n>"])(
    "extracts notes children with whitespace in the tags: %s",
    async (notes) => {
      const app = await serve({ "slides/01-first.mdx": `# Audience\n\n${notes}` });
      expect((await app.server.ssrLoadModule("virtual:react-decks/notes")).notes).toEqual({
        "01-first": [{ click: 0, html: "<p><strong>Secret</strong></p>" }],
      });
      expect(await app.get("/slides/01-first.mdx")).not.toContain("Secret");
    },
  );
  it("treats self-closing Notes as no notes", async () => {
    const app = await serve({ "slides/01-first.mdx": "# Audience\n\n<Notes />" });
    expect((await app.server.ssrLoadModule("virtual:react-decks/notes")).notes).toEqual({});
    expect(await app.get("/slides/01-first.mdx")).not.toContain("Notes");
  });
  it("names the file when notes parsing fails", async () => {
    const app = await serve({ "slides/01-first.mdx": "# Audience\n\n<Notes>\n<broken" });
    await expect(app.server.ssrLoadModule("virtual:react-decks/notes")).rejects.toThrow(
      join(app.dir, "slides/01-first.mdx"),
    );
  });
  it.each(["{true && <Notes>Secret</Notes>}", "<div child={<Notes>Secret</Notes>} />"])(
    "rejects Notes inside an expression naming the file: %s",
    async (body) => {
      const app = await serve({ "slides/01-first.mdx": `# Audience\n\n${body}` });
      for (const id of ["virtual:react-decks/notes", "/slides/01-first.mdx"]) {
        await expect(app.server.ssrLoadModule(id)).rejects.toThrow(
          /01-first\.mdx.*Notes.*expression/,
        );
      }
    },
  );
  it("renders each notes segment to HTML with its click and removes notes from compiled slides", async () => {
    const secret = "Speaker secret";
    const app = await serve({
      "slides/01-first.mdx": `# Audience\n\n<Notes>\n**${secret}**\n\n[click] Next\n\n[click:2] Last\n</Notes>`,
      "slides/02-no-notes.mdx": "# No notes",
    });
    const module = await app.server.ssrLoadModule("virtual:react-decks/notes");
    expect(module.notes).toEqual({
      "01-first": [
        { click: 0, html: `<p><strong>${secret}</strong></p>` },
        { click: 1, html: "<p>Next</p>" },
        { click: 3, html: "<p>Last</p>" },
      ],
    });
    const slide = await app.get("/slides/01-first.mdx");
    expect(slide).toContain("Audience");
    expect(slide).not.toContain(secret);
    expect(slide).not.toContain("[click]");
  });
  it("does not treat Notes shown in code as speaker notes", async () => {
    const app = await serve({
      "slides/01-first.mdx": "# Slide\n\n```mdx\n<Notes>example</Notes>\n```",
    });
    expect((await app.server.ssrLoadModule("virtual:react-decks/notes")).notes).toEqual({});
    expect(await app.get("/slides/01-first.mdx")).toContain("example");
  });
  it("uses components passed through props without importing an MDX provider", async () => {
    const app = await serve({
      "render.tsx":
        'import { renderToStaticMarkup } from "react-dom/server"; import Slide from "./slides/01-first.mdx"; export function render() { return renderToStaticMarkup(<Slide components={{ h1: "header" }} />); }',
    });
    const slide = await app.get("/slides/01-first.mdx");
    expect(slide).not.toContain("@mdx-js/react");
    expect((await app.server.ssrLoadModule("/render.tsx")).render()).toBe(
      "<header>First slide</header>",
    );
  });
  it("exports only the component from slides with object-valued frontmatter for Fast Refresh", async () => {
    const app = await serve({ "slides/01-first.mdx": "---\ncustom:\n  colour: blue\n---\n# Body" });
    expect(Object.keys(await app.server.ssrLoadModule("/slides/01-first.mdx"))).toEqual([
      "default",
    ]);
    expect(await app.get(virtual("manifest"))).toContain('"custom":{"colour":"blue"}');
  });
  it("rejects two Notes blocks in both the notes module and compilation", async () => {
    const app = await serve({
      "slides/01-first.mdx": "# Slide\n\n<Notes>One</Notes>\n\n<Notes>Two</Notes>",
    });
    await expect(app.server.ssrLoadModule("virtual:react-decks/notes")).rejects.toThrow(
      /01-first\.mdx.*more than one <Notes>/,
    );
    const response = await fetch(new URL("/slides/01-first.mdx", app.url));
    expect(response.status).toBe(500);
    expect(await response.text()).toContain("more than one \\u003cNotes>");
  });
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
  it("starts and closes dev with no deck index.html written", async () => {
    const { dir } = await fixture();
    const server = await dev(await loadDeck(dir), { port: 0 });
    onTestFinished(() => server.close());
    expect((await fetch(server.url)).status).toBe(200);
    await expect(access(join(dir, "index.html"))).rejects.toThrow();
  });
  it("merges deck Vite options last and runs deck plugins in dev and build", async () => {
    const { dir } = await fixture({
      "deck.config.ts": `export default {title:"Plugin deck", vite: {base:"/configured/",build:{outDir:"wrong"},plugins:[{name:"deck-html",transformIndexHtml(html) {return html.replace("</head>","<meta name='deck-plugin' content='applied'></head>")}}]}}`,
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

describe("dev changes", () => {
  it("reconciles a config save made while the server is starting", async () => {
    const app = await fixture({
      "release.txt": "Waiting",
      "deck.config.ts": `import { watch, writeFileSync } from "node:fs";
export default { title: "Startup title", vite: { plugins: [{ name: "pause-startup",
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
      await vi.waitFor(async () =>
        expect(await readFile(join(app.dir, "startup-started.txt"), "utf8")).toBe("Ready"),
      );
      await app.put("deck.config.ts", 'export default { title: "Saved during startup" };');
    } finally {
      await app.put("release.txt", "Continue");
    }
    const server = await starting;
    onTestFinished(() => server.close());
    await vi.waitFor(async () =>
      expect(await (await fetch(server.url)).text()).toContain(
        "<title>Saved during startup</title>",
      ),
    );
  });
  it("hot-updates the first body edit of a hidden slide without reloading", async () => {
    const app = await serve({ "slides/02-hidden.mdx": "---\nhide: true\n---\n# Hidden before" });
    await app.get(virtual("manifest"));
    await app.get("/slides/02-hidden.mdx");
    const start = app.messages.length;
    await app.put("slides/02-hidden.mdx", "---\nhide: true\n---\n# Hidden after");
    await vi.waitFor(() =>
      expect(app.messages.slice(start).some((message) => message.includes('"type":"update"'))).toBe(
        true,
      ),
    );
    expect(
      app.messages.slice(start).some((message) => message.includes('"type":"full-reload"')),
    ).toBe(false);
    expect(await app.get("/slides/02-hidden.mdx")).toContain("Hidden after");
  });
  it("hot-updates a slide body and notes without a full reload", async () => {
    const app = await serve({ "slides/01-first.mdx": "# Before\n\n<Notes>Old notes</Notes>" });
    await app.get(virtual("entry"));
    await app.get(virtual("manifest"));
    expect(await app.get("/slides/01-first.mdx")).toContain("Before");
    expect(await app.get(virtual("notes"))).toContain("Old notes");
    const start = app.messages.length;
    await app.put("slides/01-first.mdx", "# After\n\n<Notes>New notes</Notes>");
    await vi.waitFor(() =>
      expect(app.messages.slice(start).some((message) => message.includes('"type":"update"'))).toBe(
        true,
      ),
    );
    expect(
      app.messages.slice(start).some((message) => message.includes('"type":"full-reload"')),
    ).toBe(false);
    expect(await app.get("/slides/01-first.mdx")).toContain("After");
    expect(await app.get(virtual("notes"))).toContain("New notes");
  });
  it("reloads the manifest after frontmatter changes", async () => {
    const app = await serve();
    expect(await app.get(virtual("manifest"))).toContain('"clicks":0');
    await app.get("/slides/01-first.mdx");
    const start = app.messages.length;
    await app.put("slides/01-first.mdx", "---\ntitle: Revised\nclicks: 2\n---\n# First slide");
    await vi.waitFor(() =>
      expect(
        app.messages.slice(start).some((message) => message.includes('"type":"full-reload"')),
      ).toBe(true),
    );
    const manifest = await app.get(virtual("manifest"));
    expect(manifest).toContain('"clicks":2');
    expect(manifest).toContain('"title":"Revised"');
  });
  it("hot-updates the body of a newly added slide after the manifest reload", async () => {
    const app = await serve();
    await app.get(virtual("manifest"));
    await app.put("slides/02-new.mdx", "# Added");
    await vi.waitFor(() =>
      expect(app.messages.some((message) => message.includes('"type":"full-reload"'))).toBe(true),
    );
    expect(await app.get(virtual("manifest"))).toContain("02-new");
    expect(await app.get("/slides/02-new.mdx")).toContain("Added");
    const start = app.messages.length;
    await app.put("slides/02-new.mdx", "# Edited");
    await vi.waitFor(() =>
      expect(app.messages.slice(start).some((message) => message.includes('"type":"update"'))).toBe(
        true,
      ),
    );
    expect(
      app.messages.slice(start).some((message) => message.includes('"type":"full-reload"')),
    ).toBe(false);
    expect(await app.get("/slides/02-new.mdx")).toContain("Edited");
  });
  it.each(["add", "remove", "rename"])(
    "reloads and serves a new manifest after slide %s",
    async (action) => {
      const app = await serve({ "slides/02-other.mdx": "# Other" });
      const before = await app.get(virtual("manifest"));
      expect(before).toContain("02-other");
      const start = app.messages.length;
      if (action === "add") await app.put("slides/03-new.mdx", "# New");
      if (action === "remove") await rm(join(app.dir, "slides/02-other.mdx"));
      if (action === "rename")
        await rename(join(app.dir, "slides/02-other.mdx"), join(app.dir, "slides/03-new.mdx"));
      await vi.waitFor(() =>
        expect(
          app.messages.slice(start).some((message) => message.includes('"type":"full-reload"')),
        ).toBe(true),
      );
      const after = await app.get(virtual("manifest"));
      if (action !== "add") expect(after).not.toContain("02-other");
      if (action !== "remove") expect(after).toContain("03-new");
    },
  );
  it.each(["add", "remove"])(
    "reloads and serves new components after component %s",
    async (action) => {
      const app = await serve({ "components/Before.tsx": "export function Before() {}" });
      expect(await app.get(virtual("components"))).toContain("Before.tsx");
      const start = app.messages.length;
      if (action === "add") await app.put("components/After.tsx", "export function After() {}");
      else await rm(join(app.dir, "components/Before.tsx"));
      await vi.waitFor(() =>
        expect(
          app.messages.slice(start).some((message) => message.includes('"type":"full-reload"')),
        ).toBe(true),
      );
      const after = await app.get(virtual("components"));
      if (action === "add") expect(after).toContain("After.tsx");
      else expect(after).not.toContain("Before.tsx");
    },
  );
  it("restarts and serves new HTML and manifest when deck.config.ts changes", async () => {
    const app = await serve();
    expect(await app.get("/")).toContain("Test deck");
    expect(await app.get(virtual("manifest"))).toContain("Test deck");
    await app.put(
      "deck.config.ts",
      'export default {title:"Restarted deck",canvas:{width:800,height:600}}',
    );
    await vi.waitFor(async () => expect(await app.get("/")).toContain("Restarted deck"));
    expect(await app.get(virtual("manifest"))).toContain('"width":800');
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
    await vi.waitFor(async () =>
      expect(await readFile(join(app.dir, "restart-started.txt"), "utf8")).toBe("Ready"),
    );
    await app.put("deck.config.ts", 'export default { title: "Second save" };');
    await app.put("release.txt", "Continue");
    await vi.waitFor(async () =>
      expect(await app.get("/")).toContain("<title>Second save</title>"),
    );
    expect(await app.get(virtual("manifest"))).toContain('"title":"Second save"');
  });
  it("drops removed Vite overrides and replaces deck plugins when config restarts", async () => {
    const { dir, put } = await fixture({
      "deck.config.ts":
        'export default { title:"Before restart", vite:{base:"/old/",plugins:[{name:"old-html",transformIndexHtml(html){return html.replace("</head>","<meta name=old-plugin></head>")}}]} };',
    });
    const server = await dev(await loadDeck(dir), { port: 0 });
    onTestFinished(() => server.close());
    expect(await (await fetch(server.url)).text()).toContain("name=old-plugin");
    await put(
      "deck.config.ts",
      'export default { title:"After restart", vite:{plugins:[{name:"new-html",transformIndexHtml(html){return html.replace("</head>","<meta name=new-plugin></head>")}}]} };',
    );
    const rootUrl = new URL("/", server.url);
    await vi.waitFor(async () => {
      const response = await fetch(rootUrl, { redirect: "manual" });
      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain("After restart");
      expect(html).toContain("name=new-plugin");
      expect(html).not.toContain("name=old-plugin");
    });
  });
});
