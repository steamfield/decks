import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";
import matter from "gray-matter";
import remarkFrontmatter from "remark-frontmatter";
import { glob } from "tinyglobby";
import { mergeConfig, normalizePath, type Plugin } from "vite";
import { componentsModule } from "./components";
import { loadDeck, type ResolvedDeck } from "./config";
import { deckHtml, entryModule } from "./entry";
import { removeNotes, renderNotes } from "./notes";
import { buildManifest, scanSlides } from "./slides";

const prefix = "virtual:react-decks/";

export function reactDecks(deck: ResolvedDeck): Plugin[] {
  let current = deck;
  let configSource: string | undefined;
  let restarting = Promise.resolve();
  let reloadTimer: ReturnType<typeof setTimeout> | undefined;
  const changedModules = new Set<string>();
  const deckDir = normalizePath(deck.dir);
  const htmlFile = normalizePath(join(deck.dir, "index.html"));
  const configFile = normalizePath(join(deck.dir, "deck.config.ts"));
  const metadata = new Map<string, string>();
  const seedMetadata = async () => {
    for (const file of await glob("slides/*.mdx", { cwd: deck.dir, absolute: true })) {
      metadata.set(normalizePath(file), JSON.stringify(matter(await readFile(file, "utf8")).data));
    }
  };
  const plugin: Plugin = {
    name: "react-decks",
    enforce: "pre",
    async config(inline, { command }) {
      if (command === "serve") configSource ??= await readFile(configFile, "utf8");
      return mergeConfig(
        mergeConfig(
          { root: deckDir, publicDir: normalizePath(join(deck.dir, "public")) },
          current.config.vite ?? {},
        ),
        {
          ...(inline.base === undefined ? {} : { base: inline.base }),
          ...(inline.server?.port === undefined ? {} : { server: { port: inline.server.port } }),
          ...(inline.build === undefined ? {} : { build: inline.build }),
        },
      );
    },
    resolveId(id) {
      if (id.startsWith(prefix) || id.startsWith(`/${prefix}`)) return `\0${id.replace(/^\//, "")}`;
      if (normalizePath(id) === htmlFile) return id;
    },
    async load(id) {
      if (normalizePath(id) === htmlFile) return deckHtml(current, false);
      if (id === `\0${prefix}entry`) return entryModule(current);
      if (id === `\0${prefix}components`) return componentsModule(deck.dir);
      if (id !== `\0${prefix}manifest` && id !== `\0${prefix}notes`) return;
      const slides = await scanSlides(current);
      if (id === `\0${prefix}manifest`) {
        await seedMetadata();
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
      const notes: [string, { click: number; html: string }[]][] = [];
      for (const { meta } of slides) {
        const file = normalizePath(join(deck.dir, meta.file));
        const segments = await renderNotes(await readFile(file, "utf8"), file);
        if (segments !== undefined) notes.push([meta.id, segments]);
      }
      return `export const notes = Object.fromEntries(${JSON.stringify(notes)});`;
    },
    async configureServer(server) {
      const invalidate = (name: string) => {
        const graph = server.environments.client?.moduleGraph;
        const module = graph?.getModuleById(`\0${prefix}${name}`);
        if (module) graph?.invalidateModule(module);
      };
      const reload = (name: string) => {
        changedModules.add(name);
        if (reloadTimer) clearTimeout(reloadTimer);
        // A rename can deliver its add and unlink as separate watcher events.
        reloadTimer = setTimeout(() => {
          for (const name of changedModules) invalidate(name);
          changedModules.clear();
          invalidate("notes");
          server.ws.send({ type: "full-reload" });
        }, 100);
      };
      const structural = (path: string) => {
        const file = normalizePath(path);
        if (normalizePath(dirname(file)) === `${deckDir}/slides` && file.endsWith(".mdx")) {
          metadata.delete(file);
          reload("manifest");
        }
        if (normalizePath(dirname(file)) === `${deckDir}/components` && file.endsWith(".tsx"))
          reload("components");
      };
      server.watcher.on("add", structural);
      server.watcher.on("unlink", structural);
      const configChanged = (file: string) => {
        if (normalizePath(file) !== configFile) return;
        restarting = restarting
          .then(async () => {
            if (server.httpServer && !server.httpServer.listening)
              await once(server.httpServer, "listening");
            // Re-read after restart too: a save can arrive while the watcher is closed.
            for (;;) {
              const source = await readFile(configFile, "utf8");
              if (source === configSource) return;
              configSource = source;
              current = await loadDeck(deck.dir, deck.name);
              server.config.inlineConfig.plugins = [plugins, current.config.vite?.plugins ?? []];
              await server.restart();
            }
          })
          .catch((cause: unknown) => {
            const error = cause instanceof Error ? cause : new Error(String(cause));
            server.config.logger.error(error.stack ?? error.message);
            server.ws.send({
              type: "error",
              err: { message: error.message, stack: error.stack ?? "" },
            });
          });
      };
      server.watcher.on("change", configChanged);
      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split("?")[0];
        const base = server.config.base;
        if (path !== base && path !== `${base}index.html`) return next();
        try {
          const html = await server.transformIndexHtml(req.url ?? "/", deckHtml(current, true));
          res.setHeader("Content-Type", "text/html");
          res.end(html);
        } catch (error) {
          next(error);
        }
      });
      await seedMetadata();
      configChanged(configFile);
    },
    closeBundle() {
      clearTimeout(reloadTimer);
      changedModules.clear();
    },
    async hotUpdate(context) {
      if (this.environment.name !== "client") return;
      const file = normalizePath(context.file);
      const parent = normalizePath(dirname(file));
      if (
        context.type !== "update" &&
        ((parent === `${deckDir}/slides` && file.endsWith(".mdx")) ||
          (parent === `${deckDir}/components` && file.endsWith(".tsx")))
      )
        return [];
      if (parent !== `${deckDir}/slides` || !file.endsWith(".mdx") || context.type !== "update")
        return;
      const next = JSON.stringify(matter(await context.read()).data);
      const previous = metadata.get(file);
      metadata.set(file, next);
      const graph = this.environment.moduleGraph;
      const notes = graph.getModuleById(`\0${prefix}notes`);
      if (notes) graph.invalidateModule(notes);
      if (next === previous) return;
      const manifest = graph.getModuleById(`\0${prefix}manifest`);
      if (manifest) graph.invalidateModule(manifest);
      this.environment.hot.send({ type: "full-reload" });
      return [];
    },
  };
  // MDX returns Rollup's Plugin type; Vite 8 uses Rolldown's narrower source-map type.
  const compiler = {
    ...mdx({ remarkPlugins: [remarkFrontmatter, removeNotes] }),
    enforce: "pre",
  } as Plugin;
  const plugins = [plugin, compiler, ...react({ include: /\.(mdx|jsx|tsx)$/ })];
  return plugins;
}
