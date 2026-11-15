import type { Browser } from "@playwright/test";
import { dev, loadDeck, type ResolvedDeck } from "@steamfield/decks/node";
import { settled } from "./deck-driver";

export async function deckServer(browser: Browser, dir: string | ResolvedDeck) {
  const server = await dev(typeof dir === "string" ? await loadDeck(dir) : dir, { port: 0 });
  const page = await browser.newPage().catch(async (cause: unknown) => {
    await server.close();
    throw cause;
  });
  try {
    await page.goto(server.url);
    // Import failures can prevent mount; they are a supported fixture input too.
    await page.waitForFunction(
      () =>
        window.__deck !== undefined || Boolean(document.querySelector("#deck-root")?.textContent),
    );
    if (await page.evaluate(() => Boolean(window.__deck))) await settled(page);
    return server;
  } catch (cause) {
    await server.close();
    throw cause;
  } finally {
    await page.close();
  }
}
