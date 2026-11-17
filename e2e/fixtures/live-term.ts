import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { dev, loadDeck } from "@steamfield/decks/node";
import { test as base } from "./deck.fixture";

const hasZsh = spawnSync("zsh", ["--version"]).status === 0;

export const test = base.extend<{ liveServer: Awaited<ReturnType<typeof dev>> }>({
  liveServer: async ({ browser }, use) => {
    const server = await dev(await loadDeck(resolve("examples/terminal")), {
      port: 0,
      liveTerm: true,
    });
    try {
      // Match deckServer's warm-up: compile the lazy host before a throttled test starts.
      const page = await browser.newPage();
      try {
        await page.goto(server.url);
        await page.getByRole("application", { name: "Live terminal" }).waitFor();
      } finally {
        await page.close();
      }
      await use(server);
    } finally {
      await server.close();
    }
  },
});

test.beforeEach(() => {
  test.skip(!hasZsh, "Live terminal browser tests require zsh on PATH");
});
