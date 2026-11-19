import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// The hero's first viewport (RFC 0011): the agent session starts high enough to be seen at
// once, with the install command under it on a laptop and the deck on screen on a phone.

test("at 1280x800 the demo starts within 200px and the install command is on screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const demo = await page.locator(".agent-session").boundingBox();
  expect(demo?.y).toBeLessThanOrEqual(200);
  await expect(page.locator(".hero-install pre")).toBeInViewport({ ratio: 1 });
  // The poster paints from the server's HTML, before the session hydrates.
  await expect(page.locator(".agent-session .deck-stage:visible img")).toBeInViewport();
});

test("at 390x844 the deck stage's top edge is inside the first screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const stage = await page.locator(".agent-session .deck-stage:visible").boundingBox();
  expect(stage?.y).toBeGreaterThanOrEqual(0);
  expect(stage?.y).toBeLessThan(844);
  const title = await page.locator("#hero-title").boundingBox();
  expect(title?.y).toBeLessThan(stage?.y ?? 0);
});

const audit = (builder: AxeBuilder) =>
  builder.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();

test("the landing page passes axe with the session's static view", async ({ page }) => {
  // Reduced motion, so no section is caught mid-reveal.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("img", { name: /^The finished build-time talk/ })).toBeVisible();
  expect((await audit(new AxeBuilder({ page }))).violations).toEqual([]);
});

test("the playing session and its controls pass axe", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Replay" })).toBeVisible();
  await expect(page.locator(".agent-session iframe")).toBeVisible({ timeout: 20_000 });
  expect((await audit(new AxeBuilder({ page }).include(".hero"))).violations).toEqual([]);
});
