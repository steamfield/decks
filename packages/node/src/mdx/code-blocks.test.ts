import { describe, expect, it } from "vitest";
import { renderSlide, serve as serveDeck } from "../dev/server.test-support";
import { parseCodeOptions } from "./code-options";

const serve = (source: string) => serveDeck({ "slides/01-first.mdx": source });

const render = (app: Awaited<ReturnType<typeof serve>>) =>
  renderSlide(app.server, "/slides/01-first.mdx");

describe("compiled code blocks", () => {
  it.each(["{1|2|all}", "linez"])(
    "ignores code options and motion steps inside speaker notes: %s",
    async (meta) => {
      const app = await serve(`# Audience.

<Notes>

\`\`\`ts ${meta}
const first = 1;
const second = 2;
\`\`\`

<Step at={9}>Speaker only</Step>

</Notes>`);
      expect(
        (await app.server.ssrLoadModule("virtual:react-decks/manifest")).manifest.slides[0].clicks,
      ).toBe(0);
      const slide = await render(app);
      expect(slide.text).toContain("Audience.");
      expect(slide.text).not.toContain("Speaker only");
      expect(slide.props).not.toContain("data-line");
    },
  );
  it.each(["{2|4-5|all}", "{none|1,3} at=2", "lines", "at=9"])(
    "compiles highlighted lines and counts the same parsed steps for %s",
    async (meta) => {
      const source =
        'const name = "Ada";\nconst count = 1;\n\nconsole.log(name);\nexport { count };';
      const app = await serve(`\`\`\`ts ${meta} title="store.ts" maxHeight=420\n${source}\n\`\`\``);
      const slide = await render(app);
      expect(slide.styles).toContain("var(--shiki-token-keyword)");
      expect(slide.styles).toMatch(/var\(--shiki-token-string(?:-expression)?\)/);
      expect(slide.elements("span").map((line) => line.props["data-line"])).toEqual(
        expect.arrayContaining(["1", "2", "3", "4", "5"]),
      );
      const [pre] = slide.elements("pre");
      expect(pre?.props).toMatchObject({ "data-title": "store.ts", "data-max-height": "420" });
      const options = parseCodeOptions(meta, 5, "test.mdx");
      const module = await app.server.ssrLoadModule("virtual:react-decks/manifest");
      expect(module.manifest.slides[0].clicks).toBe(
        options.steps ? options.at + options.steps.length - 1 : 0,
      );
      const steps = pre?.props["data-steps"];
      if (options.steps) expect(JSON.parse(String(steps))).toEqual(options.steps);
      else expect(steps).toBeUndefined();
    },
  );

  it("reports an option's file even when explicit clicks bypass counting", async () => {
    const app = await serve("---\nclicks: 0\n---\n```ts linez\nconst n = 1;\n```");
    await expect(app.server.transformRequest("/slides/01-first.mdx")).rejects.toThrow(
      /01-first\.mdx.*linez/,
    );
  });

  it("compiles language-free blocks as plain numbered lines and leaves inline code alone", async () => {
    const app = await serve("`const inline = true`\n\n```\nconst plain = true;\n```");
    const slide = await render(app);
    expect(slide.elements("span").map((line) => line.props["data-line"])).toContain("1");
    expect(slide.text).toContain("const inline = true");
    expect(slide.styles).not.toContain("var(--shiki-token-keyword)");
  });
});
