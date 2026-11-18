import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build, type InlineConfig, normalizePath, type Plugin } from "vite";
import type { ResolvedDeck } from "../dev/config";
import { PUBLIC_SPECIFIERS } from "../dev/specifiers";

export async function buildRemotePage(
  deck: ResolvedDeck,
  token: string,
  config: (deck: ResolvedDeck, plugins: Plugin[]) => InlineConfig,
) {
  const html = normalizePath(join(deck.dir, "index.html"));
  const entry = "virtual:deck-remote";
  const title = deck.config.title
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  const plugin: Plugin = {
    name: "deck-remote-page",
    resolveId(id) {
      if (id === html) return html;
      if (id === entry || id === `/${entry}`) return `\0${entry}`;
    },
    load(id) {
      if (id === html)
        return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="data:,"><title>${title} remote</title></head>
<body><div id="remote"></div><script type="module" src="/${entry}"></script></body></html>`;
      if (id === `\0${entry}`)
        return `import { mountRemote } from "${PUBLIC_SPECIFIERS.runtime}";
mountRemote(document.getElementById("remote"));`;
    },
    transformIndexHtml: {
      order: "post",
      handler: (html) => html.replace(/(src|href)="(\/assets\/[^"]+)"/g, `$1="$2?token=${token}"`),
    },
  };
  const dir = await mkdtemp(join(tmpdir(), "deck-remote-"));
  const cleanup = () => rm(dir, { recursive: true, force: true });
  try {
    await build({
      ...config(deck, [plugin]),
      base: "/",
      publicDir: false,
      logLevel: "silent",
      build: {
        outDir: dir,
        assetsInlineLimit: () => true,
        rolldownOptions: { input: html, output: { codeSplitting: false } },
      },
    });
    return { dir, cleanup };
  } catch (error) {
    await cleanup();
    throw error;
  }
}
