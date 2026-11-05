// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { blogSchema, docSchema } from "./schema";

const valid = { title: "Install", description: "How to install.", group: "getting-started" };

describe("docSchema", () => {
  it("defaults order and accepts a known group", () => {
    expect(docSchema.parse(valid).order).toBe(100);
  });

  it("rejects an unknown group and a description over 160 characters", () => {
    expect(docSchema.safeParse({ ...valid, group: "blog" }).success).toBe(false);
    expect(docSchema.safeParse({ ...valid, description: "x".repeat(161) }).success).toBe(false);
  });

  it("names a group in every shipped page", () => {
    const root = "src/content/docs";
    const files = readdirSync(root, { recursive: true, encoding: "utf8" }).filter((file) =>
      file.endsWith(".md"),
    );
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(readFileSync(join(root, file), "utf8"), file).toMatch(/^group: [\w-]+$/m);
    }
  });
});

const validPost = {
  title: "Story steps in Slidev",
  description: "a".repeat(120),
  published: "2026-11-01",
  keyword: "Slidev story steps",
  feature: "story-steps",
  relatedDocs: ["getting-started/quickstart"],
};
describe("blogSchema", () => {
  it("parses valid metadata, resolves docs references and defaults updated", () => {
    const post = blogSchema.parse(validPost);
    expect(post.updated).toEqual(post.published);
    expect(post.published).toBeInstanceOf(Date);
    expect(post.relatedDocs).toEqual([{ collection: "docs", id: "getting-started/quickstart" }]);
    expect(blogSchema.parse({ ...validPost, relatedDocs: undefined }).relatedDocs).toEqual([]);
  });
  it.each([
    { title: "x".repeat(49) },
    { title: "" },
    { description: "x".repeat(119) },
    { description: "x".repeat(161) },
    { updated: "2026-10-31" },
    { published: "invalid" },
    { feature: "unknown" },
    { relatedDocs: ["missing-doc"] },
  ])("rejects invalid metadata %j", (patch) => {
    expect(blogSchema.safeParse({ ...validPost, ...patch }).success).toBe(false);
  });
  it("accepts the upper title and description limits and a later update", () => {
    expect(
      blogSchema.safeParse({
        ...validPost,
        title: "x".repeat(48),
        description: "x".repeat(160),
        updated: "2026-11-02",
      }).success,
    ).toBe(true);
  });
});
