import { cp, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { test as base } from "@playwright/test";
import { dev, loadDeck } from "@react-decks/node";
import { createLogger } from "vite";

export const test = base.extend<{
  errorDeck: (files?: Record<string, string>) => Promise<{
    dir: string;
    url: string;
    terminal: string[];
    put(file: string, text: string): Promise<void>;
  }>;
}>({
  errorDeck: async ({ browserName }, use) => {
    const cleanups: (() => Promise<void>)[] = [];
    try {
      await use(async (files = {}) => {
        await mkdir(resolve(".tmp"), { recursive: true });
        const dir = await mkdtemp(resolve(`.tmp/errors-${browserName}-`));
        cleanups.push(() => rm(dir, { recursive: true, force: true }));
        await cp(resolve("examples/basic"), dir, {
          recursive: true,
          filter: (file) => !file.includes("node_modules/.vite"),
        });
        const put = async (file: string, text: string) => {
          await mkdir(dirname(join(dir, file)), { recursive: true });
          await writeFile(join(dir, file), text);
        };
        for (const [file, text] of Object.entries(files)) await put(file, text);
        const terminal: string[] = [];
        const logger = createLogger("silent");
        logger.error = (message) => terminal.push(message);
        logger.info = (message) => terminal.push(message);
        const deck = await loadDeck(dir);
        const server = await dev(
          {
            ...deck,
            config: { ...deck.config, vite: { ...deck.config.vite, customLogger: logger } },
          },
          { port: 0 },
        );
        cleanups.push(() => server.close());
        return { dir, url: server.url, terminal, put };
      });
    } finally {
      for (const cleanup of cleanups.reverse()) await cleanup();
    }
  },
});
