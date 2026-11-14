import { basename, join } from "node:path";
import { assertManifest, type DeckManifest, type SlideMeta } from "@react-decks/core";
import matter from "gray-matter";
import { glob } from "tinyglobby";
import type { PluggableList } from "unified";
import { z } from "zod";
import { countClicks } from "./clicks";
import { componentsModule } from "./components";
import type { ResolvedDeck } from "./config";
import { DeckError, displayPath, validationError } from "./errors";
import { readSource } from "./read-source";

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
  layers: z.union([z.literal(false), z.literal("above"), z.literal("below")]).optional(),
});

export async function scanSlides(deck: ResolvedDeck): Promise<readonly ScannedSlide[]> {
  return (await scanSlidesWithCounts(deck, new Map())).slides;
}

export function readSlide(
  source: string,
  file: string,
  previous?: number,
  motionNames?: ReadonlyMap<string, string>,
  remarkPlugins?: PluggableList,
) {
  try {
    const { data, content } = matter(source);
    const parsed = frontmatterSchema.safeParse(data);
    if (!parsed.success) throw validationError(file, parsed.error.issues, data, [], true);
    const frontmatter = parsed.data;
    const clicks = frontmatter.hide
      ? 0
      : (frontmatter.clicks ??
        countClicks(
          source.slice(0, source.length - content.length).replace(/[^\n]/g, " ") + content,
          file,
          previous,
          motionNames,
          remarkPlugins,
        ));
    return { frontmatter, clicks, fingerprint: JSON.stringify([data, clicks]) };
  } catch (cause) {
    if (cause instanceof DeckError) throw cause;
    const mark =
      typeof cause === "object" && cause !== null && "mark" in cause ? cause.mark : undefined;
    const loc =
      typeof mark === "object" &&
      mark !== null &&
      "line" in mark &&
      typeof mark.line === "number" &&
      "column" in mark &&
      typeof mark.column === "number"
        ? { line: mark.line + 1, column: mark.column + 1 }
        : undefined;
    if (!loc) throw cause;
    const reason =
      typeof cause === "object" && cause !== null && "reason" in cause
        ? String(cause.reason)
        : String(cause);
    throw new DeckError(`invalid YAML: ${reason}. Check the frontmatter syntax.`, file, loc, {
      cause,
    });
  }
}

export async function scanSlidesWithCounts(deck: ResolvedDeck, totals: Map<string, number>) {
  const {
    motionNames,
    code: componentsCode,
    names: componentNames,
  } = await componentsModule(deck.dir);
  const files = (await glob("slides/*.mdx", { cwd: deck.dir })).sort();
  const slides: ScannedSlide[] = [];
  const metadata = new Map<string, string>();
  for (const file of files) {
    const id = basename(file, ".mdx");
    try {
      const { frontmatter, clicks, fingerprint } = readSlide(
        await readSource(join(deck.dir, file)),
        join(deck.dir, file),
        totals.get(file),
        motionNames,
        deck.config.mdx?.remarkPlugins,
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
      if (cause instanceof DeckError) throw cause;
      throw new DeckError(
        cause instanceof Error ? cause.message : String(cause),
        join(deck.dir, file),
        undefined,
        { cause },
      );
    }
  }
  if (!slides.length)
    throw new DeckError(
      files.length
        ? `every slide in ${displayPath(deck.dir)}/slides has hide: true.`
        : `no slides/*.mdx files in ${displayPath(deck.dir) === "." ? "the current directory" : displayPath(deck.dir)}.`,
    );
  return { slides, metadata, componentsCode, motionNames, componentNames };
}

export function buildManifest(deck: ResolvedDeck, slides: readonly ScannedSlide[]): DeckManifest {
  if (!slides.length)
    throw new DeckError(
      `no slides/*.mdx files in ${displayPath(deck.dir) === "." ? "the current directory" : displayPath(deck.dir)}.`,
    );
  return assertManifest({
    name: deck.name,
    title: deck.config.title,
    canvas: deck.config.canvas,
    ...(deck.config.transition === undefined ? {} : { transition: deck.config.transition }),
    slides: slides.map(({ meta }) => meta),
  });
}
