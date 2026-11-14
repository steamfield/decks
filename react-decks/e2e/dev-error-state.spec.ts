import { readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { expect } from "@playwright/test";
import { test } from "./fixtures/error.fixture";

test("Invalid frontmatter survives reload in the overlay and recovers on save.", async ({
  page,
  errorDeck,
}) => {
  const app = await errorDeck();
  await page.goto(app.url);
  await expect(
    page.getByRole("heading", { name: "Basic fixture deck", exact: true }),
  ).toBeVisible();
  const original = await readFile(join(app.dir, "slides/01-cover.mdx"), "utf8");
  const message = `${relative(process.cwd(), app.dir)}/slides/01-cover.mdx: frontmatter clicks must be a whole number 0 or greater, got "two".`;
  await app.put("slides/01-cover.mdx", `---\nclicks: "two"\n---\n# Broken`);
  await expect(page.getByText(message, { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText(message, { exact: true })).toBeVisible();
  await test.info().attach("qa-frontmatter", {
    body: `Terminal:\n${app.terminal.join("\n")}\nBrowser:\n${message}`,
    contentType: "text/plain",
  });
  await app.put("slides/01-cover.mdx", original);
  await expect(
    page.getByRole("heading", { name: "Basic fixture deck", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(message, { exact: true })).not.toBeVisible();
  expect(app.terminal.filter((line) => line === message)).toHaveLength(1);
  expect(app.terminal).toContain(`${relative(process.cwd(), app.dir)}/slides/01-cover.mdx: fixed`);
});

test("An invalid config retains the previous deck and resends its overlay after reload until fixed.", async ({
  page,
  errorDeck,
}) => {
  const app = await errorDeck();
  await page.goto(`${app.url}#/2?clicks=2`);
  await expect(page.getByRole("heading", { name: "Three steps", exact: true })).toBeVisible();
  const original = await readFile(join(app.dir, "deck.config.ts"), "utf8");
  const message = `${relative(process.cwd(), app.dir)}/deck.config.ts: title must be a string, got 42.`;
  await app.put("deck.config.ts", "export default {title:42}");
  await expect(page.getByText(message, { exact: true })).toBeVisible();
  await expect(page).toHaveTitle("Basic fixture deck");
  await page.reload();
  await expect(page.getByText(message, { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Three steps", exact: true })).toBeVisible();
  await app.put("deck.config.ts", original);
  await expect(page.getByRole("heading", { name: "Three steps", exact: true })).toBeVisible();
  await expect(page.getByText(message, { exact: true })).not.toBeVisible();
  await expect(page).toHaveURL(`${app.url}#/2?clicks=2`);
});

test("An MDX edit keeps the last good content under the overlay and recovers without reload.", async ({
  page,
  errorDeck,
}) => {
  const app = await errorDeck();
  await page.goto(app.url);
  await expect(
    page.getByRole("heading", { name: "Basic fixture deck", exact: true }),
  ).toBeVisible();
  const original = await readFile(join(app.dir, "slides/01-cover.mdx"), "utf8");
  await page.evaluate(() => {
    window.e2eDocument = "last good slide";
  });
  await app.put("slides/01-cover.mdx", `${original}\n<div`);
  await expect(page.getByText(/Unexpected end of file in name/)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Basic fixture deck", exact: true }),
  ).toBeVisible();
  await app.put(
    "slides/01-cover.mdx",
    original.replace("Basic fixture deck</h1>", "Saved slide</h1>"),
  );
  await expect(page.getByRole("heading", { name: "Saved slide", exact: true })).toBeVisible();
  await expect(page.getByText(/Unexpected end of file in name/)).not.toBeVisible();
  expect(await page.evaluate(() => window.e2eDocument)).toBe("last good slide");
});

test("An undefined component is reported in dev with its source position.", async ({
  page,
  errorDeck,
}) => {
  const app = await errorDeck({ "slides/01-cover.mdx": "# Slide\n\n<Nonexistent />" });
  await page.goto(app.url);
  const message = `${relative(process.cwd(), app.dir)}/slides/01-cover.mdx:3:1: <Nonexistent> is not defined. Export it from a file in components/ or import it in the slide.`;
  await expect(page.getByText(message, { exact: true })).toBeVisible();
  await test.info().attach("qa-undefined", {
    body: `Terminal:\n${app.terminal.join("\n")}\nBrowser:\n${message}`,
    contentType: "text/plain",
  });
  await app.put("slides/01-cover.mdx", "# Fixed component name");
  await expect(
    page.getByRole("heading", { name: "Fixed component name", exact: true }),
  ).toBeVisible();
});
