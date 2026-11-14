import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";
import matter from "gray-matter";
import remarkFrontmatter from "remark-frontmatter";
import { mergeConfig, type Plugin } from "vite";
import { componentsModule } from "./components";
import { loadDeck, type ResolvedDeck } from "./config";
import { deckHtml, entryModule } from "./entry";
import { notesHtml, removeNotes } from "./notes";
import { buildManifest, scanSlides } from "./slides";

const prefix = "virtual:react-decks/";

export function reactDecks(deck: ResolvedDeck): Plugin[] {
  let current = deck;
  const metadata = new Map<string, string>();
  const plugin: Plugin = {
    name: "react-decks",
    enforce: "pre",
    async config() {
      current = await loadDeck(deck.dir, deck.name);
      return mergeConfig(
        { root: deck.dir, publicDir: join(deck.dir, "public") },
        current.config.vite ?? {},
      );
    },
    resolveId(id) {
      if (id.startsWith(prefix) || id.startsWith(`/${prefix}`)) return `\0${id.replace(/^\//, "")}`;
      if (id === join(deck.dir, "index.html")) return id;
    },
    async load(id) {
      if (id === join(deck.dir, "index.html")) return deckHtml(current);
      if (id === `\0${prefix}entry`) return entryModule(current);
      if (id === `\0${prefix}components`) return componentsModule(deck.dir);
      if (id !== `\0${prefix}manifest` && id !== `\0${prefix}notes`) return;
      const slides = await scanSlides(current);
      if (id === `\0${prefix}manifest`) {
        for (const { meta } of slides) {
          const file = join(deck.dir, meta.file);
          metadata.set(file, JSON.stringify(matter(await readFile(file, "utf8")).data));
        }
        const loaders = slides
          .map(
            ({ meta }) =>
              `[${JSON.stringify(meta.id)}, () => import(${JSON.stringify(`/${meta.file}`)})]`,
          )
          .join(",");
        return `export const manifest = ${JSON.stringify(buildManifest(current, slides))};
export const frontmatter = Object.fromEntries(${JSON.stringify(slides.map((slide) => [slide.meta.id, slide.frontmatter]))});
export const slides = Object.fromEntries([${loaders}]);`;
      }
      const notes: [string, string][] = [];
      for (const { meta } of slides) {
        const file = join(deck.dir, meta.file);
        const html = await notesHtml(await readFile(file, "utf8"), file);
        if (html !== undefined) notes.push([meta.id, html]);
      }
      return `export const notes = Object.fromEntries(${JSON.stringify(notes)});`;
    },
    async configureServer(server) {
      const configFile = join(deck.dir, "deck.config.ts");
      let configSource = await readFile(configFile, "utf8");
      for (const { meta } of await scanSlides(current)) {
        const file = join(deck.dir, meta.file);
        metadata.set(file, JSON.stringify(matter(await readFile(file, "utf8")).data));
      }
      const invalidate = (name: string) => {
        const module = server.moduleGraph.getModuleById(`\0${prefix}${name}`);
        if (module) server.moduleGraph.invalidateModule(module);
      };
      const reload = (name: string) => {
        invalidate(name);
        invalidate("notes");
        server.ws.send({ type: "full-reload" });
      };
      const structural = (file: string) => {
        if (dirname(file) === join(deck.dir, "slides") && file.endsWith(".mdx")) {
          metadata.delete(file);
          reload("manifest");
        }
        if (dirname(file) === join(deck.dir, "components") && file.endsWith(".tsx"))
          reload("components");
      };
      server.watcher.on("add", structural);
      server.watcher.on("unlink", structural);
      server.watcher.on("change", async (file) => {
        if (file !== configFile) return;
        try {
          const source = await readFile(file, "utf8");
          if (source === configSource) return;
          configSource = source;
          const next = await loadDeck(deck.dir, deck.name);
          server.config.inlineConfig.plugins = [reactDecks(next), next.config.vite?.plugins ?? []];
          await server.restart();
        } catch (cause) {
          const error = cause instanceof Error ? cause : new Error(String(cause));
          server.config.logger.error(error.stack ?? error.message);
          server.ws.send({
            type: "error",
            err: { message: error.message, stack: error.stack ?? "" },
          });
        }
      });
      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split("?")[0];
        const base = server.config.base;
        if (path !== base && path !== `${base}index.html`) return next();
        try {
          const html = await server.transformIndexHtml(req.url ?? "/", deckHtml(current));
          res.setHeader("Content-Type", "text/html");
          res.end(html);
        } catch (error) {
          next(error);
        }
      });
    },
    async handleHotUpdate(context) {
      if (dirname(context.file) !== join(deck.dir, "slides") || !context.file.endsWith(".mdx"))
        return;
      const next = JSON.stringify(matter(await context.read()).data);
      const previous = metadata.get(context.file);
      metadata.set(context.file, next);
      const notes = context.server.moduleGraph.getModuleById(`\0${prefix}notes`);
      if (notes) context.server.moduleGraph.invalidateModule(notes);
      if (next === previous) return;
      const manifest = context.server.moduleGraph.getModuleById(`\0${prefix}manifest`);
      if (manifest) context.server.moduleGraph.invalidateModule(manifest);
      context.server.ws.send({ type: "full-reload" });
      return [];
    },
  };
  // MDX returns Rollup's Plugin type; Vite 8 uses Rolldown's narrower source-map type.
  const compiler = {
    ...mdx({ remarkPlugins: [remarkFrontmatter, removeNotes] }),
    enforce: "pre",
  } as Plugin;
  return [plugin, compiler, ...react({ include: /\.(mdx|jsx|tsx)$/ })];
}
