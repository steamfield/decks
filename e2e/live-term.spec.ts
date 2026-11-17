import { resolve } from "node:path";
import { expect } from "@playwright/test";
import { settled, test } from "./fixtures/deck.fixture";

test("without --live-term the fixture shows its recording in play and static views", async ({
  page,
  deckServer,
}) => {
  const server = await deckServer(resolve("examples/terminal"));
  await page.goto(server.url);
  await expect(page.getByLabel("Terminal recording", { exact: true })).toHaveText("$ ");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByLabel("Terminal recording", { exact: true })).toHaveText(
    "$ echo hello\nhello\n$ ls\n$ ",
  );
  await expect(page.getByRole("application", { name: "Live terminal" })).toHaveCount(0);
  const opened = page.waitForEvent("popup");
  await page.keyboard.press("p");
  const presenter = await opened;
  await expect(
    presenter.getByRole("region", { name: "Current slide" }).getByLabel("Terminal recording"),
  ).toBeVisible();
  await presenter.close();
  await page.keyboard.press("o");
  await expect(
    page
      .getByRole("button", { name: "Slide 1: Commands run inside the slide." })
      .getByLabel("Terminal recording"),
  ).toBeVisible();
  await page.goto(`${server.url}#/print`);
  await expect(page.getByLabel("Terminal recording", { exact: true })).toHaveText([
    "$ ",
    "$ echo hello\nhello\n$ ",
    "$ echo hello\nhello\n$ ls\n$ ",
    "$ echo hello\nhello\n$ ls\n$ echo third\nthird\n$ ",
  ]);
  await page.goto(`${server.url}?motion=instant#/1`);
  await settled(page);
  await expect(page.getByLabel("Terminal recording", { exact: true })).toBeVisible();
  await expect(page.getByRole("application", { name: "Live terminal" })).toHaveCount(0);
});
