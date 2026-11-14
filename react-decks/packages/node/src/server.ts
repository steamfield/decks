import { resolve } from "node:path";
import getPort, { portNumbers } from "get-port";
import { createServer, type InlineConfig, build as viteBuild } from "vite";
import type { ResolvedDeck } from "./config";
import { reactDecks } from "./plugins";

export interface DevServer {
  readonly url: string;
  close(): Promise<void>;
}

function config(deck: ResolvedDeck): InlineConfig {
  return {
    configFile: false,
    root: deck.dir,
    plugins: [reactDecks(deck), deck.config.vite?.plugins ?? []],
    resolve: { dedupe: ["react", "react-dom"] },
  };
}

export async function dev(
  deck: ResolvedDeck,
  options?: { port?: number; open?: boolean },
): Promise<DevServer> {
  const port = options?.port || (await getPort({ port: portNumbers(3030, 65535) }));
  const server = await createServer({
    ...config(deck),
    server: { port, open: options?.open ?? false },
  });
  try {
    await server.listen();
    const url = server.resolvedUrls?.local[0];
    if (!url) throw new Error(`${deck.dir}: Vite did not provide a local URL`);
    return { url, close: () => server.close() };
  } catch (error) {
    await server.close();
    throw error;
  }
}

export async function build(
  deck: ResolvedDeck,
  options: { outDir: string; base?: string },
): Promise<void> {
  await viteBuild({
    ...config(deck),
    base: options.base ?? "./",
    build: {
      outDir: resolve(options.outDir),
      rollupOptions: { input: resolve(deck.dir, "index.html") },
    },
  });
}
