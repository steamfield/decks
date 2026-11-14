import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { assertManifest, type DeckManifest, type SlideMeta } from "@react-decks/core";
import matter from "gray-matter";
import { glob } from "tinyglobby";
import { z } from "zod";
import { countClicks } from "./clicks";
import { componentsModule } from "./components";
import type { ResolvedDeck } from "./config";

export interface ScannedSlide {
  readonly meta: SlideMeta;
  readonly frontmatter: Readonly<Record<string, unknown>>;
}

const frontmatterSchema = z.looseObject({
  title: z.string().optional(),
  clicks: z.number().int().nonnegative().optional(),
  hide: z.boolean().default(false),
  transition: z.string().min(1).optional(),
  morphSteps: z.boolean().optional(),
});

export async function scanSlides(deck: ResolvedDeck): Promise<readonly ScannedSlide[]> {
  return (await scanSlidesWithCounts(deck, new Map())).slides;
}

export function readSlide(
  source: string,
  file: string,
  previous?: number,
  motionNames?: ReadonlyMap<string, string>,
) {
  try {
    const { data, content } = matter(source);
    const frontmatter = frontmatterSchema.parse(data);
    const clicks = frontmatter.hide
      ? 0
      : (frontmatter.clicks ?? countClicks(content, file, previous, motionNames));
    return { frontmatter, clicks, fingerprint: JSON.stringify([data, clicks]) };
  } catch (cause) {
    if (cause instanceof Error && cause.message.startsWith(`${file}:`)) throw cause;
    throw new Error(`${file}: ${cause instanceof Error ? cause.message : String(cause)}`, {
      cause,
    });
  }
}

export async function scanSlidesWithCounts(deck: ResolvedDeck, totals: Map<string, number>) {
  const { motionNames, code: componentsCode } = await componentsModule(deck.dir);
  const files = (await glob("slides/*.mdx", { cwd: deck.dir })).sort();
  const slides: ScannedSlide[] = [];
  const metadata = new Map<string, string>();
  for (const file of files) {
    const id = basename(file, ".mdx");
    try {
      const { frontmatter, clicks, fingerprint } = readSlide(
        await readFile(join(deck.dir, file), "utf8"),
        join(deck.dir, file),
        totals.get(file),
        motionNames,
      );
      metadata.set(file, fingerprint);
      totals.set(file, clicks);
      if (frontmatter.hide) continue;
      frontmatter.title ??= id;
      slides.push({
        meta: {
          no: slides.length + 1,
          id,
          file,
          title: frontmatter.title,
          clicks,
          ...(frontmatter.transition === undefined ? {} : { transition: frontmatter.transition }),
          ...(frontmatter.morphSteps === undefined ? {} : { morphSteps: frontmatter.morphSteps }),
        },
        frontmatter,
      });
    } catch (cause) {
      if (cause instanceof Error && cause.message.startsWith(`${join(deck.dir, file)}:`))
        throw cause;
      throw new Error(
        `${join(deck.dir, file)}: ${cause instanceof Error ? cause.message : String(cause)}`,
        { cause },
      );
    }
  }
  if (!slides.length) throw new Error(`${deck.dir}: no visible slides`);
  return { slides, metadata, componentsCode, motionNames };
}

export function buildManifest(deck: ResolvedDeck, slides: readonly ScannedSlide[]): DeckManifest {
  if (!slides.length) throw new Error(`${deck.dir}: no visible slides`);
  return assertManifest({
    name: deck.name,
    title: deck.config.title,
    canvas: deck.config.canvas,
    ...(deck.config.transition === undefined ? {} : { transition: deck.config.transition }),
    slides: slides.map(({ meta }) => meta),
  });
}
