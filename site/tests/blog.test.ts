import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";
import { site } from "../src/config";
import { EXAMPLE_NAMES } from "../src/data/examples";
import { deckDemoCount, inspectMdx } from "./mdx";

const parser = new new Window().DOMParser();
const read = (path: string) => readFileSync(join("dist", path), "utf8");
const page = (path: string) => parser.parseFromString(read(path), "text/html");
const posts = readdirSync("src/content/blog", { recursive: true, encoding: "utf8" })
  .filter((file) => file.endsWith(".mdx"))
  .map((file) => ({
    id: file.replace(/\.mdx$/, ""),
    source: readFileSync(join("src/content/blog", file), "utf8"),
  }));
const absolute = (path: string) => new URL(path, site.url).href;
const ld = (doc: ReturnType<typeof page>) =>
  [...doc.querySelectorAll('script[type="application/ld+json"]')].map((script) =>
    JSON.parse(script.textContent ?? ""),
  );
const software = ld(page("index.html")).find((data) => data["@type"] === "SoftwareApplication");
const sitemap = parser.parseFromString(read("sitemap-0.xml"), "text/xml");
const feed = parser.parseFromString(read("rss.xml"), "text/xml");
const llms = read("llms.txt");
const demoSource = readFileSync("src/components/blog/DeckDemo.astro", "utf8");
const params = [
  ...(demoSource.match(/DECK_DEMO_PARAMS = \[([^\]]+)\]/)?.[1] ?? "").matchAll(/"([^"]+)"/g),
].map((match) => match[1]);

function noNull(value: unknown) {
  expect(value).not.toBeNull();
  if (typeof value === "object" && value !== null)
    for (const child of Object.values(value)) noNull(child);
}

describe("built blog posts", () => {
  it.each(posts)("$id has consistent article metadata, structured data and discovery", ({ id }) => {
    const doc = page(`blog/${id}/index.html`);
    const meta = (selector: string) => doc.querySelector(selector)?.getAttribute("content");
    const url = absolute(`/blog/${id}/`);
    expect(doc.querySelectorAll("h1")).toHaveLength(1);
    expect(doc.title.length).toBeLessThanOrEqual(60);
    expect(doc.title.replace(/ \| Decks$/, "").length).toBeLessThanOrEqual(48);
    const description = meta('meta[name="description"]') ?? "";
    expect(description.length).toBeGreaterThanOrEqual(120);
    expect(description.length).toBeLessThanOrEqual(160);
    for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]'])
      expect(meta(selector)).toBe(doc.title);
    for (const selector of ['meta[property="og:description"]', 'meta[name="twitter:description"]'])
      expect(meta(selector)).toBe(description);
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(url);
    expect(meta('meta[property="og:url"]')).toBe(url);
    expect(meta('meta[property="og:type"]')).toBe("article");
    const data = ld(doc);
    expect(data).toHaveLength(2);
    data.forEach(noNull);
    const posting = data.find((item) => item["@type"] === "BlogPosting");
    expect(posting).toMatchObject({ url, description, about: { "@id": software["@id"] } });
    expect(meta('meta[property="article:published_time"]')).toBe(posting.datePublished);
    expect(meta('meta[property="article:modified_time"]')).toBe(posting.dateModified);
    expect(Number.isNaN(Date.parse(posting.datePublished))).toBe(false);
    expect(Date.parse(posting.dateModified)).toBeGreaterThanOrEqual(
      Date.parse(posting.datePublished),
    );
    const breadcrumbs = data.find((item) => item["@type"] === "BreadcrumbList").itemListElement;
    expect(breadcrumbs.at(-1)).not.toHaveProperty("item");
    expect(breadcrumbs.slice(0, 2).map((item: { item: string }) => item.item)).toEqual([
      absolute("/"),
      absolute("/blog/"),
    ]);
    expect(readFileSync(`dist/og/blog/${id}.png`).subarray(1, 4).toString()).toBe("PNG");
    expect([...sitemap.querySelectorAll("loc")].map((loc) => loc.textContent)).toContain(url);
    const item = [...feed.querySelectorAll("item")].find(
      (entry) => entry.querySelector("link")?.textContent === url,
    );
    expect(item).toBeDefined();
    expect(new Date(item?.querySelector("pubDate")?.textContent ?? "").toISOString()).toBe(
      posting.datePublished,
    );
    expect(item?.querySelector("description")?.textContent).toBe(description);
    expect(llms).toContain(`](${url}): ${description}`);
  });

  it("lists exactly the same posts in sitemap, feed, llms.txt and CollectionPage", () => {
    expect(posts.length).toBeGreaterThan(0);
    const urls = posts.map(({ id }) => absolute(`/blog/${id}/`)).sort();
    expect(
      [...sitemap.querySelectorAll("loc")]
        .map((loc) => loc.textContent)
        .filter((url) => url?.startsWith(absolute("/blog/")) && url !== absolute("/blog/"))
        .sort(),
    ).toEqual(urls);
    expect([...feed.querySelectorAll("item link")].map((link) => link.textContent).sort()).toEqual(
      urls,
    );
    expect(
      [...llms.matchAll(/\]\((https:[^)]+\/blog\/[^)]+)\)/g)].map((match) => match[1]).sort(),
    ).toEqual(urls);
    expect(llms.indexOf("## Blog")).toBeGreaterThan(llms.indexOf("## Reference"));
    const index = page("blog/index.html");
    const collection = ld(index).find((data) => data["@type"] === "CollectionPage");
    noNull(collection);
    expect(collection.hasPart.map((part: { url: string }) => part.url).sort()).toEqual(urls);
    for (const { id } of posts) {
      const heading = ld(page(`blog/${id}/index.html`)).find(
        (data) => data["@type"] === "BlogPosting",
      ).headline;
      expect(collection.hasPart).toContainEqual({
        "@type": "BlogPosting",
        url: absolute(`/blog/${id}/`),
        headline: heading,
      });
      expect(index.querySelector(`main a[href="/blog/${id}/"]`)).not.toBeNull();
    }
  });

  it.each(posts)("$id shares docs code frames and linked heading ids", ({ id, source }) => {
    const doc = page(`blog/${id}/index.html`);
    const headings = [...doc.querySelectorAll("[data-blog-body] h2, [data-blog-body] h3")];
    for (const heading of headings) {
      expect(heading.id).toBeTruthy();
      expect(heading.querySelector("[data-heading-anchor]")?.getAttribute("href")).toBe(
        `#${heading.id}`,
      );
      expect(doc.querySelector(`nav[data-toc] a[href="#${heading.id}"]`)).not.toBeNull();
    }
    if (id === "slidev-export-pdf") {
      expect(inspectMdx(source).fences.some((fence) => /\btitle=/.test(fence.meta ?? ""))).toBe(
        true,
      );
    }
    expectCodeFrames(doc, source);
  });

  it.each(posts)("$id uses only supported DeckDemo props and registered examples", ({ source }) => {
    expectDemoSource(source);
  });
});

