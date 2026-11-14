import { readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect } from "@playwright/test";
import { test, waitForSlideModules } from "./deck.fixture";

test("Adding a Step in a running deck makes the new inferred click reachable.", async ({
  page,
  editableDeck,
}) => {
  const file = join(editableDeck.dir, "slides/02-steps.mdx");
  const body = (await readFile(file, "utf8")).replace("clicks: 3\n", "");
  // Badge renders the marker until motion ships; the scanner reads the written Step name.
  const source = `${body}\nimport { Badge as Step } from "../components/Badge";\n\n<Step at={1} label="Counted marker" />\n\n<SlideStatus />\n`;
  await writeFile(file, source);
  await page.goto(`${editableDeck.url}#/2`);
  await expect(page.getByText("Slide 2 of 5, click 0 of 1, active", { exact: true })).toBeVisible();
  await waitForSlideModules(page);
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(`${editableDeck.url}#/2?clicks=1`);
  await page.evaluate(() => {
    window.e2eDocument = "before counted edit";
  });
  await writeFile(file, `${source}\n<Step at={2} label="New counted marker" />\n`);
  await expect(page.getByText("Slide 2 of 5, click 1 of 2, active", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.e2eDocument)).toBeUndefined();
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
  expect(await page.evaluate(() => window.e2eDocument)).toBe("before edit");
});

test("Adding a component file alone reloads the page and preserves its URL.", async ({
  page,
  editableDeck,
}) => {
  await page.goto(`${editableDeck.url}#/2?clicks=2`);
  await expect(page.getByRole("heading", { name: "Three steps", exact: true })).toBeVisible();
  await waitForSlideModules(page);
  await page.evaluate(() => {
    window.e2eDocument = "before addition";
  });
  await writeFile(
    join(editableDeck.dir, "components/Added.tsx"),
    "export function Added() { return <p>New component</p>; }",
  );
  await expect.poll(() => page.evaluate(() => window.e2eDocument)).toBeUndefined();
  await expect(page.getByRole("listitem")).toHaveText(["First point", "Second point"]);
  await expect(page).toHaveURL(`${editableDeck.url}#/2?clicks=2`);
});

test("A newly added component can be used after its file reloads the page.", async ({
  page,
  editableDeck,
}) => {
  await page.goto(`${editableDeck.url}#/3`);
  await expect(page.getByText("auto-provided", { exact: true })).toBeVisible();
  await waitForSlideModules(page);
  await page.evaluate(() => {
    window.e2eDocument = "before addition";
  });
  await writeFile(
    join(editableDeck.dir, "components/Added.tsx"),
    "export function Added() { return <p>Added while presenting</p>; }",
  );
  await expect.poll(() => page.evaluate(() => window.e2eDocument)).toBeUndefined();
  await expect(page.getByRole("heading", { name: "A deck component", exact: true })).toBeVisible();
  await expect(page).toHaveURL(`${editableDeck.url}#/3`);
  const slide = join(editableDeck.dir, "slides/03-component.mdx");
  await writeFile(slide, `${await readFile(slide, "utf8")}\n<Added />\n`);
  await expect(page.getByText("Added while presenting", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(`${editableDeck.url}#/3`);
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
  await writeFile(
    file,
    (await readFile(file, "utf8")).replace("title: Three steps", "title: Revised steps"),
  );
  await expect.poll(() => page.evaluate(() => window.e2eDocument)).toBeUndefined();
  await expect(page.getByRole("listitem")).toHaveText(["First point", "Second point"]);
  await expect(page).toHaveURL(`${editableDeck.url}#/2?clicks=2`);
});

for (const change of ["adding", "removing"]) {
  test(`${change} a slide reloads and keeps the position.`, async ({ page, editableDeck }) => {
    await page.goto(`${editableDeck.url}#/2?clicks=2`);
    await expect(page.getByRole("listitem")).toHaveText(["First point", "Second point"]);
    await waitForSlideModules(page);
    await page.evaluate(() => {
      window.e2eDocument = "before slide change";
    });
    if (change === "adding")
      await writeFile(join(editableDeck.dir, "slides/07-added.mdx"), "# Added slide");
    else await rm(join(editableDeck.dir, "slides/06-end.mdx"));
    await expect.poll(() => page.evaluate(() => window.e2eDocument)).toBeUndefined();
    await expect(page.getByRole("listitem")).toHaveText(["First point", "Second point"]);
    await expect(page).toHaveURL(`${editableDeck.url}#/2?clicks=2`);
    await page.keyboard.press("End");
    await expect(
      page.getByRole("heading", {
        name: change === "adding" ? "Added slide" : "One click",
        exact: true,
      }),
    ).toBeVisible();
  });
}

test("Renaming the last slide produces one reload and keeps that slide's URL.", async ({
  page,
  editableDeck,
}) => {
  await page.goto(`${editableDeck.url}#/5`);
  await expect(page.getByRole("heading", { name: "The end", exact: true })).toBeVisible();
  await waitForSlideModules(page);
  const documents: string[] = [];
  page.on("request", (request) => {
    if (request.isNavigationRequest()) documents.push(request.url());
  });
  await page.evaluate(() => {
    window.e2eDocument = "before rename";
  });
  await rename(
    join(editableDeck.dir, "slides/06-end.mdx"),
    join(editableDeck.dir, "slides/07-renamed.mdx"),
  );
  await expect.poll(() => page.evaluate(() => window.e2eDocument)).toBeUndefined();
  await expect(page.getByRole("heading", { name: "The end", exact: true })).toBeVisible();
  await expect(page).toHaveURL(`${editableDeck.url}#/5`);
  expect(documents).toEqual([editableDeck.url]);
});

test("Removing a component reloads and keeps the slide and click.", async ({
  page,
  editableDeck,
}) => {
  await page.goto(`${editableDeck.url}#/2?clicks=2`);
  await expect(page.getByRole("listitem")).toHaveText(["First point", "Second point"]);
  await waitForSlideModules(page);
  await page.evaluate(() => {
    window.e2eDocument = "before removal";
  });
  await rm(join(editableDeck.dir, "components/Badge.tsx"));
  await expect.poll(() => page.evaluate(() => window.e2eDocument)).toBeUndefined();
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
  await expect(page.getByText("Unable to render slide 06-end.", { exact: true })).toBeVisible();
  await writeFile(file, original);
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
  await writeFile(file, original.replace('"Basic fixture deck"', '"First title edit"'));
  await writeFile(file, original.replace('"Basic fixture deck"', '"Second title edit"'));
  await expect(page).toHaveTitle("Second title edit");
  await expect(page.getByRole("listitem")).toHaveText(["First point", "Second point"]);
  await expect(page).toHaveURL(`${editableDeck.url}#/2?clicks=2`);
});
