import { join } from "node:path";
import { describe, expect, it, onTestFinished } from "vitest";
import { fixture as createFixture } from "./deck.test-support";
import { defineDeck, loadDeck } from "./index";

const fixture = (files?: Record<string, string>) => createFixture(onTestFinished, files);

describe("loadDeck", () => {
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
    expect(await loadDeck(dir, "talk")).toEqual({ name: "talk", dir, config: input });
  });
  it("defaults canvas and uses the directory basename as the name", async () => {
    const { dir } = await fixture();
    expect(await loadDeck(dir)).toMatchObject({
      name: dir.split("/").at(-1),
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
      `no deck.config.ts in .tmp/${dir.split("/").at(-1)}/missing.`,
    );
  });
});
