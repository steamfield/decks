import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { test as base, type Page } from "@playwright/test";
import { dev, loadDeck } from "@react-decks/node";

export const test = base.extend<object, { kitURL: string }>({
  kitURL: [
    async ({ browserName: _browserName }, use) => {
      const server = await dev(await loadDeck(resolve("examples/tides-slide"), "tides-slide"), {
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
  baseURL: async ({ kitURL }, use) => {
    await use(kitURL);
  },
});

export async function settled(page: Page) {
  await page.evaluate(async () => {
    if (!window.__deck) throw new Error("Missing deck settle API");
    await window.__deck.settled();
    await document.fonts.ready;
  });
}

export async function kitFixture(files: Record<string, string>) {
  await mkdir(resolve(".tmp"), { recursive: true });
  const dir = await mkdtemp(resolve(".tmp/kit-"));
  for (const [file, content] of Object.entries({
    "package.json": '{"private":true,"type":"module"}',
    "deck.config.ts": 'export default { title: "Kit test" };',
    "setup.ts":
      'import { installTheme, resolveTheme } from "@react-decks/kit"; installTheme(resolveTheme());',
    "styles/index.css": '@import "@react-decks/kit/styles.css";',
    ...files,
  })) {
    await mkdir(dirname(join(dir, file)), { recursive: true });
    await writeFile(join(dir, file), content);
  }
  await mkdir(join(dir, "node_modules/@react-decks"), { recursive: true });
  for (const name of ["node", "runtime", "motion", "kit"])
    await symlink(
      resolve(`packages/${name}`),
      join(dir, `node_modules/@react-decks/${name}`),
      "dir",
    );
  try {
    const server = await dev(await loadDeck(dir), { port: 0 });
    return {
      ...server,
      dir,
      async close() {
        await server.close();
        await rm(dir, { recursive: true, force: true });
      },
    };
  } catch (error) {
    await rm(dir, { recursive: true, force: true });
    throw error;
  }
}
