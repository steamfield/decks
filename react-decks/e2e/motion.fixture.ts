import { test as base } from "@playwright/test";
import { dev, loadDeck } from "@react-decks/node";

export const test = base.extend<object, { motionURL: string }>({
  motionURL: [
    async ({ browserName }, use) => {
      const server = await dev(await loadDeck("examples/motion", `motion-${browserName}`), {
        port: 0,
      });
      try {
        await use(server.url);
      } finally {
        await server.close();
      }
    },
    { scope: "worker" },
  ],
  baseURL: async ({ motionURL }, use) => {
    await use(motionURL);
  },
  viewport: { width: 1920, height: 1080 },
});
