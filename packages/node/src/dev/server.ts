import { constants, existsSync } from "node:fs";
import { access, lstat, readdir, readFile, realpath, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve, sep } from "node:path";
import getPort, { portNumbers } from "get-port";
import {
  createLogger,
  createServer,
  defaultClientConditions,
  type InlineConfig,
  type Plugin,
  build as viteBuild,
} from "vite";
import { launchBrowser, openBuiltDeck, waitForCapture } from "./browser";
import type { ResolvedDeck } from "./config";
import { DeckError, displayPath } from "./errors";
import { createDeckPlugins, reactDecks } from "./plugins";
import { PUBLIC_SPECIFIERS } from "./specifiers";

export interface DevServer {
  readonly url: string;
  close(): Promise<void>;
}

function config(deck: ResolvedDeck, plugins: Plugin[] = reactDecks(deck)): InlineConfig {
  const require = createRequire(import.meta.url);
  const sourceMotion = import.meta.url.endsWith(".ts")
    ? require.resolve("@react-decks/motion")
    : undefined;
  const source = sourceMotion
    ? {
        runtime: createRequire(sourceMotion).resolve("@react-decks/runtime"),
        motion: sourceMotion,
        kit: require.resolve("@react-decks/kit"),
      }
    : undefined;
  return {
    configFile: false,
    root: deck.dir,
    plugins: [plugins, deck.config.vite?.plugins ?? []],
    resolve: {
      dedupe: ["react", "react-dom"],
      ...(source
        ? {
            conditions: ["@steamfield/decks/source", ...defaultClientConditions],
            // Vite's CSS @import resolver ignores resolve.conditions.
            alias: [
              { find: /^@steamfield\/decks$/, replacement: source.runtime },
              { find: /^@steamfield\/decks\/motion$/, replacement: source.motion },
              { find: /^@steamfield\/decks\/kit$/, replacement: source.kit },
              {
                find: /^@steamfield\/decks\/kit\/styles\.css$/,
                replacement: require.resolve("@react-decks/kit/styles.css"),
              },
            ],
          }
        : {}),
    },
    // There is no on-disk HTML entry for Vite to crawl before the first request.
    optimizeDeps: {
      // Generated imports also need scanning when the deck has no motion components.
      entries: ["components/*.tsx", ...(source ? Object.values(source) : [])],
      ...(source
        ? { include: Object.values(source) }
        : {
            // Prebundle every browser entry together so their shared chunks keep one runtime.
            include: [PUBLIC_SPECIFIERS.runtime, PUBLIC_SPECIFIERS.motion, "@steamfield/decks/kit"],
          }),
    },
  };
}

/** The lowest port `decks dev` tries when none is requested. */
export const firstDevPort = 3030;

export async function dev(
  deck: ResolvedDeck,
  options?: { port?: number; open?: boolean },
): Promise<DevServer> {
  const port = options?.port ?? (await getPort({ port: portNumbers(firstDevPort, 65535) }));
  const lifecycle = createDeckPlugins(deck);
  let server: Awaited<ReturnType<typeof createServer>> | undefined;
  try {
    server = await createServer({
      ...config(deck, [
        {
          name: "react-decks:server-lifecycle",
          enforce: "pre",
          configureServer: {
            order: "pre",
            handler(created) {
              server ??= created;
            },
          },
        },
        ...lifecycle.plugins,
      ]),
      server: { port, strictPort: options?.port !== undefined, open: options?.open ?? false },
    });
    await server.listen();
    const url = server.resolvedUrls?.local[0];
    if (!url) throw new Error(`${deck.dir}: Vite did not provide a local URL`);
    const running = server;
    return {
      url,
      close: async () => {
        await lifecycle.stop();
        await running.close();
      },
    };
  } catch (error) {
    await lifecycle.stop();
    await server?.close();
    if (error instanceof Error && error.message.includes(`Port ${port} is already in use`))
      throw new DeckError(
        `port ${port} is already in use. Stop what is using it or pass a different --port.`,
        undefined,
        undefined,
        { cause: error },
      );
    throw error;
  }
}

export async function build(
  deck: ResolvedDeck,
  options: { outDir: string; base?: string; ogImage?: boolean },
): Promise<void> {
  await guardOutput(deck, options.outDir);
  await viteBuild({
    ...config(deck),
    logLevel: "silent",
    customLogger: createLogger("silent"),
    base: options.base ?? deck.config.vite?.base ?? "./",
    build: {
      outDir: resolve(options.outDir),
      emptyOutDir: true,
      rolldownOptions: { input: resolve(deck.dir, "index.html") },
    },
  });
  if (options.ogImage !== false) {
    try {
      await generateOgImage(
        deck,
        resolve(options.outDir),
        options.base ?? deck.config.vite?.base ?? "./",
      );
    } catch (cause) {
      // The share image is optional: a deck that cannot be captured still builds. A bug is not
      // a capture failure, so only DeckErrors (Chromium missing, a slide error, a timeout) warn.
      if (!(cause instanceof DeckError)) throw cause;
      console.warn(`decks build: og.png skipped. ${cause.message.replace(/\s*\r?\n\s*/g, " ")}`);
    }
  }
}

