import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";
import { deckServer } from "./deck-server";

export default async function setup() {
  const dir = resolve("examples/basic");
  await rm(resolve(dir, "node_modules/.vite"), { recursive: true, force: true });
  const browser = await chromium.launch();
  const server = await deckServer(browser, dir);
  await browser.close();
  process.env.DECK_E2E_URL = server.url;
  return () => server.close();
}
