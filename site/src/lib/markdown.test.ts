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

describe("docs Markdown", () => {
  it("turns GitHub alerts into labelled callouts and leaves plain quotes alone", async () => {
    const { code } = await render("> [!WARNING]\n> Back up first.\n\n> Just a quote.\n");
    expect(code).toMatch(/<blockquote[^>]*data-callout="warning"/);
    expect(code).toContain('<p data-callout-title="">Warning</p>');
    expect(code).toContain("<p>Back up first.</p>");
    expect(code).not.toContain("[!WARNING]");
    expect(code).toContain("<blockquote>\n<p>Just a quote.</p>");
  });

  it("links headings without changing their text", async () => {
    const { code, metadata } = await render("## Install it\n");
    expect(code).toMatch(
      /<a href="#install-it" data-heading-anchor="" aria-label="Link to this section">/,
    );
    expect(metadata.headings).toEqual([{ depth: 2, slug: "install-it", text: "Install it" }]);
  });

  it("frames code blocks with a copy button and captions titled ones", async () => {
    const { code } = await render('```sh title="Terminal"\nbun add acme\n```\n\n```js\nx\n```\n');
    expect(code.match(/<figure data-code-block="">/g)).toHaveLength(2);
    expect(code).toContain('<figcaption data-code-title="">Terminal</figcaption>');
    expect(code.match(/<button[^>]*data-copy-command[^>]*aria-controls="code-\d"/g)).toHaveLength(
      2,
    );
  });

  it("wraps tables in a focusable scroll region", async () => {
    const { code } = await render("| a | b |\n| - | - |\n| 1 | 2 |\n");
    expect(code).toMatch(/<div data-table-scroll="" tabindex="0" role="region"[^>]*><table>/);
  });

  it("renders a demo fence as its slide's poster above the code and links the slide", async () => {
    const { code } = await render(
      '```mdx demo="guide-demos/title-reveal"\n<MotionTemplate template="title-reveal" />\n```\n',
    );
    expect(code).toMatch(/<figure class="deck-demo not-prose" data-deck-demo="range">/);
    expect(code).toMatch(
      /<img src="\/posters\/demos\/guide-demos\/title-reveal-1280\.webp"[^>]*loading="lazy"/,
    );
    expect(code).toMatch(/<figure data-code-block="">/);
    expect(code).not.toContain("data-demo=");
    expect(code).toContain('href="/d/guide-demos/#/2"');
  });

  it("names the demo slide it cannot find", async () => {
    await expect(render('```mdx demo="guide-demos/no-such-slide"\nx\n```\n')).rejects.toThrow(
      /no-such-slide/,
    );
  });

  it("renders an empty demo fence for a gallery deck as a player with no code", async () => {
    const { code } = await render('```mdx demo="building-for-agents"\n```\n');
    expect(code).toMatch(/<figure class="deck-demo not-prose" data-deck-demo="reel">/);
    expect(code).toContain("data-deck-demo-player");
    expect(code).toMatch(/<img src="\/posters\/building-for-agents[^"]*-1280\.webp"/);
    expect(code).not.toContain("data-code-block");
    expect(code).toContain('href="/d/building-for-agents/"');
  });

  it("rejects a demo of a deck that is not registered, naming it", async () => {
    await expect(render('```mdx demo="no-such-deck"\n```\n')).rejects.toThrow(/no-such-deck/);
  });
});
