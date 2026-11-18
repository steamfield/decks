import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ResolvedDeck } from "./config";
import { PUBLIC_SPECIFIERS } from "./specifiers";

/** `remote` is set by `decks dev --remote`; the window then reports to the remote relay. */
export function entryModule(deck: ResolvedDeck, _remote = false): string {
  return `${existsSync(join(deck.dir, "setup.ts")) ? 'import "/setup.ts";\n' : ""}import { mountDeck, Center, Cover, Section, TwoCol, ImageSide, Toc, Link } from "${PUBLIC_SPECIFIERS.runtime}";
import { Step, Steps, Stagger, TextReveal, Highlight, CountUp, Draw, Morph, CodeBlock, Mark, MagicMove, Camera, ShapeMorph } from "${PUBLIC_SPECIFIERS.motion}";
${existsSync(join(deck.dir, "styles/index.css")) ? 'import "/styles/index.css";' : ""}
Promise.all([
  import("virtual:react-decks/manifest"),
  import("virtual:react-decks/components"),
  import("virtual:react-decks/layers")
]).then(([{ manifest, slides, frontmatter }, { components }, { layers }]) => {
mountDeck({ manifest, slides, frontmatter, layers,
  components: { Step, Steps, Stagger, TextReveal, Highlight, CountUp, Draw, Morph, Mark, MagicMove, Camera, ShapeMorph, pre: CodeBlock, Center, Cover, Section, TwoCol, ImageSide, Toc, Link, ...components },
  loadNotes: () => import("virtual:react-decks/notes").then(module => module.notes)
});
}).catch(error => {
  reportError(error);
  document.getElementById("deck-root").textContent = "The deck failed to start: " + error.message;
});`;
}

/** The Decks mark (two slides on the diagonal) as a data URL, in the default theme's cyan and violet. */
const DECKS_ICON = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#8b5cf6" d="M12 4.75H27a3 3 0 0 1 3 3v8.5a3 3 0 0 1-3 3h-2.5v-3.5a4.5 4.5 0 0 0-4.5-4.5H9v-3.5a3 3 0 0 1 3-3Z"/><rect x="2" y="12.75" width="21" height="14.5" rx="3" fill="#06b6d4"/></svg>',
)}`;

export function deckHtml(deck: ResolvedDeck, dev: boolean): string {
  const escapeHtml = (value: string) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  const attrs = Object.entries(deck.config.htmlAttrs ?? {})
    .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
    .join(" ");
  const { title, author, info, url } = deck.config;
  // A deck's own icon wins; without one the tab shows the Decks mark.
  const icon = ["favicon.svg", "favicon.png", "favicon.ico"].find((file) =>
    existsSync(join(deck.dir, "public", file)),
  );
  // A link preview needs an absolute image address, so the image is only named with `url`.
  const image = ["og.png", "og.jpg"].find((file) => existsSync(join(deck.dir, "public", file)));
  const meta = (key: "name" | "property", name: string, content: string | undefined) =>
    content === undefined ? "" : `<meta ${key}="${name}" content="${escapeHtml(content)}">\n`;
  return `<!doctype html><html ${attrs}><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="${icon ? `/${icon}` : DECKS_ICON}">
<title>${escapeHtml(title)}</title>
${meta("name", "author", author)}${meta("name", "description", info)}${meta("property", "og:type", "website")}${meta("property", "og:title", title)}${meta("property", "og:description", info)}${meta("property", "og:url", url)}${meta("property", "og:image", url && image ? new URL(image, url.endsWith("/") ? url : `${url}/`).href : undefined)}${meta("name", "twitter:card", url && image ? "summary_large_image" : "summary")}${dev ? `<meta name="decks:entry" content="${escapeHtml(deck.dir)}">` : ""}
<meta name="decks:name" content="${escapeHtml(deck.name)}">
</head><body><div id="deck-root"></div><script type="module" src="/virtual:react-decks/entry"></script></body></html>`;
}
