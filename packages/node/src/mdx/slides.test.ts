import { describe, expect, it, onTestFinished } from "vitest";
import { fixture as createFixture } from "../dev/server.test-support";
import { buildManifest, loadDeck, scanSlides } from "../index";

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
        frontmatter: { title: "02-a", hide: false },
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
    'transition: ""',
    "morphSteps: 1",
    "morphSteps: null",
  ])("rejects %s naming file and key", async (value) => {
    const { dir } = await fixture({ "slides/01-first.mdx": `---\n${value}\n---\n# Invalid` });
    await expect(scanSlides(await loadDeck(dir))).rejects.toThrow(
      new RegExp(`01-first\\.mdx:[\\s\\S]*${value.split(":")[0]}`),
    );
  });
  it("rejects a deck with no visible slide", async () => {
    const { dir } = await fixture({ "slides/01-first.mdx": "---\nhide: true\n---\n# Hidden" });
    const deck = await loadDeck(dir);
    await expect(scanSlides(deck)).rejects.toThrow("has hide: true.");
    expect(() => buildManifest(deck, [])).toThrow("no slides/*.mdx files");
  });
  it.each([true, false])(
    "preserves morphSteps %s and the deck default transition",
    async (morphSteps) => {
      const { dir } = await fixture({
        "deck.config.ts": 'export default { title: "Transitions", transition: "slide" };',
        "slides/01-first.mdx": `---\nmorphSteps: ${morphSteps}\ntransition: fade\n---\n# Slide`,
      });
      const deck = await loadDeck(dir);
      const slides = await scanSlides(deck);
      expect(slides[0]?.frontmatter).toMatchObject({ morphSteps, transition: "fade" });
      expect(buildManifest(deck, slides)).toMatchObject({
        transition: "slide",
        slides: [{ clicks: 0, transition: "fade", morphSteps }],
      });
    },
  );
  it("numbers visible slides consecutively when a hidden slide sits between them", async () => {
    const { dir } = await fixture({
      "slides/01-first.mdx": "# Cover",
      "slides/02-hidden.mdx": "---\nhide: true\n---\n# Hidden",
      "slides/03-body.mdx": "# Body",
      "slides/04-end.mdx": "# End",
    });
    const slides = await scanSlides(await loadDeck(dir));
    expect(slides.map(({ meta }) => [meta.no, meta.id])).toEqual([
      [1, "01-first"],
      [2, "03-body"],
      [3, "04-end"],
    ]);
  });
});
