import { expect, test } from "@playwright/test";

test("only the current page lists its sections in the sidebar, and a sub-link lands on its heading", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "the sidebar is the desktop layout");
  await page.goto("/docs/cli/");
  const nav = page.getByRole("navigation", { name: "Docs", exact: true });
  await expect(nav.getByRole("link", { name: "The decks command" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.getByRole("navigation", { name: "On this page" })).toHaveCount(0);
  // Only the active page expands, and only with its h2s.
  await expect(nav.locator("[data-toc]")).toHaveCount(1);
  const h2s = await page.locator("article h2").allTextContents();
  await expect(nav.locator("[data-toc] a")).toHaveCount(h2s.length);

  const sub = nav.locator("[data-toc] a").nth(2);
  const href = await sub.getAttribute("href");
  if (!href) throw new Error("sub-link has no href");
  await sub.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.locator(href)).toBeInViewport();
  await expect(sub).toHaveAttribute("aria-current", "location");
});

test("the mobile docs menu lists the current page's sections under its link", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "the menu is the mobile layout");
  await page.goto("/docs/cli/");
  await page.getByText("Docs menu").click();
  const menu = page.getByRole("navigation", { name: "Docs menu" });
  await expect(menu.locator("[data-toc]")).toHaveCount(1);
  await menu.locator("[data-toc] a").nth(1).click();
  await expect(page).toHaveURL(/#decks-check$/);
});
