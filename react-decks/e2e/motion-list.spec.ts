import { cp, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { expect } from "@playwright/test";
import { dev, loadDeck } from "@react-decks/node";
import { test } from "./fixtures/motion.fixture";

test("The markdown Steps list reveals one top-level item on each click.", async ({ page }) => {
  await page.goto("/#/8");
  await expect(page.getByRole("heading", { name: "Steps", exact: true })).toBeVisible();
  const list = page.getByRole("list");
  await expect(list).toHaveCount(1);
  await expect(list.locator(":scope > li")).toHaveCount(4);
  for (let click = 0; click <= 4; click++) {
    await expect(list.getByRole("listitem")).toHaveCount(click);
    if (click < 4) await page.keyboard.press("ArrowRight");
  }
});

test("Four single-line JSX Steps children reveal without an explicit clicks total", async ({
  page,
}) => {
  await mkdir(resolve(".tmp"), { recursive: true });
  const dir = await mkdtemp(resolve(".tmp/gallery-steps-"));
  try {
    await cp(resolve("examples/motion"), dir, {
      recursive: true,
      filter: (file) => !file.startsWith(resolve("examples/motion/node_modules/.vite")),
    });
    await writeFile(
      join(dir, "slides/08-steps.mdx"),
      `<h1>Single-line children</h1>
<Steps from={1}>
<li>One</li>
<li>Two</li>
<li>Three</li>
<li>Four</li>
</Steps>`,
    );
    const server = await dev(await loadDeck(dir), { port: 0 });
    try {
      await page.goto(`${server.url}#/8`);
      await expect(page.getByRole("heading", { name: "Single-line children" })).toBeVisible();
      for (let click = 0; click <= 4; click++) {
        await expect(page.getByRole("listitem")).toHaveCount(click);
        if (click < 4) await page.keyboard.press("ArrowRight");
      }
      await expect(page).toHaveURL(/#\/8\?clicks=4$/);
      await page.keyboard.press("ArrowRight");
      await expect(page.getByRole("heading", { name: "Stagger", exact: true })).toBeVisible();
    } finally {
      await server.close();
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
