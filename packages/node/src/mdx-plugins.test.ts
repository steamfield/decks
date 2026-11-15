import { writeFileSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { createLogger, createServer } from "vite";
import { expect, it, onTestFinished, vi } from "vitest";
import { fixture, testVite } from "./deck.test-support";
import { build, loadDeck, reactDecks } from "./index";

const mathConfig = `import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
export default { title: "Math deck", mdx: {
  remarkPlugins: [remarkMath], rehypePlugins: [[rehypeKatex, { output: "htmlAndMathml" }]]
} };`;
const mathSlide = "# Math.\n\nInline $a^2+b^2=c^2$.\n\n$$\ne^{i\\pi}+1=0\n$$";
const manifest = "/@id/__x00__virtual:react-decks/manifest";

async function serve(files: Record<string, string> = {}) {
  const deck = await fixture(onTestFinished, files);
  const errors: string[] = [];
  const logger = createLogger("silent");
  logger.error = (message) => errors.push(message);
  const server = await createServer({
    configFile: false,
    plugins: reactDecks(await loadDeck(deck.dir)),
    ...testVite,
    server: { port: 0 },
    customLogger: logger,
  });
  onTestFinished(() => server.close());
  await server.listen();
  const url = server.resolvedUrls?.local[0];
  if (!url) throw new Error("No Vite URL");
  const get = async (path: string) => {
    const response = await fetch(new URL(path, url));
    const body = await response.text();
    expect(response.status, body.slice(0, 1500)).toBe(200);
    return body;
  };
  await vi.waitFor(
    () => expect(server.watcher.getWatched()[deck.dir]).toContain("deck.config.ts"),
    {
      timeout: 10_000,
    },
  );
  return { ...deck, server, url, get, errors };
}

async function builtCode(dir: string) {
  const outDir = join(dir, "site");
  await build(await loadDeck(dir), { outDir });
  const assets = join(outDir, "assets");
  const files = (await readdir(assets)).filter((file) => file.endsWith(".js"));
  return (await Promise.all(files.map((file) => readFile(join(assets, file), "utf8")))).join("\n");
}

it("compiles inline and display math through deck plugins in dev and build", async () => {
  const app = await serve({ "deck.config.ts": mathConfig, "slides/01-first.mdx": mathSlide });
  for (const code of [await app.get("/slides/01-first.mdx"), await builtCode(app.dir)]) {
    expect(code).toContain("katex-display");
    expect(code).toContain("katex-mathml");
    expect(code).toContain("katex-html");
  }
});

it("keeps the existing compiler when mdx is absent in dev and build", async () => {
  const app = await serve({
    "slides/01-first.mdx":
      '---\ntitle: Metadata only\n---\n# Audience.\n\n```ts\nconst word = "hello";\n```\n\n<Notes>Speaker secret</Notes>',
  });
  for (const code of [await app.get("/slides/01-first.mdx"), await builtCode(app.dir)]) {
    expect(code).toContain("Audience.");
    expect(code).toContain("var(--shiki-token-keyword)");
    expect(code).not.toContain("katex-display");
  }
});

it.each([
  ["mdx", '"x"'],
  ["mdx", "null"],
  ["mdx", "[]"],
  ["mdx.remarkPlugins", '{ remarkPlugins: "x" }'],
  ["mdx.rehypePlugins", '{ rehypePlugins: "x" }'],
  ["mdx.remarkPlugins", "{ remarkPlugins: null }"],
  ["mdx.rehypePlugins", "{ rehypePlugins: {} }"],
])("rejects invalid %s before starting a compiler: %s", async (key, value) => {
  const { dir } = await fixture(onTestFinished, {
    "deck.config.ts": `export default { title: "Invalid", mdx: ${value} };`,
  });
  await expect(loadDeck(dir)).rejects.toThrow(key);
});

it("runs remark plugins after notes removal without counting generated steps in dev or build", async () => {
  const app = await serve({
    "deck.config.ts": `function extend(options) {
  return tree => {
    if (tree.children.some(node => node.name === "Notes"))
      throw new Error("Framework remark plugins must run first");
    const generated = structuredClone(tree.children.find(node => node.name === "Step"));
    const at = generated.attributes[0].value;
    at.value = "9";
    at.data.estree.body[0].expression.value = 9;
    at.data.estree.body[0].expression.raw = "9";
    generated.children = [{ type: "text", value: options.text }];
    tree.children.push(generated);
  };
}
export default { title: "Remark deck", mdx: { remarkPlugins: [[extend, { text: "Generated step" }]] } };`,
    "slides/01-first.mdx":
      "---\ntitle: Steps\n---\n<Step at={2}>Authored step</Step>\n\n<Notes>Speaker secret</Notes>",
  });
  expect(await app.get(manifest)).toContain('"clicks":2');
  const built = await builtCode(app.dir);
  for (const code of [await app.get("/slides/01-first.mdx"), built]) {
    expect(code).toContain("Generated step");
    expect(code).toMatch(/at:\s*9/);
  }
  expect(built).toMatch(/clicks:\s*2/);
});

it("applies rehype plugins and code highlighting while preserving tuple options in dev and build", async () => {
  const app = await serve({
    "deck.config.ts": `function decorate(options) {
  return tree => {
    tree.children.push({ type: "element", tagName: "p", properties: {},
      children: [{ type: "text", value: options.marker }] });
  };
}
export default { title: "Rehype deck", mdx: { rehypePlugins: [[decorate, { marker: "Deck decoration" }]] } };`,
    "slides/01-first.mdx": '```ts\nconst word = "hello";\n```',
  });
  for (const code of [await app.get("/slides/01-first.mdx"), await builtCode(app.dir)]) {
    expect(code).toContain("var(--shiki-token-keyword)");
    expect(code).toContain("Deck decoration");
  }
});

it("accepts empty plugin arrays in dev and build", async () => {
  const app = await serve({
    "deck.config.ts":
      'export default { title: "Empty extensions", mdx: { remarkPlugins: [], rehypePlugins: [] } };',
  });
  expect(await app.get("/slides/01-first.mdx")).toContain("First slide");
  expect(await builtCode(app.dir)).toContain("First slide");
});

it("reports a throwing plugin on its slide while neighbours still compile", async () => {
  const app = await serve({
    "deck.config.ts": `function broken() {
  return (tree, file) => { if (file.basename === "02-broken.mdx") throw new Error("Extension failed"); };
}
export default { title: "Partial failure", mdx: { remarkPlugins: [broken] } };`,
    "slides/02-broken.mdx": "# Broken.",
    "slides/03-good.mdx": "# Neighbour.",
  });
  expect(await app.get(manifest)).toContain("03-good");
  const response = await fetch(new URL("/slides/02-broken.mdx", app.url));
  expect(response.status).toBe(500);
  expect(await response.text()).toContain("Extension failed");
  expect(app.errors.join("\n")).toContain("02-broken.mdx");
  expect(await app.get("/slides/01-first.mdx")).toContain("First slide");
  expect(await app.get("/slides/03-good.mdx")).toContain("Neighbour.");
  await expect(builtCode(app.dir)).rejects.toThrow(/02-broken\.mdx/);
});

it("adds and removes MDX plugins when the running server's config changes", async () => {
  const app = await serve({ "slides/01-first.mdx": "# Math.\n\n$$\na^2+b^2=c^2\n$$" });
  expect(await app.get("/slides/01-first.mdx")).not.toContain("katex-display");
  await app.put("deck.config.ts", mathConfig);
  await vi.waitFor(
    async () => {
      expect(await app.get("/")).toContain("Math deck");
      expect(await app.get("/slides/01-first.mdx")).toContain("katex-display");
    },
    { timeout: 10_000 },
  );
  await app.put("deck.config.ts", 'export default { title: "Plain again" };');
  await vi.waitFor(
    async () => {
      expect(await app.get("/")).toContain("Plain again");
      expect(await app.get("/slides/01-first.mdx")).not.toContain("katex-display");
    },
    { timeout: 10_000 },
  );
  expect(app.errors).toEqual([]);
}, 20_000);

it("counts authored steps alongside math syntax without running plugin transforms", async () => {
  const app = await serve({
    "deck.config.ts": mathConfig,
    "slides/01-first.mdx": `${mathSlide}\n\n<Step at={2}>Second beat</Step>\n\n<Notes>Speaker note</Notes>`,
  });
  expect(await app.get(manifest)).toContain('"clicks":2');
  expect(await app.get("/@id/__x00__virtual:react-decks/notes")).toContain("Speaker note");
  expect(await builtCode(app.dir)).toMatch(/clicks:\s*2/);
  await app.put("slides/01-first.mdx", `${mathSlide}\n\n<Step at={3}>Third beat</Step>`);
  await vi.waitFor(async () => expect(await app.get(manifest)).toContain('"clicks":3'), {
    timeout: 10_000,
  });
});

it("retries a failed config load if its source changed during loading", async () => {
  const app = await serve();
  await app.put(
    "deck.config.ts",
    `import { writeFileSync } from "node:fs";
writeFileSync(new URL("./deck.config.ts", import.meta.url), 'export default { title: "Completed retry" };');
throw new Error("Save in progress");
export default { title: "Incomplete" };`,
  );
  await vi.waitFor(async () => expect(await app.get("/")).toContain("Completed retry"), {
    timeout: 10_000,
  });
  expect(app.errors).toEqual([]);
});

it("serves a completed config save without reporting the temporary empty file", async () => {
  const app = await serve();
  expect(await app.get("/")).toContain("Test deck");
  // Model an editor's truncate/write, with the write after the watcher saw truncation.
  const completed = new Promise<void>((resolve, reject) => {
    app.server.watcher.once("change", () => {
      try {
        writeFileSync(
          join(app.dir, "deck.config.ts"),
          'export default { title: "Completed save" };',
        );
        resolve();
      } catch (cause) {
        reject(cause);
      }
    });
  });
  await app.put("deck.config.ts", "");
  await completed;
  await vi.waitFor(async () => expect(await app.get("/")).toContain("Completed save"), {
    timeout: 10_000,
  });
  expect(app.errors).toEqual([]);
});