async function generateOgImage(deck: ResolvedDeck, outDir: string, base: string): Promise<void> {
  if (existsSync(join(deck.dir, "public/og.png"))) return;
  const browser = await launchBrowser();
  try {
    const capture = await openBuiltDeck(browser, outDir, base, "?motion=instant#/1", {
      width: 1200,
      height: 630,
    });
    try {
      const scale = Math.min(1200 / deck.config.canvas.width, 630 / deck.config.canvas.height);
      const width = deck.config.canvas.width * scale;
      const height = deck.config.canvas.height * scale;
      // Keep the authored canvas aspect ratio, with its background filling the letterbox.
      await capture.page.evaluate(`(() => {
        const frame = document.getElementById("deck-frame");
        const slide = document.querySelector("[data-deck-active]");
        if (!frame || !slide) throw new Error("Slide 1 did not render for og.png");
        const background = getComputedStyle(slide).backgroundColor;
        if (background !== "rgba(0, 0, 0, 0)") document.body.style.backgroundColor = background;
        Object.assign(frame.parentElement.style, {
          width: "${width}px", height: "${height}px",
          left: "${(1200 - width) / 2}px", top: "${(630 - height) / 2}px"
        });
      })()`);
      await waitForCapture(capture.page);
      await capture.page.screenshot({ path: join(outDir, "og.png"), type: "png" });
    } finally {
      await capture.close();
    }
    if (deck.config.url && !existsSync(join(deck.dir, "public/og.jpg"))) {
      const url = deck.config.url;
      const image = new URL("og.png", url.endsWith("/") ? url : `${url}/`).href
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;");
      const htmlPath = join(outDir, "index.html");
      const html = await readFile(htmlPath, "utf8");
      await writeFile(
        htmlPath,
        html
          .replace("</head>", `<meta property="og:image" content="${image}"></head>`)
          .replace(
            '<meta name="twitter:card" content="summary">',
            '<meta name="twitter:card" content="summary_large_image">',
          ),
      );
    }
  } finally {
    await browser.close();
  }
}

async function canonicalPath(path: string): Promise<string> {
  try {
    return await realpath(path);
  } catch (cause) {
    if (!(cause instanceof Error) || !("code" in cause) || cause.code !== "ENOENT") throw cause;
    return join(await canonicalPath(dirname(path)), path.slice(dirname(path).length + 1));
  }
}

async function guardOutput(deck: ResolvedDeck, value: string) {
  const out = resolve(value);
  const label = displayPath(out);
  try {
    const link = await lstat(out).catch((cause: unknown) => {
      if (cause instanceof Error && "code" in cause && cause.code === "ENOENT") return undefined;
      throw cause;
    });
    if (link?.isSymbolicLink()) {
      await realpath(out).catch((cause: unknown) => {
        if (cause instanceof Error && "code" in cause && cause.code === "ENOENT")
          throw new DeckError(
            `--out ${label} is a dangling symlink. Remove it or choose a directory.`,
          );
        throw cause;
      });
    }
    const canonical = await canonicalPath(out);
    for (const protectedDir of [await realpath(deck.dir), await realpath(process.cwd())]) {
      const inside = relative(canonical, protectedDir);
      if (!inside || (inside !== ".." && !inside.startsWith(`..${sep}`) && !inside.startsWith(sep)))
        throw new DeckError(
          `--out ${label} is the deck directory (or contains it). build empties --out first, which would delete the deck. Choose another directory.`,
        );
    }
    let existing = out;
    while (
      !(await stat(existing).catch((cause: unknown) => {
        if (cause instanceof Error && "code" in cause && cause.code === "ENOENT") return undefined;
        throw cause;
      }))
    )
      existing = dirname(existing);
    const info = await stat(existing);
    if (!info.isDirectory()) throw new DeckError(`--out ${label} is a file. Choose a directory.`);
    await access(existing, constants.W_OK);
    if (existing === out && (await readdir(out)).length) {
      const html = await readFile(join(out, "index.html"), "utf8").catch((cause: unknown) => {
        if (cause instanceof Error && "code" in cause && cause.code === "ENOENT") return "";
        throw cause;
      });
      if (!/<meta\s+name=["']decks:name["']\s+content=["'][^"']*["']\s*\/?>/.test(html))
        throw new DeckError(
          `${label} is not empty and was not written by decks build. Empty it yourself or choose another --out.`,
        );
    }
  } catch (cause) {
    if (cause instanceof Error && "code" in cause && cause.code === "ENOTDIR")
      throw new DeckError(`--out ${label} is a file. Choose a directory.`);
    if (
      cause instanceof Error &&
      "code" in cause &&
      ["EACCES", "EPERM"].includes(String(cause.code))
    )
      throw new DeckError(`cannot write to ${label} (permission denied).`, undefined, undefined, {
        cause,
      });
    throw cause;
  }
}
