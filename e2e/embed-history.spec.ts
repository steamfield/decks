import { expect } from "@playwright/test";
import { boot, step, test } from "./fixtures/embed.fixture";

const deckFrame = (page: import("@playwright/test").Page) => {
  const frame = page.frames().find((candidate) => candidate.parentFrame());
  if (!frame) throw new Error("Missing iframe");
  return frame;
};

test("A deck in the site player moves between slides without adding to the host's history", async ({
  page,
  embedURL,
}) => {
  await boot(page, embedURL);
  const before = await page.evaluate(() => history.length);
  await step(page, "nextSlide", 1);
  await step(page, "go", 2, { slide: 4, beat: 0 });
  await step(page, "prevSlide", 3);
  expect(await deckFrame(page).evaluate(() => location.hash)).toBe("#/3");
  expect(await page.evaluate(() => history.length)).toBe(before);
});

test("A deck framed with ?embedded moves between slides without adding to the host's history", async ({
  page,
  embedURL,
}) => {
  await page.goto(
    `${embedURL}embed-host.html?src=${encodeURIComponent("./index.html?embedded=1#/1")}`,
  );
  const deck = deckFrame(page);
  await expect(deck.getByRole("heading", { name: "Embed cover" })).toBeVisible();
  const before = await page.evaluate(() => history.length);
  await deck.getByRole("heading", { name: "Embed cover" }).click();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => deck.evaluate(() => location.hash)).toBe("#/2");
  expect(await page.evaluate(() => history.length)).toBe(before);
});
