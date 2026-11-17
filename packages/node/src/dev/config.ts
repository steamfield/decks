import { existsSync } from "node:fs";
import { basename, resolve } from "node:path";
import { createJiti } from "jiti";
import type { PluggableList } from "unified";
import type { UserConfig } from "vite";
import { z } from "zod";
import { DeckError, displayPath, validationError } from "./errors";

export interface DeckConfig {
  readonly title: string;
  readonly author?: string;
  /** One line about the deck: the page description and the text of a shared link's preview. */
  readonly info?: string;
  /** Where the built deck is published. Share previews need it for absolute links. */
  readonly url?: string;
  readonly canvas?: { readonly width: number; readonly height: number };
  readonly transition?: string;
  readonly htmlAttrs?: Readonly<Record<string, string>>;
  /**
   * The "Created with Decks" credit in the lower right of every slide. On by default; `false`
   * removes it. To replace it, add `layers/credit.tsx` to the deck.
   */
  readonly credit?: boolean;
  readonly vite?: UserConfig;
  readonly term?: { readonly dirs?: Record<string, string> };
  /** remark and rehype plugins added to the slide compiler. */
  readonly mdx?: {
    readonly remarkPlugins?: PluggableList;
    readonly rehypePlugins?: PluggableList;
  };
}

export interface ResolvedDeck {
  readonly name: string;
  readonly dir: string;
  readonly config: DeckConfig & {
    readonly canvas: { readonly width: number; readonly height: number };
    readonly credit: boolean;
  };
}

export function defineDeck(config: DeckConfig): DeckConfig {
  return config;
}

const schema = z.strictObject({
  title: z.string(),
  author: z.string().optional(),
  info: z.string().optional(),
  url: z.url().optional(),
  canvas: z
    .strictObject({ width: z.number().positive(), height: z.number().positive() })
    .default({ width: 1920, height: 1080 }),
  transition: z.string().min(1).optional(),
  htmlAttrs: z.record(z.string(), z.string()).optional(),
  credit: z.boolean().default(true),
  term: z.strictObject({ dirs: z.record(z.string(), z.string()).optional() }).optional(),
  vite: z
    .custom<UserConfig>(
      (value) => typeof value === "object" && value !== null && !Array.isArray(value),
    )
    .optional(),
  mdx: z
    .strictObject({
      remarkPlugins: z
        .custom<PluggableList>(Array.isArray, "mdx.remarkPlugins must be an array")
        .optional(),
      rehypePlugins: z
        .custom<PluggableList>(Array.isArray, "mdx.rehypePlugins must be an array")
        .optional(),
    })
    .optional(),
});

export async function loadDeck(dir: string, name?: string): Promise<ResolvedDeck> {
  const absolute = resolve(dir);
  const file = resolve(absolute, "deck.config.ts");
  if (!existsSync(file))
    throw new DeckError(
      `no deck.config.ts in ${displayPath(absolute)}. A deck directory holds deck.config.ts and slides/.`,
      file,
      undefined,
      { prefix: false },
    );
  const jiti = createJiti(import.meta.url, { moduleCache: false, fsCache: false });
  const module = await jiti.import<Record<string, unknown>>(file).catch((cause: unknown) => {
    throw new DeckError(
      `cannot load config: ${cause instanceof Error ? cause.message : String(cause)}`,
      file,
      undefined,
      { cause },
    );
  });
  if (!Object.hasOwn(module, "default"))
    throw new DeckError(
      `${displayPath(file)} has no default export. Write: export default defineDeck({ title: "..." })`,
      file,
      undefined,
      { prefix: false },
    );
  const parsed = schema.safeParse(module.default);
  if (!parsed.success)
    throw validationError(file, parsed.error.issues, module.default, Object.keys(schema.shape));
  const config = parsed.data;
  for (const [key, path] of Object.entries(config.term?.dirs ?? {})) {
    const directory = resolve(absolute, path);
    if (config.term?.dirs) config.term.dirs[key] = directory;
  }
  for (const key of Object.keys(config.htmlAttrs ?? {})) {
    if (!/^[A-Za-z_:][-A-Za-z0-9_:.]*$/.test(key))
      throw new DeckError(`htmlAttrs key ${key} is not a valid HTML attribute name.`, file);
  }
  return { name: name ?? basename(absolute), dir: absolute, config };
}