function expectCodeFrames(doc: ReturnType<typeof page>, source: string) {
  const { fences } = inspectMdx(source);
  if (!fences.length) return;
  const docs = page("docs/getting-started/quickstart/index.html");
  const selectors = ["[data-code-block]", "[data-code-copy]", "pre.astro-code"];
  if (fences.some((fence) => /\btitle=/.test(fence.meta ?? "")))
    selectors.push("[data-code-title]");
  for (const selector of selectors) {
    expect(doc.querySelector(selector), selector).not.toBeNull();
    expect(docs.querySelector(selector), selector).not.toBeNull();
  }
  expect(doc.documentElement.outerHTML).toContain("--shiki-dark:");
}

function expectDemoSource(source: string) {
  expect(params).toEqual(["example", "caption"]);
  for (const demo of inspectMdx(source).demos) {
    expect(demo.attributes).toHaveLength(2);
    for (const prop of demo.attributes) {
      expect(prop.type, "DeckDemo spreads are not supported").toBe("mdxJsxAttribute");
      if (prop.type !== "mdxJsxAttribute") continue;
      expect(params).toContain(prop.name);
      expect(typeof prop.value, "Use literal MDX demo props").toBe("string");
      if (prop.name === "example") expect(EXAMPLE_NAMES).toContain(prop.value);
    }
  }
}

describe("valid article shapes", () => {
  it("accepts a prose-only post without a code frame", () => {
    const doc = parser.parseFromString(
      "<article><h2 id='read'>Read a chart.</h2><p>Keep the source beside the figure.</p></article>",
      "text/html",
    );
    expect(() =>
      expectCodeFrames(doc, "## Read a chart.\n\nKeep the source beside the figure."),
    ).not.toThrow();
  });
  it("accepts an untitled fence without requiring a caption", () => {
    const doc = page("docs/getting-started/quickstart/index.html");
    for (const caption of doc.querySelectorAll("[data-code-title]")) caption.remove();
    expect(() =>
      expectCodeFrames(doc, "```bash\nbunx -p slidev-addon-decks decks new my-talk --story\n```"),
    ).not.toThrow();
  });
  it("accepts > in a caption regardless of prop order", () => {
    expect(() =>
      expectDemoSource('<DeckDemo caption="Values > 400" example="keeling" />'),
    ).not.toThrow();
  });
  it("counts live components while ignoring fenced and inline syntax and comments", () => {
    const source = [
      '<DeckDemo example="keeling" caption="Live" />',
      "",
      "```mdx",
      '<DeckDemo example="keeling" caption="Example" />',
      "```",
      "",
      '`<DeckDemo example="keeling" caption="Inline" />`',
      "",
      '{/* <DeckDemo example="keeling" caption="Comment" /> */}',
    ].join("\n");
    expect(deckDemoCount(source)).toBe(1);
  });
});
