import { test as base, expect, type Page } from "@playwright/test";
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
  page: async ({ page, context }, use) => {
    const errors: string[] = [];
    function watch(observed: Page) {
      observed.on("pageerror", (error) => errors.push(error.message));
      observed.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
    }
    watch(page);
    context.on("page", watch);
    await use(page);
    context.off("page", watch);
    expect(errors).toEqual([]);
  },
});
