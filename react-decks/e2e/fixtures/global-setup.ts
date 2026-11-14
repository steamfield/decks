import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { dev, loadDeck } from "@react-decks/node";

export default async function setup() {
  const dir = resolve("examples/basic");
  await rm(resolve(dir, "node_modules/.vite"), { recursive: true, force: true });
  const server = await dev(await loadDeck(dir), { port: 0 });
  process.env.DECK_E2E_URL = server.url;
  return () => server.close();
}
