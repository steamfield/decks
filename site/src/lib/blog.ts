import { site } from "../config";
import type { BlogData } from "../content/schema";

export type BlogEntry = { id: string; data: BlogData; body: string };
export const blogHref = (id: string) => `/blog/${id}/`;
const absolute = (path: string) => new URL(path, site.url).href;

/** Exclude MDX imports, components and Markdown punctuation from the reading estimate. */
export function wordCount(body: string): number {
  const text = body
    .replace(/^import[\s\S]*?;\s*$/gm, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  return text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
}
export const readingMinutes = (body: string) => Math.max(1, Math.ceil(wordCount(body) / 230));

export function relatedPosts(posts: readonly BlogEntry[], current: BlogEntry, max = 3) {
  return posts
    .filter((post) => post.id !== current.id)
    .sort(
      (a, b) =>
        Number(b.data.feature === current.data.feature) -
          Number(a.data.feature === current.data.feature) ||
        b.data.published.getTime() - a.data.published.getTime() ||
        a.id.localeCompare(b.id),
    )
    .slice(0, max);
}

export function softwareJsonLd(version = site.version) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": absolute("/#software"),
    name: site.name,
    description: site.description,
    url: absolute("/"),
    applicationCategory: "DeveloperApplication",
    operatingSystem: "macOS, Linux, Windows",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    ...(version ? { softwareVersion: version } : {}),
  };
}

export function blogPosting(post: BlogEntry) {
  const url = absolute(blogHref(post.id));
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.data.headline ?? post.data.title,
    description: post.data.description,
    datePublished: post.data.published.toISOString(),
    dateModified: post.data.updated.toISOString(),
    url,
    mainEntityOfPage: url,
    author: site.author,
    publisher: site.publisher,
    image: absolute(`/og/blog/${post.id}.png`),
    keywords: post.data.keyword,
    wordCount: wordCount(post.body),
    about: { "@id": absolute("/#software") },
  };
}
export function blogBreadcrumbs(post: BlogEntry) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absolute("/") },
      { "@type": "ListItem", position: 2, name: "Blog", item: absolute("/blog/") },
      { "@type": "ListItem", position: 3, name: post.data.title },
    ],
  };
}
export function blogCollection(posts: readonly BlogEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    url: absolute("/blog/"),
    hasPart: posts.map((post) => ({
      "@type": "BlogPosting",
      url: absolute(blogHref(post.id)),
      headline: post.data.headline ?? post.data.title,
    })),
  };
}
export function blogLlmsIndex(posts: readonly BlogEntry[]) {
  return `## Blog\n\n${posts.map((post) => `- [${post.data.title}](${absolute(blogHref(post.id))}): ${post.data.description}`).join("\n")}\n`;
}
