import { basename, resolve } from "node:path";
import { createJiti } from "jiti";
import type { UserConfig } from "vite";
import { z } from "zod";

export interface DeckConfig {
  readonly title: string;
  readonly author?: string;
  readonly info?: string;
  readonly canvas?: { readonly width: number; readonly height: number };
  readonly transition?: string;
  readonly htmlAttrs?: Readonly<Record<string, string>>;
  readonly vite?: UserConfig;
}

export interface ResolvedDeck {
  readonly name: string;
  readonly dir: string;
  readonly config: DeckConfig & {
    readonly canvas: { readonly width: number; readonly height: number };
  };
}

export function defineDeck(config: DeckConfig): DeckConfig {
  return config;
}

const schema = z.strictObject({
  title: z.string(),
  author: z.string().optional(),
  info: z.string().optional(),
  canvas: z
    .strictObject({ width: z.number().positive(), height: z.number().positive() })
    .default({ width: 1920, height: 1080 }),
  transition: z.string().min(1).optional(),
  htmlAttrs: z.record(z.string(), z.string()).optional(),
  vite: z
    .custom<UserConfig>(
      (value) => typeof value === "object" && value !== null && !Array.isArray(value),
    )
    .optional(),
});

export async function loadDeck(dir: string, name?: string): Promise<ResolvedDeck> {
  const absolute = resolve(dir);
  const file = resolve(absolute, "deck.config.ts");
  try {
    const jiti = createJiti(import.meta.url, { moduleCache: false, fsCache: false });
    const config = schema.parse(await jiti.import(file, { default: true }));
    for (const key of Object.keys(config.htmlAttrs ?? {})) {
      if (!/^[A-Za-z_:][-A-Za-z0-9_:.]*$/.test(key))
        throw new Error(`Invalid htmlAttrs key ${key}`);
    }
    return { name: name ?? basename(absolute), dir: absolute, config };
  } catch (cause) {
    throw new Error(`${file}: ${cause instanceof Error ? cause.message : String(cause)}`, {
      cause,
    });
  }
}
