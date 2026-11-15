import { describe, expect, it } from "vitest";
import { serve as serveDeck } from "../dev/server.test-support";
import { parseCodeOptions } from "./code-options";

const serve = (source: string) => serveDeck({ "slides/01-first.mdx": source });

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
      const compiled = await app.server.transformRequest("/slides/01-first.mdx");
      expect(compiled?.code).toContain("Audience.");
      expect(compiled?.code).not.toContain("Speaker only");
      expect(compiled?.code).not.toContain("data-line");
    },
  );
  it.each(["{2|4-5|all}", "{none|1,3} at=2", "lines", "at=9"])(
    "compiles highlighted lines and counts the same parsed steps for %s",
    async (meta) => {
      const source =
        'const name = "Ada";\nconst count = 1;\n\nconsole.log(name);\nexport { count };';
      const app = await serve(`\`\`\`ts ${meta} title="store.ts" maxHeight=420\n${source}\n\`\`\``);
      const compiled = await app.server.transformRequest("/slides/01-first.mdx");
      expect(compiled?.code).toContain("var(--shiki-token-keyword)");
      expect(compiled?.code).toMatch(/var\(--shiki-token-string(?:-expression)?\)/);
      for (let line = 1; line <= 5; line++)
        expect(compiled?.code).toContain(`"data-line": "${line}"`);
      expect(compiled?.code).toContain('"data-title": "store.ts"');
      expect(compiled?.code).toContain('"data-max-height": "420"');
      const options = parseCodeOptions(meta, 5, "test.mdx");
      const module = await app.server.ssrLoadModule("virtual:react-decks/manifest");
      expect(module.manifest.slides[0].clicks).toBe(
        options.steps ? options.at + options.steps.length - 1 : 0,
      );
      if (options.steps)
        expect(compiled?.code).toContain(JSON.stringify(JSON.stringify(options.steps)));
      else expect(compiled?.code).not.toContain('"data-steps"');
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
    const compiled = await app.server.transformRequest("/slides/01-first.mdx");
    expect(compiled?.code).toContain('"data-line": "1"');
    expect(compiled?.code).toContain("const inline = true");
    expect(compiled?.code).not.toContain("var(--shiki-token-keyword)");
  });
});
