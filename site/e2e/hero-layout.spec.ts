import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { site } from "../src/config";

// The hero's first viewport (RFC 0011): the agent session starts high enough to be seen at
// once, with the install command under it on a laptop and the deck on screen on a phone.

const labels = site.agentSession.stageLabels;
const finishedLabel = labels.at(-1) ?? "";
const literal = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The deck stage, by whichever name it has: the session renames it as each turn lands. */
const stage = (page: Page) =>
  page.getByRole("img", { name: new RegExp(`^(${labels.map(literal).join("|")})$`) });

/** The element's top edge; throws, so a poll retries, while it has no layout box. */
async function topOf(locator: Locator, what: string) {
  const box = await locator.boundingBox();
  if (!box) throw new Error(`${what} has no layout box: it is hidden or detached`);
  return box.y;
}

const top = (locator: Locator, what: string) =>
  expect.poll(() => topOf(locator, what), { message: `${what}'s top edge` });

test("at 1280x800 the demo starts within 200px and the install command is on screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await top(stage(page), "the deck stage").toBeLessThanOrEqual(200);
  // The whole command block: its copy button and its last line.
  await expect(page.getByRole("button", { name: "Copy the install commands" })).toBeInViewport({
    ratio: 1,
  });
  const lastLine = site.quickstart.at(-1) ?? "";
  await expect(page.getByText(lastLine, { exact: true }).first()).toBeInViewport({ ratio: 1 });
  // The poster paints from the server's HTML, before the session hydrates.
  await expect(stage(page)).toBeInViewport();
});

test("at 390x844 the deck stage's top edge is inside the first screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await top(stage(page), "the deck stage").toBeGreaterThanOrEqual(0);
  await top(stage(page), "the deck stage").toBeLessThan(844);
  const title = page.getByRole("heading", { level: 1, name: site.tagline });
  await expect
    .poll(
      async () =>
        (await topOf(stage(page), "the deck stage")) - (await topOf(title, "the headline")),
      { message: "how far the deck stage sits below the headline" },
    )
    .toBeGreaterThan(0);
});

const audit = (builder: AxeBuilder) =>
  builder.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();

test("the landing page passes axe with the session's static view", async ({ page }) => {
  // Reduced motion, so no section is caught mid-reveal.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("img", { name: finishedLabel })).toBeVisible();
  expect((await audit(new AxeBuilder({ page }))).violations).toEqual([]);
});

test("the playing session and its controls pass axe", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Replay" })).toBeVisible();
  await expect(page.locator('iframe[src^="/d/agent-hero/"]')).toBeVisible({ timeout: 20_000 });
  expect((await audit(new AxeBuilder({ page }).include(".hero"))).violations).toEqual([]);
});
