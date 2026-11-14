import { describe, expect, it, onTestFinished } from "vitest";
import { fixture as createFixture } from "./deck.test-support";
import { buildManifest, loadDeck, scanSlides } from "./index";

const fixture = (files?: Record<string, string>) => createFixture(onTestFinished, files);

describe("slide scanning and manifest", () => {
  it("sorts filenames as strings, drops hidden slides before numbering and preserves metadata", async () => {
    const { dir } = await fixture({
      "slides/01-first.mdx": "---\nhide: true\n---\ninvalid hidden <",
      "slides/10-b.mdx":
        "---\ntitle: Last\nclicks: 2\ntransition: fade\ncustom:\n  colour: blue\n---\n# B",
      "slides/02-a.mdx": "# A",
      "slides/nested/01-ignored.mdx": "# Ignore",
      "slides/00-ignore.md": "# Ignore",
    });
    const deck = await loadDeck(dir, "ordered");
    const slides = await scanSlides(deck);
    expect(slides).toEqual([
      {
        meta: { no: 1, id: "02-a", file: "slides/02-a.mdx", title: "02-a", clicks: 0 },
        frontmatter: { title: "02-a", clicks: 0, hide: false },
      },
      {
        meta: {
          no: 2,
          id: "10-b",
          file: "slides/10-b.mdx",
          title: "Last",
          clicks: 2,
          transition: "fade",
        },
        frontmatter: {
          title: "Last",
          clicks: 2,
          hide: false,
          transition: "fade",
          custom: { colour: "blue" },
        },
      },
    ]);
    expect(buildManifest(deck, slides)).toEqual({
      name: "ordered",
      title: deck.config.title,
      canvas: deck.config.canvas,
      slides: slides.map(({ meta }) => meta),
    });
  });
  it.each([
    "clicks: -1",
    "clicks: 0.5",
    "clicks: nope",
    "clicks: null",
    "title: 3",
    "title: null",
    "hide: 1",
    "hide: null",
    "transition: false",
    "transition: null",
  ])("rejects %s naming file and key", async (value) => {
    const { dir } = await fixture({ "slides/01-first.mdx": `---\n${value}\n---\n# Invalid` });
    await expect(scanSlides(await loadDeck(dir))).rejects.toThrow(
      new RegExp(`01-first\\.mdx:[\\s\\S]*${value.split(":")[0]}`),
    );
  });
  it("rejects a deck with no visible slide", async () => {
    const { dir } = await fixture({ "slides/01-first.mdx": "---\nhide: true\n---\n# Hidden" });
    const deck = await loadDeck(dir);
    await expect(scanSlides(deck)).rejects.toThrow("no visible slides");
    expect(() => buildManifest(deck, [])).toThrow("no visible slides");
  });
  it("numbers the five visible basic fixture slides from 1 to 5", async () => {
    const slides = await scanSlides(await loadDeck("examples/basic"));
    expect(slides.map(({ meta }) => meta.no)).toEqual([1, 2, 3, 4, 5]);
    expect(slides.map(({ meta }) => meta.id)).toEqual([
      "01-cover",
      "02-steps",
      "03-component",
      "05-one-click",
      "06-end",
    ]);
  });
});
