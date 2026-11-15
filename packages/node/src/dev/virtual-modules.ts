import { join } from "node:path";
import { normalizePath } from "vite";
import { renderNotes } from "../mdx/notes";
import { readSource } from "../mdx/read-source";
import { buildManifest, type ScannedSlide } from "../mdx/slides";
import type { ResolvedDeck } from "./config";

export function manifestModule(deck: ResolvedDeck, slides: ScannedSlide[]): string {
  const loaders = slides
    .map(
      ({ meta }) =>
        `[${JSON.stringify(meta.id)}, () => import(${JSON.stringify(`/${meta.file}`)})]`,
    )
    .join(",");
  return `export const manifest = ${JSON.stringify(buildManifest(deck, slides))};
export const frontmatter = Object.fromEntries(${JSON.stringify(slides.map((slide) => [slide.meta.id, slide.frontmatter]))});
export const slides = Object.fromEntries([${loaders}]);`;
}

export async function notesModule(
  deck: () => ResolvedDeck,
  slides: ScannedSlide[],
  onRenderError: (cause: unknown) => never,
): Promise<string> {
  const notes: [string, { click: number; html: string }[]][] = [];
  for (const { meta } of slides) {
    const file = normalizePath(join(deck().dir, meta.file));
    // A config reload can finish while the slide source is being read.
    const segments = await renderNotes(
      await readSource(file),
      file,
      deck().config.mdx?.remarkPlugins,
    ).catch(onRenderError);
    if (segments !== undefined) notes.push([meta.id, segments]);
  }
  return `export const notes = Object.fromEntries(${JSON.stringify(notes)});`;
}
