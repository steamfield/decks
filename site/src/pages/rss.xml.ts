import rss from "@astrojs/rss";
import { site } from "../config";
import { blogHref } from "../lib/blog";
import { getBlog } from "../lib/collection";

export async function GET() {
  return rss({
    title: "Decks blog",
    description: "Slidev and coding-agent presentation guides",
    site: site.url,
    items: (await getBlog()).map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.published,
      link: new URL(blogHref(post.id), site.url).href,
    })),
  });
}
