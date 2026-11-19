// @vitest-environment node
import { createSatteriMarkdownProcessor, satteriHeadingIdsPlugin } from "@astrojs/markdown-satteri";
import { describe, expect, it } from "vitest";
import { docsHastPlugins, docsShikiTransformers } from "./markdown";

async function render(markdown: string) {
  const processor = await createSatteriMarkdownProcessor({
    hastPlugins: [satteriHeadingIdsPlugin(), ...docsHastPlugins],
    syntaxHighlight: "shiki",
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
      transformers: docsShikiTransformers,
    },
  });
  return processor.render(markdown);
}

const FENCE = [
  '```text transcript="agent-hero/check"',
  "> Check every slide.",
  "Bash decks inspect agent-hero",
  "  slide 6: clipped at the bottom",
  "Done. The close was clipped.",
  "```",
  "",
].join("\n");

describe("a transcript fence", () => {
  it("renders the prompt, the tool call, its output and the reply as terminal lines", async () => {
    const { code } = await render(FENCE);
    expect(code).toMatch(
      /<figure class="transcript-fence not-prose" data-transcript="agent-hero\/check">/,
    );
    expect(code).toMatch(
      /<p data-line="prompt"><span aria-hidden="true">❯ <\/span>Check every slide\.<\/p>/,
    );
    expect(code).toMatch(
      /<p data-line="call"><span aria-hidden="true">● <\/span>Bash decks inspect agent-hero<\/p>/,
    );
    expect(code).toMatch(
      /<p data-line="output"><span aria-hidden="true">\s+⎿ <\/span>slide 6: clipped at the bottom<\/p>/,
    );
    expect(code).toMatch(
      /<p data-line="reply"><strong>Done\.<\/strong> The close was clipped\.<\/p>/,
    );
  });

  it("replaces the code frame and leaves ordinary fences framed", async () => {
    const { code } = await render(`${FENCE}\n\`\`\`text\nplain\n\`\`\`\n`);
    expect(code.match(/<figure data-code-block="">/g)).toHaveLength(1);
  });

  it("names a body that has no prompt line", async () => {
    await expect(
      render('```text transcript="agent-hero/x"\nBash decks check\nDone.\n```\n'),
    ).rejects.toThrow('starts with "> <prompt>"');
  });
});
