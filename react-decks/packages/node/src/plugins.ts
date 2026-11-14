import { dirname, join } from "node:path";
import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";
import remarkFrontmatter from "remark-frontmatter";
import { mergeConfig, normalizePath, type Plugin, type ViteDevServer } from "vite";
import { codeBlocks } from "./code-blocks";
import { checkComponents } from "./component-check";
import { loadDeck, type ResolvedDeck } from "./config";
import { deckHtml, entryModule } from "./entry";
import { errorReporting } from "./error-reporting";
import { compileError, DeckError } from "./errors";
import { layersModule } from "./layers";
import { removeNotes, renderNotes } from "./notes";
import { readSource } from "./read-source";
import { buildManifest, readSlide, scanSlidesWithCounts } from "./slides";

const prefix = "virtual:react-decks/";

export function reactDecks(deck: ResolvedDeck): Plugin[] {
  return createDeckPlugins(deck).plugins;
}

export function createDeckPlugins(deck: ResolvedDeck) {
  let current = deck;
  let configSource: string | undefined;
  let restarting = Promise.resolve();
  let closing = false;
  let serving = false;
  let reportLogger = deck.config.vite?.customLogger;
  let reporting = errorReporting(reportLogger, deck.dir);
  const failures = new Map<string, DeckError>();
  const scanFailures = new Map<string, DeckError>();
  const compiled = new Set<string>();
  const failedLoads = new Set<string>();
  let configError: DeckError | undefined;
  let scan: ReturnType<typeof scanSlidesWithCounts> | undefined;
  let reloadTimer: ReturnType<typeof setTimeout> | undefined;
  const changedModules = new Set<string>();
  const deckDir = normalizePath(deck.dir);
  const htmlFile = normalizePath(join(deck.dir, "index.html"));
  const configFile = normalizePath(join(deck.dir, "deck.config.ts"));
  const readConfig = () => readSource(configFile);
  // At merge, pass true to readSource here once its afterChange argument is available.
  const readChangedSource = async (file: string) => {
    try {
      return await readSource(file);
    } catch (cause) {
      if (cause instanceof DeckError && file !== configFile) failures.set(file, cause);
      throw cause;
    }
  };
  let metadata = new Map<string, string>();
  let componentsCode: string | undefined;
  let motionNames: ReadonlyMap<string, string> = new Map();
  let componentNames: ReadonlySet<string> = new Set();
  const totals = new Map<string, number>();
  const scanDeck = () => {
    if (serving || !scan)
      scan = (async () => {
        try {
          const scanned = await scanSlidesWithCounts(current, totals);
          await layersModule(deck.dir);
          for (const [key] of scanFailures) reporting.fixed(key);
          scanFailures.clear();
          return scanned;
        } catch (cause) {
          if (cause instanceof DeckError) rememberScan(cause);
          throw cause;
        }
      })();
    return scan;
  };
  const rememberScan = (error: DeckError) => {
    scanFailures.set(error.file ?? error.message, error);
    if (serving) reporting.report(error);
  };
  const overlay = (error: DeckError) => ({
    message: error.message,
    id: error.file,
    loc: error.loc,
    stack: "",
  });
  const reload = (server: ViteDevServer, name: string) => {
    if (closing) return;
    changedModules.add(name);
    if (reloadTimer) clearTimeout(reloadTimer);
    // A rename can deliver its add and unlink as separate watcher events.
    reloadTimer = setTimeout(() => {
      if (closing) return;
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
      serving = command === "serve";
      if (serving && inline.customLogger && inline.customLogger !== reportLogger) {
        reportLogger = inline.customLogger;
        reporting = errorReporting(reportLogger, deck.dir);
      }
      if (command === "serve") configSource ??= await readConfig();
      return mergeConfig(
        mergeConfig(
          { root: deckDir, publicDir: normalizePath(join(deck.dir, "public")) },
          current.config.vite ?? {},
        ),
        {
          ...(inline.base === undefined ? {} : { base: inline.base }),
          customLogger: serving ? reporting.logger : inline.customLogger,
          server: {
            // Caught React errors already have a slide fallback or a compiler diagnostic.
            forwardConsole: { unhandledErrors: true, logLevels: ["warn"] },
            ...(inline.server?.port === undefined
              ? {}
              : { port: inline.server.port, strictPort: inline.server.strictPort }),
          },
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
      if (id === `\0${prefix}components`) return (await scanDeck()).componentsCode;
      if (id === `\0${prefix}layers`) return layersModule(deck.dir);
      if (id !== `\0${prefix}manifest` && id !== `\0${prefix}notes`) return;
      let scanned: Awaited<ReturnType<typeof scanSlidesWithCounts>>;
      try {
        scanned = await scanDeck();
      } catch (cause) {
        if (cause instanceof DeckError) {
          this.error(cause);
        }
        throw cause;
      }
      const failure = failures.values().next().value;
      if (failure) this.error(failure);
      const slides = scanned.slides;
      if (id === `\0${prefix}manifest`) {
        metadata = scanned.metadata;
        componentsCode = scanned.componentsCode;
        motionNames = scanned.motionNames;
        componentNames = scanned.componentNames;
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
        const segments = await renderNotes(
          await readSource(file),
          file,
          current.config.mdx?.remarkPlugins,
        ).catch((cause: unknown) => {
          if (cause instanceof DeckError) {
            if (serving) reporting.report(cause);
            this.error(cause);
          }
          throw cause;
        });
        if (segments !== undefined) notes.push([meta.id, segments]);
      }
      return `export const notes = Object.fromEntries(${JSON.stringify(notes)});`;
    },
    async configureServer(viteServer) {
      const server = viteServer;
      // A replacement config is not served until its new server is listening.
      const servedDeck = current;
      server.ws.on("connection", (_socket, _request) => {
        if (configError) server.ws.send({ type: "error", err: overlay(configError) });
      });
      const structural = (path: string) => {
        const file = normalizePath(path);
        if (file === `${deckDir}/setup.ts`) reload(server, "entry");
        if (normalizePath(dirname(file)) === `${deckDir}/slides` && file.endsWith(".mdx")) {
          metadata.delete(file.slice(deckDir.length + 1));
          totals.delete(file.slice(deckDir.length + 1));
          failures.delete(file);
          reporting.fixed(file);
          reload(server, "manifest");
        }
        if (normalizePath(dirname(file)) === `${deckDir}/components` && file.endsWith(".tsx")) {
          failures.delete(file);
          reporting.fixed(file);
          reload(server, "components");
          reload(server, "manifest");
        }
        if (file.startsWith(`${deckDir}/layers/`)) reload(server, "layers");
      };
      server.watcher.on("add", structural);
      server.watcher.on("unlink", structural);
      const configChanged = (file: string) => {
        if (closing || !server.httpServer?.listening || normalizePath(file) !== configFile) return;
        restarting = restarting
          .then(async () => {
            // Re-read after restart too: a save can arrive while the watcher is closed.
            for (;;) {
              if (closing) return;
              let source = await readChangedSource(configFile);
              if (closing) return;
              if (source === configSource && !configError) return;
              try {
                current = await loadDeck(deck.dir, deck.name);
              } catch (cause) {
                const latest = await readChangedSource(configFile);
                if (latest === source) throw cause;
                source = latest;
                current = await loadDeck(deck.dir, deck.name);
              }
              if (closing) return;
              plugins[1] = compiler();
              server.config.inlineConfig.plugins = [plugins, current.config.vite?.plugins ?? []];
              const previousConfig = server.config;
              await server.restart();
              // Vite logs creation failures and resolves restart without replacing the server.
              if (server.config === previousConfig) return;
              configSource = source;
              if (configError) {
                reporting.fixed(configFile, "deck.config.ts is valid again, restarting.");
                configError = undefined;
              }
            }
          })
          .catch((cause: unknown) => {
            if (closing) return;
            if (cause instanceof DeckError) {
              configError = cause;
              const graph = server.environments.client?.moduleGraph;
              const manifest = graph?.getModuleById(`\0${prefix}manifest`);
              if (manifest) graph?.invalidateModule(manifest);
              reporting.report(
                cause,
                "deck.config.ts is invalid, still serving the last valid config:",
              );
              server.ws.send({ type: "error", err: overlay(cause) });
              return;
            }
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
          const html = await server.transformIndexHtml(req.url ?? "/", deckHtml(servedDeck, true));
          res.setHeader("Content-Type", "text/html");
          res.end(html);
        } catch (error) {
          next(error);
        }
      });
      try {
        const scanned = await scanDeck();
        metadata = scanned.metadata;
        componentsCode = scanned.componentsCode;
        motionNames = scanned.motionNames;
        componentNames = scanned.componentNames;
      } catch (cause) {
        if (!(cause instanceof DeckError)) throw cause;
      }
      server.httpServer?.once("listening", () => configChanged(configFile));
    },
    closeBundle() {
      clearTimeout(reloadTimer);
      changedModules.clear();
    },
    async hotUpdate(context) {
      if (this.environment.name !== "client") return;
      try {
        if (configError) this.error(configError);
        const file = normalizePath(context.file);
        if (file === `${deckDir}/setup.ts`) {
          reload(context.server, "entry");
          return [];
        }
        const parent = normalizePath(dirname(file));
        if (file.startsWith(`${deckDir}/layers/`) && context.type !== "update") return [];
        if (
          parent === `${deckDir}/components` &&
          file.endsWith(".tsx") &&
          context.type === "update"
        ) {
          const wasScanFailed = scanFailures.size > 0;
          const scanned = await scanDeck();
          const wasFailed = failures.delete(file);
          reporting.fixed(file);
          componentNames = scanned.componentNames;
          motionNames = scanned.motionNames;
          if (
            !wasFailed &&
            !wasScanFailed &&
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
          await readChangedSource(file),
          file,
          totals.get(key),
          motionNames,
          current.config.mdx?.remarkPlugins,
        );
        const wasFailed = failures.delete(file);
        if (wasFailed) reporting.fixed(file);
        const previous = metadata.get(key);
        metadata.set(key, next);
        totals.set(key, total);
        const wasScanFailed = scanFailures.size > 0;
        if (wasScanFailed) await scanDeck();
        const graph = this.environment.moduleGraph;
        const notes = graph.getModuleById(`\0${prefix}notes`);
        if (notes) graph.invalidateModule(notes);
        const failedLoad = failedLoads.delete(file);
        if (next === previous && !wasFailed && !failedLoad && !wasScanFailed) return;
        const manifest = graph.getModuleById(`\0${prefix}manifest`);
        if (manifest) graph.invalidateModule(manifest);
        this.environment.hot.send({ type: "full-reload" });
        return [];
      } catch (cause) {
        if (!(cause instanceof DeckError)) throw cause;
        if (cause.file !== configFile) {
          rememberScan(cause);
          const graph = this.environment.moduleGraph;
          const manifest = graph.getModuleById(`\0${prefix}manifest`);
          if (manifest) graph.invalidateModule(manifest);
        }
        this.error(cause);
      }
    },
  };
  // MDX returns Rollup's Plugin type; Vite 8 uses Rolldown's narrower source-map type.
  const compiler = () => {
    const mdxPlugin = mdx({
      // Slides are `.mdx`. A `.md` file a deck imports (its text with `?raw`, say) is not a
      // slide and must not be compiled into a component.
      mdExtensions: [],
      remarkPlugins: [
        remarkFrontmatter,
        removeNotes,
        ...(current.config.mdx?.remarkPlugins ?? []),
        checkComponents(() => componentNames),
      ],
      rehypePlugins: [...(current.config.mdx?.rehypePlugins ?? []), codeBlocks],
    });
    return {
      ...mdxPlugin,
      async transform(source: string, id: string) {
        try {
          const result = await mdxPlugin.transform(source, id);
          if (result) {
            compiled.add(id);
            reporting.fixed(id);
          }
          return result;
        } catch (cause) {
          if (!compiled.has(id)) failedLoads.add(id);
          const error = compileError(cause, id);
          if (serving) reporting.report(error);
          this.error(error);
        }
      },
      enforce: "pre",
    } as Plugin;
  };
  const plugins = [plugin, compiler(), ...react({ include: /\.(mdx|jsx|tsx)$/ })];
  return {
    plugins,
    async stop() {
      closing = true;
      await restarting;
      clearTimeout(reloadTimer);
      changedModules.clear();
    },
  };
}
