import { cp, mkdir, mkdtemp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { test as base, type Page } from "@playwright/test";
import type { ResolvedDeck } from "@steamfield/decks/node";
import { deckDriver } from "./deck-driver";
import { deckServer } from "./deck-server";
import { motionClock } from "./motion-clock";

export { settled, startSettling } from "./deck-driver";
export { expectMonotone, noBlankFrame, record } from "./motion-recorder";
export { seekTransition } from "./transition-seek";

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

export const test = base.extend<
  {
    editableDeck: { dir: string; url: string };
    deck: ReturnType<typeof deckDriver>;
    motionClock: Awaited<ReturnType<typeof motionClock>>;
    cpuThrottle: undefined;
  },
  { deckServer: (dir: string | ResolvedDeck) => ReturnType<typeof deckServer> }
>({
  cpuThrottle: [
    async ({ page, context }, use) => {
      const rate = Number(process.env.DECK_E2E_CPU_RATE ?? 1);
      const throttle = async (page: Page) => {
        const session = await context.newCDPSession(page);
        await session.send("Emulation.setCPUThrottlingRate", { rate });
      };
      if (rate !== 1) await throttle(page);
      if (rate !== 1) context.on("page", throttle);
      try {
        await use(undefined);
      } finally {
        context.off("page", throttle);
      }
    },
    { auto: true },
  ],
  deckServer: [
    async ({ browser }, use) => {
      const servers: Awaited<ReturnType<typeof deckServer>>[] = [];
      try {
        await use(async (dir) => {
          const server = await deckServer(browser, dir);
          servers.push(server);
          return server;
        });
      } finally {
        for (const server of servers.reverse()) await server.close();
      }
    },
    { scope: "worker" },
  ],
  deck: async ({ page }, use) => use(deckDriver(page)),
  motionClock: async ({ page }, use) => use(await motionClock(page)),
  baseURL: async ({ browserName }, use) => {
    const url = process.env.DECK_E2E_URL;
    if (!url) throw new Error(`DECK_E2E_URL was not set for ${browserName} by global setup`);
    await use(url);
  },
  editableDeck: async ({ browserName, deckServer }, use) => {
    await mkdir(resolve(".tmp"), { recursive: true });
    const dir = await mkdtemp(resolve(`.tmp/e2e-edit-${browserName}-`));
    try {
      await cp(resolve("examples/basic"), dir, {
        recursive: true,
        filter: (file) => !file.startsWith(resolve("examples/basic/node_modules/.vite")),
      });
      const server = await deckServer(dir);
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
