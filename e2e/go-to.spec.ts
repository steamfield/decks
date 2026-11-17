import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect } from "@playwright/test";
import { settled, test } from "./fixtures/deck.fixture";

test.beforeEach(async ({ editableDeck, page }) => {
  const file = join(editableDeck.dir, "slides/07-navigation.mdx");
  await writeFile(file, (await readFile(file, "utf8")).replace("hide: true", "hide: false"));
  await page.goto(`${editableDeck.url}#/2?clicks=2`);
  await expect(page.getByRole("heading", { name: "Three steps", exact: true })).toBeVisible();
});

test("go-to in either window moves both, while Escape keeps the frame and restores keys", async ({
  page,
}) => {
  const opened = page.waitForEvent("popup");
  await page.keyboard.press("p");
  const presenter = await opened;
  await expect(presenter.getByRole("region", { name: "Current slide" })).toBeVisible();
  await page.keyboard.press("g");
  await page.getByRole("searchbox", { name: "Slide", exact: true }).fill("COMPONENT");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#\/3$/);
  await expect(presenter).toHaveURL(/#\/presenter\/3$/);
  await expect(
    presenter
      .getByRole("region", { name: "Current slide" })
      .getByRole("heading", { name: "A deck component", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("g");
  await page.getByRole("searchbox", { name: "Slide", exact: true }).fill("Three");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/#\/3$/);
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/#\/4$/);
  await expect(presenter).toHaveURL(/#\/presenter\/4$/);
  await presenter.keyboard.press("g");
  await expect(presenter.getByRole("searchbox", { name: "Slide", exact: true })).toHaveValue("");
  await presenter.getByRole("searchbox", { name: "Slide", exact: true }).fill("Three");
  await presenter.keyboard.press("Enter");
  await expect(presenter).toHaveURL(/#\/presenter\/2$/);
  await expect(page).toHaveURL(/#\/2$/);
  await expect(page.getByRole("heading", { name: "Three steps", exact: true })).toBeVisible();
});

test("backdrop dismissal keeps the position and gives the keys back to the deck", async ({
  page,
}) => {
  await page.keyboard.press("g");
  const dialog = page.getByRole("dialog", { name: "Go to slide" });
  await dialog.click({ position: { x: 2, y: 2 } });
  await expect(dialog).toBeVisible();
  await page.mouse.click(1, 1);
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/#\/2\?clicks=2$/);
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/#\/2\?clicks=3$/);
});

test("arrow selection stays visible when the result list scrolls", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 300 });
  await page.keyboard.press("g");
  for (let index = 0; index < 5; index++) await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("option", { selected: true })).toHaveText("6 Jump to another slide.");
  await expect(page.getByRole("option", { selected: true })).toBeInViewport();
  await expect(page.getByRole("searchbox", { name: "Slide", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#\/6$/);
  await expect(
    page.getByRole("heading", { name: "Jump to another slide.", exact: true }),
  ).toBeVisible();
});

test("slide links move the presenter and Toc text in overview leaves selection to its tile", async ({
  page,
}) => {
  const opened = page.waitForEvent("popup");
  await page.keyboard.press("p");
  const presenter = await opened;
  await expect(presenter.getByRole("region", { name: "Current slide" })).toBeVisible();
  await page.keyboard.press("g");
  await page.getByRole("searchbox", { name: "Slide", exact: true }).fill("6");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Jump to another slide.", exact: true }),
  ).toBeVisible();
  await expect(presenter).toHaveURL(/#\/presenter\/6$/);
  await page.getByRole("link", { name: "Jump to the component slide." }).click();
  await expect(page).toHaveURL(/#\/3$/);
  await expect(presenter).toHaveURL(/#\/presenter\/3$/);
  await page.keyboard.press("o");
  const tile = page.getByRole("button", { name: "Slide 6: Jump to another slide." });
  await expect(tile).toBeVisible();
  const contents = tile.getByRole("list", { includeHidden: true });
  await expect(contents).toBeVisible();
  await expect(contents.getByRole("link", { includeHidden: true })).toHaveCount(0);
  await settled(page);
  const title = tile.getByText("Three steps", { exact: true });
  const bounds = await title.boundingBox();
  if (!bounds) throw new Error("Toc title has no visible bounds");
  // Inert content sends the physical click to the overview tile that contains it.
  await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await expect(page).toHaveURL(/#\/6$/);
  await expect(presenter).toHaveURL(/#\/presenter\/6$/);
  await expect(
    page.getByRole("heading", { name: "Jump to another slide.", exact: true }),
  ).toBeVisible();
});
