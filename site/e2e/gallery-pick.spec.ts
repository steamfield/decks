import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import data from "../src/data/examples.json" with { type: "json" };

// The landing has two players: the motion section's reel above, and the gallery player in
// #examples. A row in the gallery list loads its deck into the gallery player.
const gallery = data.examples.filter((example) => example.listed !== false);
const picked = gallery[gallery.length - 1];
const stub = readFileSync("e2e/fixtures/stub-deck.html", "utf8");
const title = (name: string): string =>
  JSON.parse(readFileSync(`fixtures/examples/${name}.json`, "utf8")).title;

test("picking a gallery row loads that deck and scrolls to the gallery player", async ({
  page,
}) => {
  if (!picked) throw new Error("examples.json lists no gallery decks");
  await page.route("**/d/*/index.html*", (route) =>
    route.fulfill({ contentType: "text/html", body: stub }),
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const row = page.locator(`#examples a[data-example="${picked.name}"]`);
  await row.scrollIntoViewIfNeeded();
  await row.click();
  const player = page.locator("#examples").getByRole("group", { name: /^Deck player:/ });
  await expect(player).toBeInViewport();
  await expect(
    page.locator("#motion").getByRole("group", { name: /^Deck player:/ }),
  ).not.toBeInViewport();
  await expect(player).toHaveAttribute(
    "aria-label",
    new RegExp(`^Deck player: ${title(picked.name)}`),
  );
});
