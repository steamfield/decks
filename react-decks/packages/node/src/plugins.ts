import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";
import remarkFrontmatter from "remark-frontmatter";
import { mergeConfig, normalizePath, type Plugin, type ViteDevServer } from "vite";
import { componentsModule } from "./components";
import { loadDeck, type ResolvedDeck } from "./config";
import { deckHtml, entryModule } from "./entry";
import { removeNotes, renderNotes } from "./notes";
import { buildManifest, readSlide, scanSlidesWithCounts } from "./slides";

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
  let metadata = new Map<string, string>();
  let componentsCode: string | undefined;
  let motionNames: ReadonlyMap<string, string> = new Map();
  const totals = new Map<string, number>();
  const reload = (server: ViteDevServer, name: string) => {
    changedModules.add(name);
    if (reloadTimer) clearTimeout(reloadTimer);
    // A rename can deliver its add and unlink as separate watcher events.
    reloadTimer = setTimeout(() => {
      const graph = server.environments.client?.moduleGraph;
      changedModules.add("notes");
      for (const name of changedModules) {
        const module = graph?.getModuleById(`\0${prefix}${name}`);
        if (module) graph?.invalidateModule(module);
      }
      changedModules.clear();
      server.ws.send({ type: "full-reload" });
    }, 100);
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
      if (id === `\0${prefix}components`) return (await componentsModule(deck.dir)).code;
      if (id !== `\0${prefix}manifest` && id !== `\0${prefix}notes`) return;
      const scanned = await scanSlidesWithCounts(current, totals);
      const slides = scanned.slides;
      if (id === `\0${prefix}manifest`) {
        metadata = scanned.metadata;
        componentsCode = scanned.componentsCode;
        motionNames = scanned.motionNames;
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
      const structural = (path: string) => {
        const file = normalizePath(path);
        if (normalizePath(dirname(file)) === `${deckDir}/slides` && file.endsWith(".mdx")) {
          metadata.delete(file.slice(deckDir.length + 1));
          totals.delete(file.slice(deckDir.length + 1));
          reload(server, "manifest");
        }
        if (normalizePath(dirname(file)) === `${deckDir}/components` && file.endsWith(".tsx")) {
          reload(server, "components");
          reload(server, "manifest");
        }
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
      const scanned = await scanSlidesWithCounts(current, totals);
      metadata = scanned.metadata;
      componentsCode = scanned.componentsCode;
      motionNames = scanned.motionNames;
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
        parent === `${deckDir}/components` &&
        file.endsWith(".tsx") &&
        context.type === "update"
      ) {
        const scanned = await scanSlidesWithCounts(current, totals);
        motionNames = scanned.motionNames;
        if (
          scanned.componentsCode === componentsCode &&
          Array.from(scanned.metadata).every(([file, value]) => metadata.get(file) === value)
        )
          return;
        componentsCode = scanned.componentsCode;
        metadata = scanned.metadata;
        // A re-export edit can change how every slide's JSX names resolve.
        reload(context.server, "components");
        reload(context.server, "manifest");
        return [];
      }
      if (
        context.type !== "update" &&
        ((parent === `${deckDir}/slides` && file.endsWith(".mdx")) ||
          (parent === `${deckDir}/components` && file.endsWith(".tsx")))
      )
        return [];
      if (parent !== `${deckDir}/slides` || !file.endsWith(".mdx") || context.type !== "update")
        return;
      const key = file.slice(deckDir.length + 1);
      const { clicks: total, fingerprint: next } = readSlide(
        await context.read(),
        file,
        totals.get(key),
        motionNames,
      );
      const previous = metadata.get(key);
      metadata.set(key, next);
      totals.set(key, total);
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
