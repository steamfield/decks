// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createSatteriMarkdownProcessor } from "@astrojs/markdown-satteri";
import { describe, expect, it } from "vitest";
import { toMarkdownExport } from "./docs";
import { guideData, guideId, guideLink } from "./guide";
import { docsHastPlugins } from "./markdown";

describe("the package guide on the site", () => {
  it("keeps the quickstart URL and derives metadata without guide frontmatter", () => {
    expect(guideId("getting-started.md")).toBe("getting-started/quickstart");
    expect(guideId("README.md")).toBe("overview");
    expect(guideId("new-page.md")).toBe("new-page");
    expect(guideData("new-page", "# New page\n\nDescribe the page.")).toMatchObject({
      title: "New page",
      description: "Describe the page.",
      group: "guides",
    });
    expect(() => guideData("untitled", "Missing a title.")).toThrow("Guide untitled");
  });

  it("renders the guide without a duplicate title and links to site routes", async () => {
    const file = resolve("../docs/guide/getting-started.md");
    const processor = await createSatteriMarkdownProcessor({
      hastPlugins: docsHastPlugins,
      syntaxHighlight: false,
    });
    const { code } = await processor.render(readFileSync(file, "utf8"), {
      fileURL: pathToFileURL(file),
    });
    expect(code).not.toContain("<h1");
    expect(code).toContain('href="/docs/config/"');
    expect(code).toContain("bun add @steamfield/decks react react-dom");
  });

  it("preserves anchors, external links and code samples", async () => {
    expect(guideLink("getting-started.md#commands")).toBe(
      "/docs/getting-started/quickstart/#commands",
    );
    expect(guideLink("https://example.com/readme.md")).toBe("https://example.com/readme.md");
    const processor = await createSatteriMarkdownProcessor({
      hastPlugins: docsHastPlugins,
      syntaxHighlight: false,
    });
    const source = "# Guide\n\n[CLI](cli.md#share-image)\n\n```md\n[CLI](cli.md)\n```";
    const { code } = await processor.render(source, {
      fileURL: pathToFileURL(resolve("../docs/guide/test.md")),
    });
    expect(code).toContain('href="/docs/cli/#share-image"');
    expect(code).toContain("[CLI](cli.md)");
    const post = await processor.render("# Post\n\n[File](cli.md)", {
      fileURL: pathToFileURL(resolve("src/content/blog/test.mdx")),
    });
    expect(post.code).toContain("<h1");
    expect(post.code).toContain('href="cli.md"');
  });

  it("exports the guide with its title only once", () => {
    const body = "# Guide\n\nDescribe the page.\n\n## Details\n\nRead these.";
    const text = toMarkdownExport({ id: "guide", data: guideData("guide", body), body });
    expect(text.match(/^# Guide$/gm)).toHaveLength(1);
    expect(text).toContain("## Details\n\nRead these.");
  });

  it("exports working links from nested pages and llms without rewriting code", () => {
    const body =
      "# Guide\n\n[CLI](cli.md#share-image)\n\n[cli.md](cli.md)\n\n```md\n[CLI](cli.md)\n```";
    const text = toMarkdownExport({
      id: "getting-started/quickstart",
      data: guideData("guide", body),
      body,
    });
    expect(text).toContain("[CLI](/docs/cli/#share-image)");
    expect(text).toContain("[cli.md](/docs/cli/)");
    expect(text).toContain("```md\n[CLI](cli.md)\n```");
  });

  it("rewrites destinations without changing a matching link title", () => {
    const body =
      '# Guide\n\n[CLI](cli.md "Read cli.md")\n\n[CLI][ref]\n\n[ref]: cli.md "Read cli.md"';
    const text = toMarkdownExport({ id: "guide", data: guideData("guide", body), body });
    expect(text).toContain('[CLI](/docs/cli/ "Read cli.md")');
    expect(text).toContain('[ref]: /docs/cli/ "Read cli.md"');
  });
});
