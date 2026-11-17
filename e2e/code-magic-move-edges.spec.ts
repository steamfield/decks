import { expect } from "@playwright/test";
import { deckDriver, settled } from "./fixtures/deck-driver";
import { test } from "./fixtures/motion.fixture";
import { slideNo } from "./fixtures/motion-gallery";

const no = slideNo("magic-move");
const first = 'const greeting = "Hello";';
const second = `const greet = (name: string) => \`Hello, \${name}\``;

test("With motion instant a forward click shows the next code at once, with no morph.", async ({
  page,
}) => {
  await page.goto(`/?motion=instant#/${no}`);
  await settled(page);
  const figure = page.locator("[data-deck-active]").getByRole("figure");
  await expect(figure).toContainText(first);
  await page.keyboard.press("ArrowRight");
  await expect(figure).toContainText(second);
  await expect
    .poll(() =>
      figure.evaluate((element) => ({
        duration: element.querySelector("pre")?.style.getPropertyValue("--smm-duration"),
        morphs: element
          .getAnimations({ subtree: true })
          .filter(
            (animation) =>
              animation instanceof CSSTransition && animation.transitionProperty === "transform",
          ).length,
      })),
    )
    .toEqual({ duration: "", morphs: 0 });
});

test("A fence with at after zero leaves its code unmarked until that click, then shows its first step.", async ({
  page,
}) => {
  const edges = slideNo("magic-move-edges");
  await deckDriver(page).goto(edges);
  const late = page
    .locator("[data-deck-active]")
    .getByRole("figure")
    .filter({ hasText: "late.ts" });
  await expect(late).toContainText("const late = 1;");
  await expect(late.locator("[data-line-state]")).toHaveCount(0);
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(new RegExp(`#/${edges}\\?clicks=1$`));
  await expect(late.locator("[data-line-state]")).toHaveCount(0);
  await page.keyboard.press("ArrowRight");
  await settled(page);
  await expect(late).toContainText("const late = 1;");
  await expect(late).toContainText("const rest = 2;");
  await expect(late.locator('[data-line="1"]').first()).toHaveAttribute(
    "data-line-state",
    "active",
  );
  await expect(late.locator('[data-line="2"]').first()).toHaveAttribute("data-line-state", "dim");
  await page.keyboard.press("ArrowRight");
  await settled(page);
  await expect(late).toContainText("const late = 10;");
});

test("A fence with a single step renders its code and uses no clicks.", async ({ page }) => {
  const edges = slideNo("magic-move-edges");
  await deckDriver(page).goto(edges, 3);
  const single = page
    .locator("[data-deck-active]")
    .getByRole("figure")
    .filter({ hasText: "single.ts" });
  await expect(single).toContainText("const only = 1;");
  await page.keyboard.press("ArrowLeft");
  await settled(page);
  await expect(single).toContainText("const only = 1;");
});
