import { join } from "node:path";
import type { RemoteDeck } from "@react-decks/core";
import type { ResolvedDeck } from "../dev/config";
import { DeckError } from "../dev/errors";
import { renderNotes } from "../mdx/notes";
import { readSource } from "../mdx/read-source";
import type { ScannedSlide } from "../mdx/slides";

export async function remotePayload(
  deck: ResolvedDeck,
  slides: readonly ScannedSlide[],
  report: (error: DeckError) => void,
): Promise<RemoteDeck> {
  return {
    title: deck.config.title,
    slides: await Promise.all(
      slides.map(async ({ meta }) => {
        const file = join(deck.dir, meta.file);
        const notes = await renderNotes(
          await readSource(file),
          file,
          deck.config.mdx?.remarkPlugins,
        ).catch((cause: unknown) => {
          if (!(cause instanceof DeckError)) throw cause;
          report(cause);
          return [];
        });
        return { id: meta.id, title: meta.title, clicks: meta.clicks, notes: notes ?? [] };
      }),
    ),
  };
}
