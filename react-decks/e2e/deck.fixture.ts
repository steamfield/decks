import { cp, mkdir, mkdtemp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { test as base } from "@playwright/test";
import { dev, loadDeck } from "@react-decks/node";

declare global {
  interface Window {
    e2eDocument?: string;
  }
}

export const test = base.extend<{ editableDeck: { dir: string; url: string } }>({
  baseURL: async ({ browserName }, use) => {
    const url = process.env.DECK_E2E_URL;
    if (!url) throw new Error(`DECK_E2E_URL was not set for ${browserName} by global setup`);
    await use(url);
  },
  editableDeck: async ({ browserName }, use) => {
    await mkdir(resolve(".tmp"), { recursive: true });
    const dir = await mkdtemp(resolve(`.tmp/e2e-edit-${browserName}-`));
    try {
      await cp(resolve("examples/basic"), dir, {
        recursive: true,
        filter: (file) => !file.startsWith(resolve("examples/basic/node_modules/.vite")),
      });
      const server = await dev(await loadDeck(dir), { port: 0 });
      try {
        await use({ dir, url: server.url });
      } finally {
        await server.close();
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  },
});
