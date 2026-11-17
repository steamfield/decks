import { describe, expect, it } from "vitest";
import { DeckError } from "../dev/errors";
import { renderSlide, serve } from "../dev/server.test-support";
import { countClicks } from "./clicks";

const fence = (
  meta = '"store.ts" {at: 1, lines: true}',
  inner = "```ts {1}\nconst first = 1;\n```\n\nIgnored text.\n\n```ts {1|2|all} {lines: false}\nconst second = 2;\nconsole.log(second);\n```\n\n```ts\nconst third = 3;\n```",
) => `\`\`\`\`md magic-move ${meta}\n${inner}\n\`\`\`\``;

describe("compiled magic-move fences", () => {
  it("compiles three keyed code steps with ranges, title, line options and five clicks", async () => {
    const source = fence();
    const app = await serve({ "slides/01-first.mdx": source });
    const slide = await renderSlide(app.server, "/slides/01-first.mdx", { MagicMove: "MagicMove" });
    const moves = slide.elements("MagicMove");
    expect(moves).toHaveLength(1);
    const props = moves[0]?.props;
    expect(props).toMatchObject({ at: "1", title: "store.ts" });
    expect(JSON.parse(String(props?.ranges))).toEqual([[[1]], [[1], [2], "all"], []]);
    const steps = JSON.parse(String(props?.steps));
    expect(steps).toHaveLength(3);
    expect(
      steps.map((step: { code: string; lineNumbers: boolean }) => [step.code, step.lineNumbers]),
    ).toEqual([
      ["const first = 1;", true],
      ["const second = 2;\nconsole.log(second);", false],
      ["const third = 3;", true],
    ]);
    expect(steps[0].tokens).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          content: "const",
          key: expect.any(String),
          color: "var(--shiki-token-keyword)",
        }),
      ]),
    );
    expect(
      (await app.server.ssrLoadModule("virtual:react-decks/manifest")).manifest.slides[0].clicks,
    ).toBe(5);
    expect(slide.elements("pre")).toHaveLength(0);
  });

  it.each(["md", "markdown"])(
    "defaults to click zero without line numbers and accepts longer %s fences",
    async (lang) => {
      const app = await serve({
        "slides/01-first.mdx": fence("", "```\nplain\n```")
          .replaceAll("````", "`````")
          .replace("md magic-move", `${lang} magic-move`),
      });
      const slide = await renderSlide(app.server, "/slides/01-first.mdx", {
        MagicMove: "MagicMove",
      });
      const props = slide.elements("MagicMove")[0]?.props;
      expect(props?.at).toBe("0");
      expect(JSON.parse(String(props?.steps))[0]).toMatchObject({
        code: "plain",
        lineNumbers: false,
      });
    },
  );

  it.each(['"store.ts"', "[store.ts]"])(
    "accepts the title %s inside an MDX container",
    async (title) => {
      const app = await serve({ "slides/01-first.mdx": `<div>\n\n${fence(title)}\n\n</div>` });
      const slide = await renderSlide(app.server, "/slides/01-first.mdx", {
        MagicMove: "MagicMove",
      });
      expect(slide.elements("MagicMove")).toHaveLength(1);
      expect(slide.elements("MagicMove")[0]?.props.title).toBe("store.ts");
    },
  );

  it.each([
    ["no inner fence", fence("", "Only text."), 1],
    ["unknown outer option", fence("{speed: 2}"), 1],
    ["unknown inner option", fence("", "```ts {speed: 2}\nconst n = 1;\n```"), 2],
    ["range past its step", fence("", "```ts {2}\nconst n = 1;\n```"), 2],
  ])(
    "rejects %s with the slide file and line even with explicit clicks",
    async (_name, source, line) => {
      expect(() => countClicks(source, "/slides/01-first.mdx")).toThrow(DeckError);
      expect(() => countClicks(source, "/slides/01-first.mdx")).toThrow(`01-first.mdx:${line}:1`);
      const app = await serve({ "slides/01-first.mdx": `---\nclicks: 0\n---\n${source}` });
      await expect(app.server.transformRequest("/slides/01-first.mdx")).rejects.toThrow(
        new RegExp(`01-first\\.mdx:${line + 3}:1`),
      );
    },
  );

  it("keeps a plain md fence as an ordinary code block", async () => {
    const app = await serve({ "slides/01-first.mdx": "```md\n# Ordinary markdown\n```" });
    const slide = await renderSlide(app.server, "/slides/01-first.mdx");
    expect(slide.elements("pre")).toHaveLength(1);
    expect(slide.text).toContain("# Ordinary markdown");
    expect(slide.elements("MagicMove")).toHaveLength(0);
  });
});
