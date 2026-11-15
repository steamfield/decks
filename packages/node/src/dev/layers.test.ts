import { rm } from "node:fs/promises";
import { join } from "node:path";
import { createServer } from "vite";
import { expect, it, onTestFinished, vi } from "vitest";
import { loadDeck, reactDecks, scanSlides } from "../index";
import { fixture, testVite } from "./server.test-support";

async function serve(files: Record<string, string> = {}) {
  const deck = await fixture(onTestFinished, files);
  const server = await createServer({
    configFile: false,
    plugins: reactDecks(await loadDeck(deck.dir)),
    server: { port: 0 },
    logLevel: "silent",
  });
  onTestFinished(() => server.close());
  await server.listen();
  const url = server.resolvedUrls?.local[0];
  if (!url) throw new Error("Missing Vite URL");
  await vi.waitFor(
    () => expect(server.watcher.getWatched()[join(deck.dir, "slides")]).toContain("01-first.mdx"),
    { timeout: 10_000 },
  );
  const get = async (name: string) => {
    const response = await fetch(new URL(`/@id/__x00__virtual:react-decks/${name}`, url));
    const text = await response.text();
    expect(response.status, text).toBe(200);
    return text;
  };
  return { ...deck, server, get };
}

it("serves absent layers and each default layer export through the virtual module", async () => {
  const app = await serve();
  expect((await app.server.ssrLoadModule("virtual:react-decks/layers")).layers).toEqual({});
  const both = await serve({
    "layers/above.tsx": 'export default function Above() { return "Above"; }',
    "layers/below.tsx": 'export default function Below() { return "Below"; }',
  });
  const { layers } = await both.server.ssrLoadModule("virtual:react-decks/layers");
  expect(layers.above()).toBe("Above");
  expect(layers.below()).toBe("Below");
});

it("serves the deck's own credit, and false when the config turns the credit off", async () => {
  const own = await serve({
    "layers/credit.tsx": 'export default function Credit() { return "Mine"; }',
  });
  expect((await own.server.ssrLoadModule("virtual:react-decks/layers")).layers.credit()).toBe(
    "Mine",
  );
  const off = await serve({
    "deck.config.ts": `export default ${JSON.stringify({ title: "Fixture", credit: false, vite: testVite })};`,
    "layers/credit.tsx": 'export default function Credit() { return "Mine"; }',
  });
  expect((await off.server.ssrLoadModule("virtual:react-decks/layers")).layers).toEqual({
    credit: false,
  });
});

it("rejects a credit option that is not true or false, naming it", async () => {
  const { dir } = await fixture(onTestFinished, {
    "deck.config.ts": 'export default { title: "Fixture", credit: "none" };',
  });
  await expect(loadDeck(dir)).rejects.toThrow(/credit/);
});

it.each(["extra.tsx", "nested/above.tsx"])(
  "rejects unexpected layer file %s naming it",
  async (name) => {
    const app = await serve({ [`layers/${name}`]: "export default function Extra() {}" });
    const response = await fetch(
      new URL("/@id/__x00__virtual:react-decks/manifest", app.server.resolvedUrls?.local[0]),
    );
    expect(response.status).toBe(500);
    expect(await response.text()).toContain(`layers/${name}`);
  },
);

it("ignores dotfiles and non-TSX files in layers", async () => {
  const app = await serve({
    "layers/.DS_Store": "Finder",
    "layers/.hidden": "Editor",
    "layers/.above.tsx.swp": "Editor",
    "layers/readme.txt": "Notes",
    "layers/.hidden.tsx": "Not a layer",
  });
  expect(await app.get("layers")).toContain("export const layers = {}");
});

it.each(["true", "both", "3", "[above]", "null"])(
  "rejects layers: %s frontmatter naming the file and key",
  async (value) => {
    const { dir } = await fixture(onTestFinished, {
      "slides/01-first.mdx": `---\nlayers: ${value}\n---\n# Slide`,
    });
    await expect(scanSlides(await loadDeck(dir))).rejects.toThrow(
      /slides\/01-first\.mdx:[\s\S]*layers/,
    );
  },
);

it("counts motion children inside an overridden layout normally", async () => {
  const app = await serve({
    "components/Center.tsx": "export default function Center() { return null; }",
    "slides/01-first.mdx": "<Center><Step at={1}>A beat</Step></Center>",
  });
  expect((await scanSlides(await loadDeck(app.dir)))[0]?.meta.clicks).toBe(1);
});

it("adds edits and removes a layer without restarting the dev server", async () => {
  const app = await serve();
  await app.get("layers");
  await app.put("layers/below.tsx", 'export default function Below() { return "Added"; }');
  await vi.waitFor(async () => expect(await app.get("layers")).toContain("below.tsx"), {
    timeout: 10_000,
  });
  const layer = async () =>
    (await fetch(new URL("/layers/below.tsx", app.server.resolvedUrls?.local[0]))).text();
  expect(await layer()).toContain("Added");
  await app.put("layers/below.tsx", 'export default function Below() { return "Edited"; }');
  await vi.waitFor(async () => expect(await layer()).toContain("Edited"), { timeout: 10_000 });
  await rm(join(app.dir, "layers/below.tsx"));
  await vi.waitFor(async () => expect(await app.get("layers")).not.toContain("below.tsx"), {
    timeout: 10_000,
  });
});
