import { symlink } from "node:fs/promises";
import { basename, join, relative } from "node:path";
import { describe, expect, it, onTestFinished } from "vitest";
import { build, defineDeck, dev, loadDeck } from "../index";
import { DeckError } from "./errors";
import { fixture as createFixture } from "./server.test-support";

const fixture = (files?: Record<string, string>) => createFixture(onTestFinished, files);

describe("loadDeck", () => {
  it("resolves terminal directories relative to the deck", async () => {
    const { dir } = await fixture({
      "deck.config.ts": 'export default { title: "Deck", term: { dirs: { repo: "slides" } } };',
    });
    expect((await loadDeck(dir)).config.term).toEqual({ dirs: { repo: join(dir, "slides") } });
  });
  it.each(["missing", "deck.config.ts"])(
    "checks terminal directory %s only when live terminal serving is requested",
    async (path) => {
      const { dir } = await fixture({
        "deck.config.ts": `export default { title: "Deck", term: { dirs: { demo: ${JSON.stringify(path)} } } };`,
      });
      const deck = await loadDeck(dir);
      expect(deck.config.term?.dirs).toEqual({ demo: join(dir, path) });
      const server = await dev(deck, { port: 0 });
      onTestFinished(() => server.close());
      expect((await fetch(server.url)).status).toBe(200);
      await expect(dev(deck, { port: 0, liveTerm: true })).rejects.toBeInstanceOf(DeckError);
      await expect(dev(deck, { port: 0, liveTerm: true })).rejects.toThrow(
        `term.dirs key "demo" points at "${relative(process.cwd(), join(dir, path))}", which is not a directory.`,
      );
    },
  );
  it("builds a recording-only deck without the speaker's terminal directory", async () => {
    const { dir } = await fixture({
      "deck.config.ts":
        'export default { title: "Deck", term: { dirs: { demo: "speaker-only" } } };',
    });
    await build(await loadDeck(dir), { outDir: join(dir, "site"), ogImage: false });
  });
  it("reports a terminal directory inspection failure as a config error naming the key and path", async () => {
    const { dir } = await fixture({
      "deck.config.ts": 'export default { title: "Deck", term: { dirs: { demo: "loop" } } };',
    });
    await symlink("loop", join(dir, "loop"));
    const starting = async () => dev(await loadDeck(dir), { port: 0, liveTerm: true });
    await expect(starting()).rejects.toBeInstanceOf(DeckError);
    await expect(starting()).rejects.toThrow(
      `cannot inspect term.dirs key "demo" at "${relative(process.cwd(), join(dir, "loop"))}"`,
    );
  });
  it.each(["{ dirs: { repo: 3 } }", "{ unknown: {} }"])(
    "rejects invalid terminal config %s",
    async (term) => {
      const { dir } = await fixture({
        "deck.config.ts": `export default { title: "Deck", term: ${term} };`,
      });
      await expect(loadDeck(dir)).rejects.toThrow(/deck\.config\.ts:[\s\S]*term/);
    },
  );
  it("rereads edited config and imported settings without a cache", async () => {
    const { dir, put } = await fixture({
      "title.ts": 'export const title = "Before";',
      "deck.config.ts": 'import { title } from "./title"; export default { title };',
    });
    expect((await loadDeck(dir)).config.title).toBe("Before");
    await put("title.ts", 'export const title = "After";');
    expect((await loadDeck(dir)).config.title).toBe("After");
    await put("deck.config.ts", 'export default { title: "Last" };');
    expect((await loadDeck(dir)).config.title).toBe("Last");
  });
  it.each(['bad"name', "bad name", "bad=key", "bad>key"])(
    "rejects htmlAttrs key %s by name",
    async (key) => {
      const { dir } = await fixture({
        "deck.config.ts": `export default ${JSON.stringify({ title: "Deck", htmlAttrs: { [key]: "value" } })}`,
      });
      await expect(loadDeck(dir)).rejects.toThrow(key);
    },
  );
  it("loads defineDeck config and preserves all supported settings", async () => {
    const input = {
      title: "A title",
      author: "Author",
      info: "Info",
      canvas: { width: 800, height: 600 },
      transition: "fade",
      htmlAttrs: { lang: "en" },
      vite: { base: "/talk/" },
    };
    expect(defineDeck(input)).toBe(input);
    const { dir } = await fixture({
      "deck.config.ts": `import { defineDeck } from '@react-decks/node'; export default defineDeck(${JSON.stringify(input)})`,
    });
    expect(await loadDeck(dir, "talk")).toEqual({
      name: "talk",
      dir,
      config: { ...input, credit: true },
    });
  });
  it("defaults canvas and uses the directory basename as the name", async () => {
    const { dir } = await fixture();
    expect(await loadDeck(dir)).toMatchObject({
      name: basename(dir),
      config: { title: "Test deck", canvas: { width: 1920, height: 1080 } },
    });
  });
  it.each([
    ["unknown", '{title:"Deck", unknown: true}'],
    ["title", "{title: 42}"],
    ["author", '{title:"Deck", author: false}'],
    ["info", '{title:"Deck", info: 1}'],
    ["width", '{title:"Deck", canvas:{width:0,height:10}}'],
    ["height", '{title:"Deck", canvas:{width:10,height:Infinity}}'],
    ["transition", '{title:"Deck", transition: 4}'],
    ["transition", '{title:"Deck", transition: ""}'],
    ["htmlAttrs", '{title:"Deck", htmlAttrs:{lang:1}}'],
    ["vite", '{title:"Deck", vite: 1}'],
  ])("rejects invalid %s naming the config file and key", async (key, value) => {
    const { dir } = await fixture({ "deck.config.ts": `export default ${value}` });
    await expect(loadDeck(dir)).rejects.toThrow(new RegExp(`deck\\.config\\.ts:[\\s\\S]*${key}`));
  });
  it("names the missing config file", async () => {
    const { dir } = await fixture();
    await expect(loadDeck(join(dir, "missing"))).rejects.toThrow(
      `no deck.config.ts in .tmp/${basename(dir)}/missing.`,
    );
  });
});
