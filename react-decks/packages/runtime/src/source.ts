import type { DeckManifest } from "@react-decks/core";
import type { MDXComponents } from "mdx/types";
import type { ComponentType } from "react";

export type SlideLoader = () => Promise<{ default: ComponentType<{ components?: MDXComponents }> }>;

/** One note segment after rendering: the click it belongs to and its HTML. */
export interface NoteHtml {
  readonly click: number;
  readonly html: string;
}

export interface DeckSource {
  readonly manifest: DeckManifest;
  readonly slides: Readonly<Record<string, SlideLoader>>;
  readonly frontmatter: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
  readonly components: MDXComponents;
  /** Rendered notes keyed by slide id, one entry per segment. */
  readonly loadNotes?: () => Promise<Readonly<Record<string, readonly NoteHtml[]>>>;
}

export function createSlideModules(source: DeckSource) {
  return new Map(
    source.manifest.slides.map(({ id }) => {
      const loader = source.slides[id];
      if (!loader) throw new Error(`Missing slide loader for ${id}`);
      let promise: ReturnType<SlideLoader> | undefined;
      let resolved: Awaited<ReturnType<SlideLoader>> | undefined;
      const load = () => {
        promise ??= loader().then(
          (module) => {
            resolved = module;
            return module;
          },
          (error) => {
            promise = undefined;
            throw error;
          },
        );
        return promise;
      };
      return [
        id,
        {
          get resolved() {
            return resolved;
          },
          load,
        },
      ] as const;
    }),
  );
}
