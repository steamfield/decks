import { cp, mkdir, mkdtemp, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { expect, type Page } from "@playwright/test";
import { build, loadDeck } from "@react-decks/node";
import { preview } from "vite";
import { test } from "./fixtures/deck.fixture";

const builtTest = test.extend<{ builtUrl: string }>({
  builtUrl: async ({ browserName }, use) => {
    await mkdir(resolve(".tmp"), { recursive: true });
    const dir = await mkdtemp(resolve(`.tmp/sync-paths-${browserName}-`));
    try {
      await build(await loadDeck(resolve("examples/basic")), { outDir: join(dir, "one") });
      await cp(join(dir, "one"), join(dir, "two"), { recursive: true });
      const server = await preview({
        configFile: false,
        build: { outDir: dir },
        preview: { port: 0, open: false },
      });
      try {
        const url = server.resolvedUrls?.local[0];
        if (!url) throw new Error("Missing built-deck preview URL");
        await use(url);
      } finally {
        await server.close();
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  },
});

async function presenterFor(page: Page) {
  await expect(
    page.getByRole("heading", { name: "Basic fixture deck", exact: true }),
  ).toBeVisible();
  const popup = page.waitForEvent("popup");
  await page.keyboard.press("p");
  const presenter = await popup;
  await expect(presenter.getByRole("region", { name: "Current slide" })).toBeVisible();
  return presenter;
}

builtTest(
  "two decks on different paths of the same origin keep their two-window talks separate",
  async ({ context, builtUrl }) => {
    const one = await context.newPage();
    const two = await context.newPage();
    await one.goto(`${builtUrl}one/#/1`);
    const onePresenter = await presenterFor(one);
    await two.goto(`${builtUrl}two/#/1`);
    const twoPresenter = await presenterFor(two);
    await onePresenter.keyboard.press("ArrowDown");
    await expect(one).toHaveURL(`${builtUrl}one/#/2`);
    await twoPresenter.keyboard.press("End");
    await expect(two).toHaveURL(`${builtUrl}two/#/5`);
    await expect(one).toHaveURL(`${builtUrl}one/#/2`);
    await expect(onePresenter).toHaveURL(`${builtUrl}one/#/presenter/2`);
    await expect(twoPresenter).toHaveURL(`${builtUrl}two/#/presenter/5`);
  },
);

builtTest(
  "a built deck opened at the directory and index.html shares one talk",
  async ({ context, builtUrl }) => {
    const directory = await context.newPage();
    await directory.goto(`${builtUrl}one/#/2?clicks=1`);
    await expect(directory.getByRole("listitem")).toHaveText(["First point"]);
    const index = await context.newPage();
    await index.goto(`${builtUrl}one/index.html#/1`);
    await expect(index).toHaveURL(`${builtUrl}one/index.html#/2?clicks=1`);
    await index.keyboard.press("ArrowRight");
    await expect(directory).toHaveURL(`${builtUrl}one/#/2?clicks=2`);
    await expect(directory.getByRole("listitem")).toHaveText(["First point", "Second point"]);
  },
);
