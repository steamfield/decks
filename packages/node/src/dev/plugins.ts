import { isIP } from "node:net";
import { dirname, join } from "node:path";
import mdx from "@mdx-js/rollup";
import { REMOTE_INTENT, REMOTE_POSITION, type RemoteIntent } from "@react-decks/core";
import react from "@vitejs/plugin-react";
import remarkFrontmatter from "remark-frontmatter";
import { mergeConfig, normalizePath, type Plugin, type ViteDevServer } from "vite";
import { codeBlocks } from "../mdx/code-blocks";
import { checkComponents } from "../mdx/component-check";
import { removeNotes } from "../mdx/notes";
import { readSource } from "../mdx/read-source";
import { readSlide, scanSlidesWithCounts } from "../mdx/slides";
import type { createRelay } from "../remote/relay";
import { positionMessage } from "../remote/remote-messages";
import { remotePayload } from "../remote/remote-payload";
import { loadDeck, type ResolvedDeck } from "./config";
import { deckHtml, entryModule } from "./entry";
import { errorReporting } from "./error-reporting";
import { compileError, DeckError } from "./errors";
import { layersModule } from "./layers";

import { manifestModule, notesModule } from "./virtual-modules";

const prefix = "virtual:react-decks/";

export function reactDecks(deck: ResolvedDeck): Plugin[] {
  return createDeckPlugins(deck).plugins;
}

export function createDeckPlugins(
  deck: ResolvedDeck,
  options: { remote?: boolean; relay?: ReturnType<typeof createRelay> } = {},
) {
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
  const configErrors = new WeakMap<ViteDevServer["config"], DeckError>();
  let scan: ReturnType<typeof scanSlidesWithCounts> | undefined;
  let reloadTimer: ReturnType<typeof setTimeout> | undefined;
  const changedModules = new Set<string>();
  const deckDir = normalizePath(deck.dir);
  const htmlFile = normalizePath(join(deck.dir, "index.html"));
  const configFile = normalizePath(join(deck.dir, "deck.config.ts"));
  const readConfig = () => readSource(configFile);
  // A read that follows a change event may catch the file mid-write, so it retries an empty read.
  const readChangedSource = async (file: string) => {
    try {
      return await readSource(file, true);
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
          await layersModule(deck.dir, deck.config.credit);
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
  let payloadRevision = 0;
  const refreshRemote = async (
    server: ViteDevServer,
    scanned?: Awaited<ReturnType<typeof scanDeck>>,
  ) => {
    const relay = options.relay;
    if (!relay) return;
    const revision = ++payloadRevision;
    const deck = current;
    const http = server.httpServer;
    try {
      const payload = await remotePayload(
        deck,
        (scanned ?? (await scanDeck())).slides,
        reporting.report,
      );
      const publish = () => {
        if (!closing && revision === payloadRevision) relay.updateDeck(payload);
      };
      // A later configureServer hook can still reject a replacement deck.
      if (http?.listening) publish();
      else http?.once("listening", publish);
    } catch (cause) {
      if (cause instanceof DeckError) reporting.report(cause);
      else
        server.config.logger.error(
          cause instanceof Error ? (cause.stack ?? cause.message) : String(cause),
        );
    }
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
      if (changedModules.has("manifest")) void refreshRemote(server);
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
      const host = current.config.vite?.server?.host;
      if (options.remote && host !== undefined && host !== "127.0.0.1")
        reporting.logger.warn(
          `Remote presenter: overriding dev server host "${host}" with loopback.`,
        );
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
            ...(options.remote ? { host: "127.0.0.1" } : {}),
            forwardConsole: { unhandledErrors: true, logLevels: ["warn"] },
            ...(inline.server?.port === undefined
              ? {}
              : { port: inline.server.port, strictPort: inline.server.strictPort }),
          },
          ...(inline.build === undefined ? {} : { build: inline.build }),
        },
      );
    },
    configResolved(config) {
      if (!options.remote) return;
      const { host, hmr, ws, port } = config.server;
      let setting: string | undefined;
      if (
        host === true ||
        (typeof host === "string" &&
          !(
            host === "localhost" ||
            host === "::1" ||
            (isIP(host) === 4 && host.startsWith("127."))
          ))
      )
        setting = "host";
      else if (hmr === false) setting = "hmr";
      else if (ws === false) setting = "ws";
      else if (ws?.server) setting = "ws.server";
      else if (ws?.port && ws.port !== port) setting = "ws.port";
      if (setting)
        throw new DeckError(
          `vite.server.${setting} is incompatible with --remote. Use the dev server's loopback HMR transport.`,
          configFile,
        );
    },
    resolveId(id) {
      if (id.startsWith(prefix) || id.startsWith(`/${prefix}`)) return `\0${id.replace(/^\//, "")}`;
      if (normalizePath(id) === htmlFile) return id;
    },
    async load(id) {
      if (normalizePath(id) === htmlFile) return deckHtml(current, false);
      if (id === `\0${prefix}entry`) return entryModule(current, options.remote === true);
      if (id === `\0${prefix}components`) return (await scanDeck()).componentsCode;
      if (id === `\0${prefix}layers`) return layersModule(deck.dir, deck.config.credit);
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
        return manifestModule(current, slides);
      }
      return notesModule(
        () => current,
        slides,
        (cause: unknown) => {
          if (cause instanceof DeckError) {
            if (serving) reporting.report(cause);
            this.error(cause);
          }
          throw cause;
        },
      );
    },
    async configureServer(viteServer) {
      const server = viteServer;
      // A replacement config is not served until its new server is listening.
      const servedDeck = current;
      // Vite replaces the server behind this proxy during restart; errors belong to its config.
      const servedConfig = server.config;
      const relay = options.relay;
      if (relay) {
        const windows = new WeakMap<object, (intent: RemoteIntent) => void>();
        server.ws.on(REMOTE_POSITION, (message: unknown, client) => {
          const parsed = positionMessage.safeParse(message);
          if (!parsed.success) {
            server.config.logger.warn(`Remote presenter: malformed ${REMOTE_POSITION}`);
            return;
          }
          let window = windows.get(client.socket);
          if (!window) {
            const send = (intent: RemoteIntent) => client.send(REMOTE_INTENT, intent);
            windows.set(client.socket, send);
            client.socket.once("close", () => relay.disconnect(send));
            window = send;
          }
          relay.report(window, parsed.data);
        });
      }
      server.ws.on("connection", (_socket, _request) => {
        const configError = configErrors.get(servedConfig);
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
              if (source === configSource && !configErrors.has(server.config)) return;
              const previousDeck = current;
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
              if (server.config === previousConfig) {
                current = previousDeck;
                return;
              }
              configSource = source;
              if (configErrors.delete(previousConfig)) {
                reporting.fixed(configFile, "deck.config.ts is valid again, restarting.");
              }
            }
          })
          .catch((cause: unknown) => {
            if (closing) return;
            if (cause instanceof DeckError) {
              configErrors.set(server.config, cause);
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
        await refreshRemote(server, scanned);
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
        const configError = configErrors.get(context.server.config);
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
        const scanned = wasScanFailed ? await scanDeck() : undefined;
        void refreshRemote(context.server, scanned);
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
