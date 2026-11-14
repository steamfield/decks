import { defineCollection } from "astro:content";
import { readFileSync } from "node:fs";
import { glob } from "astro/loaders";
import { blogSchema, docSchema } from "./content/schema";
import { guideData, guideId } from "./lib/guide";

const guide = glob({
  pattern: "*.md",
  base: "../docs/guide",
  generateId: ({ entry }) => guideId(entry),
});

export const collections = {
  blog: defineCollection({
    loader: glob({ pattern: "**/*.mdx", base: "./src/content/blog" }),
    schema: blogSchema,
  }),
  docs: defineCollection({
    loader: {
      name: "package-guide",
      load: (context) =>
        guide.load({
          ...context,
          parseData: ({ id, filePath, data }) => {
            if (!filePath) throw new Error(`Guide ${id} has no source file.`);
            return context.parseData({
              id,
              filePath,
              data: { ...data, ...guideData(id, readFileSync(filePath, "utf8")) },
            });
          },
        }),
    },
    schema: docSchema,
  }),
};
