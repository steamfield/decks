import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { assertManifest, type DeckManifest, type SlideMeta } from "@react-decks/core";
import matter from "gray-matter";
import { glob } from "tinyglobby";
import { z } from "zod";
import type { ResolvedDeck } from "./config";

export interface ScannedSlide {
  readonly meta: SlideMeta;
  readonly frontmatter: Readonly<Record<string, unknown>>;
}

const frontmatterSchema = z.looseObject({
  title: z.string().optional(),
  clicks: z.number().int().nonnegative().default(0),
  hide: z.boolean().default(false),
  transition: z.string().optional(),
});

export async function scanSlides(deck: ResolvedDeck): Promise<readonly ScannedSlide[]> {
  const files = (await glob("slides/*.mdx", { cwd: deck.dir, dot: true })).sort();
  const slides: ScannedSlide[] = [];
  for (const file of files) {
    const id = basename(file, ".mdx");
    try {
      const frontmatter = frontmatterSchema.parse(
        matter(await readFile(join(deck.dir, file), "utf8")).data,
      );
      if (frontmatter.hide) continue;
      frontmatter.title ??= id;
      slides.push({
        meta: {
          no: slides.length + 1,
          id,
          file,
          title: frontmatter.title,
          clicks: frontmatter.clicks,
          ...(frontmatter.transition === undefined ? {} : { transition: frontmatter.transition }),
        },
        frontmatter,
      });
    } catch (cause) {
      throw new Error(
        `${join(deck.dir, file)}: ${cause instanceof Error ? cause.message : String(cause)}`,
        { cause },
      );
    }
  }
  if (!slides.length) throw new Error(`${deck.dir}: no visible slides`);
  return slides;
}

export function buildManifest(deck: ResolvedDeck, slides: readonly ScannedSlide[]): DeckManifest {
  if (!slides.length) throw new Error(`${deck.dir}: no visible slides`);
  return assertManifest({
    name: deck.name,
    title: deck.config.title,
    canvas: deck.config.canvas,
    slides: slides.map(({ meta }) => meta),
  });
}
