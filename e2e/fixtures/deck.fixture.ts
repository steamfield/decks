import { cp, mkdir, mkdtemp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { test as base, type Page } from "@playwright/test";
import { dev, loadDeck } from "@steamfield/decks/node";

declare global {
  interface Window {
    e2eDocument?: string;
    e2eFrame?: boolean;
  }
}

export async function waitForSlideModules(page: Page) {
  await page.waitForFunction(
    () =>
      new Set(
        performance
          .getEntriesByType("resource")
          .map((entry) => new URL(entry.name).pathname)
          .filter((path) => /\/slides\/.*\.mdx$/.test(path)),
      ).size === 5,
  );
  await page.evaluate(async () => {
    const modules = new Set(
      performance
        .getEntriesByType("resource")
        .map((entry) => new URL(entry.name).pathname)
        .filter((path) => /\/slides\/.*\.mdx$/.test(path)),
    );
    await Promise.all(Array.from(modules, (path) => import(path)));
  });
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
