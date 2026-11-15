import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect } from "@playwright/test";
import { test, waitForSlideModules } from "./fixtures/deck.fixture";

test("Adding a Step in a running deck makes the new inferred click reachable.", async ({
  page,
  editableDeck,
}) => {
  const file = join(editableDeck.dir, "slides/02-steps.mdx");
  const body = (await readFile(file, "utf8")).replace("clicks: 3\n", "");
  const source = `${body}\nimport { Step } from "@steamfield/decks/motion";\n\n<Step at={1}>Counted marker</Step>\n\n<SlideStatus />\n`;
  await writeFile(file, source);
  await page.goto(`${editableDeck.url}#/2`);
  await expect(page.getByText("Slide 2 of 5, click 0 of 1, active", { exact: true })).toBeVisible();
  await waitForSlideModules(page);
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(`${editableDeck.url}#/2?clicks=1`);
  await page.evaluate(() => {
    window.e2eDocument = "before counted edit";
  });
  const loaded = page.waitForEvent("load");
  await writeFile(file, `${source}\n<Step at={2}>New counted marker</Step>\n`);
  await loaded;
  await expect(page.getByText("Slide 2 of 5, click 1 of 2, active", { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.e2eDocument)).toBeUndefined();
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(`${editableDeck.url}#/2?clicks=2`);
  await expect(page.getByRole("listitem")).toHaveText(["First point", "Second point"]);
});

test("A slide body edit hot-updates without reloading or losing its click.", async ({
  page,
  editableDeck,
}) => {
  await page.goto(`${editableDeck.url}#/2?clicks=2`);
  await expect(page.getByRole("heading", { name: "Three steps", exact: true })).toBeVisible();
  await expect(page.getByRole("listitem")).toHaveText(["First point", "Second point"]);
  await waitForSlideModules(page);
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
  await expect.poll(() => page.evaluate(() => window.e2eDocument)).toBe("before edit");
});

test("A frontmatter edit reloads while keeping slide two at click two.", async ({
  page,
  editableDeck,
}) => {
  await page.goto(`${editableDeck.url}#/2?clicks=2`);
  await expect(page.getByRole("listitem")).toHaveText(["First point", "Second point"]);
  await waitForSlideModules(page);
  await page.evaluate(() => {
    window.e2eDocument = "before frontmatter";
  });
  const file = join(editableDeck.dir, "slides/02-steps.mdx");
  const loaded = page.waitForEvent("load");
  await writeFile(
    file,
    (await readFile(file, "utf8")).replace("title: Three steps", "title: Revised steps"),
  );
  await loaded;
  await expect(page.getByRole("listitem")).toHaveText(["First point", "Second point"]);
  await expect(page).toHaveURL(`${editableDeck.url}#/2?clicks=2`);
});

test("A slide compile failure leaves its neighbour working and recovers after a fix.", async ({
  page,
  editableDeck,
}) => {
  const file = join(editableDeck.dir, "slides/06-end.mdx");
  const original = await readFile(file, "utf8");
  await writeFile(file, `${original}\n<Broken`);
  await page.goto(`${editableDeck.url}#/4`);
  await expect(page.getByRole("heading", { name: "One click", exact: true })).toBeVisible();
  await page.keyboard.press("End");
  await expect(
    page.getByText("Slide 06-end failed to load. See the terminal or the error overlay.", {
      exact: true,
    }),
  ).toBeVisible();
  const recovered = page.waitForEvent("load");
  await writeFile(file, original);
  await recovered;
  await expect(page.getByRole("heading", { name: "The end", exact: true })).toBeVisible();
  await page.keyboard.press("Home");
  await expect(
    page.getByRole("heading", { name: "Basic fixture deck", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("End");
  await expect(page.getByRole("heading", { name: "The end", exact: true })).toBeVisible();
  await expect(page).toHaveURL(`${editableDeck.url}#/5`);
});

test("Config title edits restart the server and recover the same slide and click.", async ({
  page,
  editableDeck,
}) => {
  await page.goto(`${editableDeck.url}#/2?clicks=2`);
  await expect(page.getByRole("listitem")).toHaveText(["First point", "Second point"]);
  await waitForSlideModules(page);
  const file = join(editableDeck.dir, "deck.config.ts");
  const original = await readFile(file, "utf8");
  await writeFile(file, original.replace('"Basic fixture deck"', '"Edited title"'));
  // A config edit restarts the dev server, which takes a while on a loaded machine.
  await expect(page).toHaveTitle("Edited title", { timeout: 30_000 });
  await expect(page.getByRole("listitem")).toHaveText(["First point", "Second point"]);
  await expect(page).toHaveURL(`${editableDeck.url}#/2?clicks=2`);
});
