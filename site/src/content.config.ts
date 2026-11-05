import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { blogSchema, docSchema } from "./content/schema";

export const collections = {
  blog: defineCollection({
    loader: glob({ pattern: "**/*.mdx", base: "./src/content/blog" }),
    schema: blogSchema,
  }),
  docs: defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/docs" }),
    schema: docSchema,
  }),
};
