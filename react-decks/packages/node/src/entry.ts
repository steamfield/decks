import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ResolvedDeck } from "./config";

export function entryModule(deck: ResolvedDeck): string {
  return `import { mountDeck } from "@react-decks/runtime";
import { manifest, slides, frontmatter } from "virtual:react-decks/manifest";
import { components } from "virtual:react-decks/components";
${existsSync(join(deck.dir, "styles/index.css")) ? 'import "/styles/index.css";' : ""}
mountDeck({ manifest, slides, frontmatter, components,
  loadNotes: () => import("virtual:react-decks/notes").then(module => module.notes)
});`;
}

export function deckHtml(deck: ResolvedDeck): string {
  const escapeHtml = (value: string) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  const attrs = Object.entries(deck.config.htmlAttrs ?? {})
    .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
    .join(" ");
  return `<!doctype html><html ${attrs}><head><meta charset="utf-8">
<title>${escapeHtml(deck.config.title)}</title>
${deck.config.author === undefined ? "" : `<meta name="author" content="${escapeHtml(deck.config.author)}">`}
<meta name="decks:entry" content="${escapeHtml(deck.dir)}">
<meta name="decks:name" content="${escapeHtml(deck.name)}">
</head><body><div id="deck-root"></div><script type="module" src="/virtual:react-decks/entry"></script></body></html>`;
}
