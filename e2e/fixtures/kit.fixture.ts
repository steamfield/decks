import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { type DevServer, loadDeck } from "@steamfield/decks/node";

import { test as base } from "./deck.fixture";

export const test = base.extend<object, { kitURL: string }>({
  kitURL: [
    async ({ browserName: _browserName, deckServer }, use) => {
      await mkdir(resolve(".tmp"), { recursive: true });
      const dir = await mkdtemp(resolve(".tmp/tides-"));
      try {
        await cp(resolve("examples/tides-slide"), dir, {
          recursive: true,
          filter: (file) => !file.startsWith(resolve("examples/tides-slide/node_modules")),
        });
        await mkdir(join(dir, "node_modules/@steamfield"), { recursive: true });
        await symlink(
          resolve("packages/decks"),
          join(dir, "node_modules/@steamfield/decks"),
          "dir",
        );
        // Label the fixture's artwork without changing the example or the kit's DOM contract.
        for (const [file, from, to] of [
          ["InkRule.tsx", "<g ref={root}", '<g aria-label="Tide baseline" ref={root}'],
          ["TideDayStage.tsx", "key={d.x}", 'key={d.x} aria-label="Tide high"'],
          [
            "TideDayStage.tsx",
            "lead={copy.lead}",
            'leadContent={<span aria-label="Story caption">{copy.lead}</span>} lead={copy.lead}',
          ],
        ] as const) {
          const path = join(dir, "components", file);
          const source = await readFile(path, "utf8");
          if (!source.includes(from)) throw new Error(`${path}: missing ${from}`);
          await writeFile(path, source.replace(from, to));
        }
        // The Slidev baselines have no credit and no band for it.
        const deck = await loadDeck(dir, "tides-slide");
        const server = await deckServer({ ...deck, config: { ...deck.config, credit: false } });
        try {
          await use(server.url);
        } finally {
          await server.close();
        }
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    },
    { scope: "worker" },
  ],
  baseURL: async ({ kitURL }, use) => {
    await use(kitURL);
  },
});

export { settled } from "./deck-driver";

export async function kitFixture(
  start: (dir: string) => Promise<DevServer>,
  files: Record<string, string>,
) {
  await mkdir(resolve(".tmp"), { recursive: true });
  const dir = await mkdtemp(resolve(".tmp/kit-"));
  for (const [file, content] of Object.entries({
    "package.json": '{"private":true,"type":"module"}',
    "deck.config.ts": 'export default { title: "Kit test" };',
    "setup.ts":
      'import { installTheme, resolveTheme } from "@steamfield/decks/kit"; installTheme(resolveTheme());',
    "styles/index.css": '@import "@steamfield/decks/kit/styles.css";',
    ...files,
  })) {
    await mkdir(dirname(join(dir, file)), { recursive: true });
    await writeFile(join(dir, file), content);
  }
  await mkdir(join(dir, "node_modules/@steamfield"), { recursive: true });
  await symlink(resolve("packages/decks"), join(dir, "node_modules/@steamfield/decks"), "dir");
  try {
    const server = await start(dir);
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
