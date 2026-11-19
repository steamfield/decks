import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, type Page } from "@playwright/test";
import { test } from "./fixtures/motion.fixture";

// Templates whose parts must be drawn, and drawn on the board, at the edges of their input.

const active = (page: Page) => page.locator("[data-deck-active]");

/** Writes one slide per template into the editable deck, after installing the kit theme. */
async function writeSlides(dir: string, ...templates: string[]) {
  await writeFile(
    join(dir, "setup.ts"),
    'import {installTheme,resolveTheme} from "@steamfield/decks/kit"; installTheme(resolveTheme());',
  );
  const header = 'import {MotionTemplate} from "@steamfield/decks/kit";\n\n<h1>Fixture</h1>\n';
  for (const [index, template] of templates.entries())
    await writeFile(
      join(dir, `slides/0${index + 1}-${index ? "steps" : "cover"}.mdx`),
      header + template,
    );
}

test("bar-board keeps its longest value on the board when the top bar fills its track", async ({
  page,
  editableDeck,
}) => {
  // The top value sits on a tick, so its bar is the whole track; the affixes are the longest
  // allowed.
  const rows = [
    { label: "North pier", value: 1250000 },
    { label: "East ramp", value: 600000 },
  ];
  await writeSlides(
    editableDeck.dir,
    `<MotionTemplate template="bar-board" rows={${JSON.stringify(rows)}} source="Demo data" prefix="approx. " suffix=" ships/d" />`,
  );
  await page.goto(`${editableDeck.url}?motion=instant#/1`);
  const figure = active(page).getByRole("figure");
  const value = figure
    .getByRole("listitem", { name: /^North pier/ })
    .getByText("approx. 1,250,000 ships/d", { exact: true });
  await expect(value).toBeVisible();
  const [box, board] = [await value.boundingBox(), await figure.boundingBox()];
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
    (board?.x ?? 0) + (board?.width ?? 0),
  );
});

test("donut-build draws a segment smaller than the gap between segments", async ({
  page,
  editableDeck,
}) => {
  const segments = [
    { label: "Ferries", value: 995 },
    { label: "Kayaks", value: 5 },
  ];
  await writeSlides(
    editableDeck.dir,
    `<MotionTemplate template="donut-build" segments={${JSON.stringify(segments)}} />`,
  );
  await page.goto(`${editableDeck.url}?motion=instant#/1?clicks=1`);
  await expect(active(page).getByText("Kayaks", { exact: true })).toBeVisible();
  // The arcs are decorative parts of a hidden drawing; their tag is their only identity. Each
  // arc's drawn length is the first entry of its dash pattern.
  const drawn = await active(page)
    .locator("circle")
    .evaluateAll((circles) =>
      circles.slice(1).map((arc) => Number.parseFloat(getComputedStyle(arc).strokeDasharray)),
    );
  expect(drawn).toHaveLength(2);
  for (const length of drawn) expect(length).toBeGreaterThan(0);
});

test("title-reveal draws its accent rule under a subtitle and none without one", async ({
  page,
  editableDeck,
}) => {
  const title = 'title="The river changed course."';
  await writeSlides(
    editableDeck.dir,
    `<MotionTemplate template="title-reveal" ${title} subtitle="A field guide" />`,
    `<MotionTemplate template="title-reveal" ${title} />`,
  );
  // The rule is a decorative block hidden from assistive technology, found by its tag.
  const rule = (no: number) =>
    page.locator(`[data-deck-active][data-deck-slide="${no}"] figure div[aria-hidden=true]`);
  await page.goto(`${editableDeck.url}?motion=instant#/1`);
  await expect(active(page).getByText("A field guide", { exact: true })).toBeVisible();
  const heading = await active(page).getByRole("heading", { level: 2 }).boundingBox();
  const drawn = await rule(1).boundingBox();
  expect(drawn?.width).toBeGreaterThan(0);
  expect(drawn?.y).toBeGreaterThanOrEqual((heading?.y ?? 0) + (heading?.height ?? 0));
  await page.goto(`${editableDeck.url}?motion=instant#/2`);
  await expect(active(page).getByRole("heading", { level: 2 })).toBeVisible();
  await expect(rule(2)).toHaveCount(0);
});
