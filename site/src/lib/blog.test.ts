// @vitest-environment node
import { describe, expect, it } from "vitest";
import { site } from "../config";
import {
  type BlogEntry,
  blogBreadcrumbs,
  blogCollection,
  blogHref,
  blogLlmsIndex,
  blogPosting,
  readingMinutes,
  relatedPosts,
  softwareJsonLd,
} from "./blog";

const post = (
  id: string,
  feature: BlogEntry["data"]["feature"] = "charts",
  published = "2026-11-01",
): BlogEntry => ({
  id,
  body: "A sourced chart.",
  data: {
    title: id,
    description: "A chart with a source.",
    published: new Date(published),
    updated: new Date(published),
    keyword: "charts",
    feature,
    relatedDocs: [],
  },
});
const current = post("current");
const assertNoNull = (value: unknown) => expect(JSON.stringify(value)).not.toMatch(/\bnull\b/);

describe("blog reading and navigation", () => {
  it("builds nested routes and rounds reading time up, with a minimum of one", () => {
    expect(blogHref("guides/steps")).toBe("/blog/guides/steps/");
    expect(readingMinutes("")).toBe(1);
    expect(readingMinutes("word ".repeat(230))).toBe(1);
    expect(readingMinutes("word ".repeat(231))).toBe(2);
    expect(
      readingMinutes(
        'import DeckDemo from "./DeckDemo.astro";\n\n<DeckDemo example="keeling" caption="Sample" />\n' +
          "word ".repeat(230),
      ),
    ).toBe(1);
  });
  it("prefers the same feature, then newest, excluding the current post without mutating input", () => {
    const posts = [
      post("new-other", "export", "2026-11-04"),
      post("old-same", "charts", "2026-10-01"),
      current,
      post("new-same", "charts", "2026-11-03"),
      post("old-other", "export", "2026-09-01"),
    ];
    const ids = posts.map((entry) => entry.id);
    expect(relatedPosts(posts, current).map((entry) => entry.id)).toEqual([
      "new-same",
      "old-same",
      "new-other",
    ]);
    expect(relatedPosts(posts, current, 1).map((entry) => entry.id)).toEqual(["new-same"]);
    expect(relatedPosts([current], current)).toEqual([]);
    expect(posts.map((entry) => entry.id)).toEqual(ids);
  });
});
describe("blog structured data", () => {
  it("omits optional version and uses the title when headline is absent", () => {
    const software = softwareJsonLd("");
    expect(software).not.toHaveProperty("softwareVersion");
    expect(softwareJsonLd("1.2.3")).toHaveProperty("softwareVersion", "1.2.3");
    expect(blogPosting(current)).toMatchObject({
      headline: current.data.title,
      wordCount: 3,
      about: { "@id": software["@id"] },
      author: site.author,
      publisher: site.publisher,
    });
    for (const data of [
      software,
      softwareJsonLd(),
      blogPosting(current),
      blogBreadcrumbs(current),
      blogCollection([current]),
      blogCollection([]),
    ])
      assertNoNull(data);
  });
  it("uses absolute URLs, the authored headline and ISO dates", () => {
    const entry = { ...current, data: { ...current.data, headline: "The full headline." } };
    expect(blogPosting(entry)).toMatchObject({
      headline: "The full headline.",
      url: `${site.url}/blog/current/`,
      mainEntityOfPage: `${site.url}/blog/current/`,
      image: `${site.url}/og/blog/current.png`,
      datePublished: "2026-11-01T00:00:00.000Z",
      dateModified: "2026-11-01T00:00:00.000Z",
    });
    expect(blogCollection([entry]).hasPart).toEqual([
      { "@type": "BlogPosting", url: `${site.url}/blog/current/`, headline: "The full headline." },
    ]);
    const crumbs = blogBreadcrumbs(entry).itemListElement;
    expect(crumbs[0]).toHaveProperty("item", `${site.url}/`);
    expect(crumbs[1]).toHaveProperty("item", `${site.url}/blog/`);
    expect(crumbs.at(-1)).not.toHaveProperty("item");
  });
  it("lists posts with descriptions and absolute URLs for llms.txt", () => {
    expect(blogLlmsIndex([current])).toBe(
      `## Blog\n\n- [current](${site.url}/blog/current/): A chart with a source.\n`,
    );
  });
});
