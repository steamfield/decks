import { reference } from "astro:content";
import { readdirSync } from "node:fs";
import { z } from "astro/zod";
import { docsGroups } from "../config";

const groupIds = docsGroups.map((group) => group.id) as [string, ...string[]];

/** Frontmatter for every page under src/content/docs/. */
export const docSchema = z.object({
  title: z.string().trim().min(1),
  /** Meta description, docs-home card text and the llms.txt summary. */
  description: z.string().trim().min(1).max(160),
  group: z.enum(groupIds),
  /** Position inside the group; ties sort by title. */
  order: z.number().int().default(100),
  /** Shorter label for the sidebar and pager. */
  sidebarLabel: z.string().trim().min(1).optional(),
});

export type DocData = z.infer<typeof docSchema>;

// Astro references normalize ids but do not reject missing entries during parsing.
// The glob loader uses these same paths as ids; validate before a page can render.
const docIds = new Set(
  readdirSync("src/content/docs", { recursive: true, encoding: "utf8" })
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, "").replaceAll("\\", "/")),
);

export const blogSchema = z
  .object({
    title: z.string().trim().min(1).max(48),
    headline: z.string().trim().min(1).optional(),
    description: z.string().trim().min(120).max(160),
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
    keyword: z.string().trim().min(1),
    feature: z.enum([
      "agents",
      "skills",
      "charts",
      "story-steps",
      "export",
      "theming",
      "examples",
      "comparison",
      "storytelling",
    ]),
    relatedDocs: z
      .array(
        reference("docs").refine(
          (doc) => doc !== undefined && "id" in doc && docIds.has(doc.id),
          "Unknown relatedDocs id",
        ),
      )
      .default([]),
  })
  .transform((data) => ({ ...data, updated: data.updated ?? data.published }))
  .refine((data) => data.updated >= data.published, {
    message: "updated must be on or after published",
    path: ["updated"],
  });

export type BlogData = z.infer<typeof blogSchema>;
