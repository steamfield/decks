// Live demos in the package guide. A fence in docs/guide/*.md whose info string carries
// `demo="<deck>/<slide>"` (or `<deck>/<first>..<last>` for a slide transition or a morph)
// plays that slide range of an example deck beside its code on the site; in plain Markdown it
// stays an ordinary code block. A slide is named by its file's stem without the number prefix
// (`slides/42-stagger.mdx` is `stagger`). scripts/demo.mjs builds and records the deck and
// shoots each demo's poster at its last step into public/posters/demos/<deck>/.
//
// No relative imports: scripts/demo.mjs loads this file under plain Node.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const DEMO_POSTERS = "posters/demos";

// Builds, tests and scripts/demo.mjs run from site/.
const repo = () => join(process.cwd(), "..");

export type DemoRef = { deck: string; first: string; last: string };
export type DemoFence = DemoRef & { page: string; code: string };
export type DeckSlide = { slide: number; stem: string; file: string; source: string };

/** The `demo="…"` attribute of a fence info string, or null when there is none. */
export function parseDemo(meta: string | undefined): DemoRef | null {
  const value = meta?.match(/(?:^|\s)demo="([^"]*)"/)?.[1];
  if (value === undefined) return null;
  const match = value.match(/^([\w-]+)\/([\w-]+)(?:\.\.([\w-]+))?$/);
  if (!match?.[1] || !match[2])
    throw new Error(`demo="${value}": expected demo="<deck>/<slide>" or "<deck>/<first>..<last>"`);
  return { deck: match[1], first: match[2], last: match[3] ?? match[2] };
}

/** The demo's file-safe name, for its poster. */
export const demoName = ({ first, last }: DemoRef) =>
  first === last ? first : `${first}--${last}`;

/** A deck's slides in deck order (sorted file names, as the framework orders them). */
export function deckSlides(deck: string): DeckSlide[] {
  const dir = join(repo(), "examples", deck, "slides");
  return readdirSync(dir)
    .filter((file) => file.endsWith(".mdx"))
    .sort()
    .map((file, index) => {
      const source = readFileSync(join(dir, file), "utf8");
      // A hidden slide takes no number, which would shift every demo after it.
      if (/^hide:\s*true\s*$/m.test(source))
        throw new Error(`examples/${deck}/slides/${file}: a demo deck has no hidden slides`);
      return {
        slide: index + 1,
        stem: file.replace(/^\d+-/, "").replace(/\.mdx$/, ""),
        file: `slides/${file}`,
        source,
      };
    });
}

/** The 1-based slide numbers a demo covers, and its slides. */
export function resolveDemo(ref: DemoRef) {
  const slides = deckSlides(ref.deck);
  const find = (stem: string) => {
    const matches = slides.filter((slide) => slide.stem === stem);
    if (matches.length !== 1)
      throw new Error(
        `demo="${ref.deck}/${stem}": ${matches.length} slides in examples/${ref.deck}/slides are named ${stem}`,
      );
    return matches[0] as DeckSlide;
  };
  const first = find(ref.first);
  const last = find(ref.last);
  if (last.slide < first.slide)
    throw new Error(`demo="${ref.deck}/${ref.first}..${ref.last}": the range runs backwards`);
  return {
    first: first.slide,
    last: last.slide,
    slides: slides.slice(first.slide - 1, last.slide),
  };
}

/** Every demo fence in the package guide, in page and source order. */
export function guideDemos(): DemoFence[] {
  const dir = join(repo(), "docs/guide");
  return readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .sort()
    .flatMap((page) =>
      Array.from(
        // A fence closes on a line of the same backticks, so ````mdx can hold ``` blocks.
        readFileSync(join(dir, page), "utf8").matchAll(/^(`{3,})(\S*)([^\n]*)\n([\s\S]*?)^\1$/gm),
        (match) => {
          const ref = parseDemo(match[3]);
          return ref ? [{ ...ref, page, code: (match[4] ?? "").replace(/\n$/, "") }] : [];
        },
      ).flat(),
    );
}

/** The poster's base URL for a demo, or null before `make demo` has shot it. */
export function demoPoster(ref: DemoRef, site = process.cwd()) {
  const base = `${DEMO_POSTERS}/${ref.deck}/${demoName(ref)}`;
  return existsSync(join(site, "public", `${base}-1920.avif`)) ? `/${base}` : null;
}
