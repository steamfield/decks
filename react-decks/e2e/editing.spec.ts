import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect } from "@playwright/test";
import { test } from "./deck.fixture";

test("A slide body edit hot-updates without reloading or losing its click.", async ({
  page,
  editableDeck,
}) => {
  await page.goto(`${editableDeck.url}#/2?clicks=2`);
  await expect(page.getByRole("heading", { name: "Three steps", exact: true })).toBeVisible();
  await expect(page.getByRole("listitem")).toHaveText(["First point", "Second point"]);
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => {
    window.e2eDocument = "before edit";
  });
  const url = page.url();
  const file = join(editableDeck.dir, "slides/02-steps.mdx");
  const body = await readFile(file, "utf8");
  await writeFile(file, body.replace("<h1>Three steps</h1>", "<h1>Edited steps</h1>"));
  await expect(page.getByRole("heading", { name: "Edited steps", exact: true })).toBeVisible();
  await expect(page.getByRole("listitem")).toHaveText(["First point", "Second point"]);
  await expect(page).toHaveURL(url);
  expect(await page.evaluate(() => window.e2eDocument)).toBe("before edit");
});

test("A new component renders without restarting the server.", async ({ page, editableDeck }) => {
  await page.goto(`${editableDeck.url}#/3`);
  await expect(page.getByText("auto-provided", { exact: true })).toBeVisible();
  await writeFile(
    join(editableDeck.dir, "components/Added.tsx"),
    "export function Added() { return <p>Added while presenting</p>; }",
  );
  const slide = join(editableDeck.dir, "slides/03-component.mdx");
  await writeFile(slide, `${await readFile(slide, "utf8")}\n<Added />\n`);
  await expect(page.getByText("Added while presenting", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(`${editableDeck.url}#/3`);
});
