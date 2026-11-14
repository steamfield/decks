import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { expect, type Page } from "@playwright/test";
import { dev, loadDeck } from "@react-decks/node";
import { test as motionTest } from "./motion.fixture";

export const test = motionTest.extend<{
  freshDeck: { dir: string; url: string };
}>({
  freshDeck: async ({ browserName }, use) => {
    await mkdir(resolve(".tmp"), { recursive: true });
    const dir = await mkdtemp(resolve(`.tmp/code-${browserName}-`));
    await mkdir(join(dir, "node_modules/@react-decks"), { recursive: true });
    for (const name of ["runtime", "motion"])
      await symlink(resolve("packages", name), join(dir, "node_modules/@react-decks", name), "dir");
    await mkdir(join(dir, "slides"));
    await writeFile(
      join(dir, "deck.config.ts"),
      'export default { title: "Fresh code deck", vite: { cacheDir: "node_modules/.vite" } };',
    );
    await writeFile(
      join(dir, "slides/01-code.mdx"),
      '# Code works immediately.\n\n<Step at={1}>Framework step</Step>\n\n```ts {2|9} maxHeight=180 title="fresh.ts"\n' +
        Array.from({ length: 12 }, (_, i) => `const value${i + 1} = "line ${i + 1}";`).join("\n") +
        "\n```",
    );
    const server = await dev(await loadDeck(dir), { port: 0 });
    try {
      await use({ dir, url: server.url });
    } finally {
      await server.close();
      await rm(dir, { recursive: true, force: true });
    }
  },
});

export const lines = (page: Page) => page.locator("[data-deck-active] [data-line]");

export async function states(page: Page, active: number[]) {
  await expect
    .poll(() =>
      lines(page).evaluateAll((elements) =>
        elements
          .map((line) =>
            line.getAttribute("data-line-state") === "active"
              ? Number(line.getAttribute("data-line"))
              : 0,
          )
          .filter(Boolean),
      ),
    )
    .toEqual(active);
}
