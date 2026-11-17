import { expect } from "@playwright/test";
import { deckDriver, settled } from "./fixtures/deck-driver";
import { test } from "./fixtures/motion.fixture";
import { slideNo } from "./fixtures/motion-gallery";
import { record } from "./fixtures/motion-recorder";

const no = slideNo("magic-move");
const first = 'const greeting = "Hello";';
const second = `const greet = (name: string) => \`Hello, \${name}\`;`;
const third = "export function greet(name: string)";

test("The gallery morphs forward, highlights within a step, reverses and reloads mid-way.", async ({
  page,
}) => {
  await deckDriver(page).goto(no);
  const figure = page.locator("[data-deck-active]").getByRole("figure");
  await expect(figure).toContainText(first);
  const motion = await record(
    figure,
    (element) =>
      element
        .getAnimations({ subtree: true })
        .filter(
          (animation) =>
            animation instanceof CSSTransition && animation.transitionProperty === "transform",
        ).length,
  );
  await page.keyboard.press("ArrowRight");
  await expect(figure).toContainText(second);
  expect((await motion.log()).some((value) => value > 0)).toBe(true);
  await expect(figure.locator('[data-line="1"]').first()).toHaveAttribute(
    "data-line-state",
    "active",
  );
  await expect(figure.locator('[data-line="2"]').first()).toHaveAttribute("data-line-state", "dim");
  await page.keyboard.press("ArrowRight");
  await expect(figure.locator('[data-line="2"]').first()).toHaveAttribute(
    "data-line-state",
    "active",
  );
  await page.keyboard.press("ArrowRight");
  await settled(page);
  await expect(figure).toContainText(third);
  await expect(figure).not.toContainText('greet("Ada")');
  await page.keyboard.press("ArrowLeft");
  await expect(figure).toContainText(second);
  await page.reload();
  await expect(figure).toContainText(second);
  await expect(page).toHaveURL(new RegExp(`#/${no}\\?clicks=2$`));
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await settled(page);
  await expect(figure).toContainText(first);
  await expect(figure).not.toContainText(second);
});

test("Three quick presses land on the last version and back shows the previous version.", async ({
  page,
}) => {
  await deckDriver(page).goto(no);
  const figure = page.locator("[data-deck-active]").getByRole("figure");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(new RegExp(`#/${no}\\?clicks=3$`));
  await expect(figure).toContainText(third);
  await page.keyboard.press("ArrowLeft");
  await settled(page);
  await expect(figure).toContainText(second);
  await expect(figure).not.toContainText(third);
  await expect
    .poll(() => figure.evaluate((element) => element.getAnimations({ subtree: true }).length))
    .toBe(0);
});

test("Returning from overview at the last click shows final code without morphing.", async ({
  page,
}) => {
  await deckDriver(page).goto(no, 3);
  await page.keyboard.press("o");
  const tile = page.getByRole("button", {
    name: `Slide ${no}: Keep the greeting as the function grows.`,
  });
  await expect(tile).toContainText(third);
  await tile.click();
  const figure = page.locator("[data-deck-active]").getByRole("figure");
  await expect(figure).toContainText(third);
  await expect
    .poll(() =>
      figure.evaluate((element) =>
        element.querySelector("pre")?.style.getPropertyValue("--smm-duration"),
      ),
    )
    .toBe("");
});

test("A jump into a mounted neighboring slide shows its code without a morph.", async ({
  page,
}) => {
  await deckDriver(page).goto(no - 1);
  const slide = page.locator(`[data-deck-slide="${no}"]`);
  await expect(slide.getByRole("figure", { includeHidden: true })).toContainText(first);
  await page.evaluate((no) => {
    window.location.hash = `#/${no}?clicks=1`;
  }, no);
  await expect(page.locator("[data-deck-active]")).toHaveAttribute("data-deck-slide", String(no));
  await expect(slide.getByRole("figure")).toContainText(second);
  await expect
    .poll(() =>
      slide
        .getByRole("figure")
        .evaluate((element) =>
          element.querySelector("pre")?.style.getPropertyValue("--smm-duration"),
        ),
    )
    .toBe("");
});

for (const leave of [false, true]) {
  test(`${leave ? "Returning to the same step" : "Back"} snaps during a paused morph across lines.`, async ({
    page,
  }) => {
    await deckDriver(page).goto(no, 2);
    const figure = page.locator("[data-deck-active]").getByRole("figure");
    const recording = await figure.evaluateHandle((element) => {
      const animations: Animation[] = [];
      const observer = new MutationObserver(() => {
        for (const animation of element.getAnimations({ subtree: true })) {
          if (!(animation instanceof CSSTransition) || animation.transitionProperty !== "transform")
            continue;
          animation.pause();
          animation.currentTime = 200;
          animations.push(animation);
        }
        if (animations.length) observer.disconnect();
      });
      observer.observe(element, { attributes: true, subtree: true });
      return { animations, stop: () => observer.disconnect() };
    });
    try {
      await page.keyboard.press("ArrowRight");
      await expect
        .poll(() => recording.evaluate((state) => state.animations.length))
        .toBeGreaterThan(0);
      expect(
        await figure.evaluate((element) =>
          Array.from(element.querySelectorAll("[data-line]")).some(
            (token) => getComputedStyle(token).transform !== "none",
          ),
        ),
      ).toBe(true);
      if (leave) {
        await page.keyboard.press("ArrowUp");
        await expect(page).toHaveURL(new RegExp(`#/${no - 1}$`));
        await expect(page.locator("[data-deck-active]")).toHaveAttribute(
          "data-deck-slide",
          String(no - 1),
        );
        await page.evaluate((no) => {
          window.location.hash = `#/${no}?clicks=3`;
        }, no);
        await expect(figure).toContainText(third);
      } else {
        await page.keyboard.press("ArrowLeft");
        await expect(figure).toContainText(second);
      }
      expect(
        await figure.evaluate((element) =>
          Array.from(element.querySelectorAll("[data-line]")).every(
            (token) => getComputedStyle(token).transform === "none",
          ),
        ),
      ).toBe(true);
      expect(
        await figure.evaluate(
          (element) =>
            element
              .getAnimations({ subtree: true })
              .filter(
                (animation) =>
                  animation instanceof CSSTransition &&
                  animation.transitionProperty === "transform",
              ).length,
        ),
      ).toBe(0);
    } finally {
      await recording.evaluate((state) => state.stop());
      await recording.dispose();
    }
  });
}

test("The presenter's next preview shows the next click without animation while the audience advances.", async ({
  page,
}) => {
  await deckDriver(page).goto(no);
  const opened = page.waitForEvent("popup");
  await page.keyboard.press("p");
  const presenter = await opened;
  const current = presenter.getByRole("region", { name: "Current slide" }).getByRole("figure");
  const next = presenter.getByRole("region", { name: "Next", exact: true }).getByRole("figure");
  await expect(current).toContainText(first);
  await expect(next).toContainText(second);
  const motion = await record(
    next,
    (element) => element.getAnimations({ subtree: true }).length,
    () => settled(presenter),
  );
  await page.keyboard.press("ArrowRight");
  await expect(current).toContainText(second);
  await page.keyboard.press("ArrowRight");
  await expect(next).toContainText(third);
  expect((await motion.log()).every((value) => value === 0)).toBe(true);
});

test("Print follows each page's click and final-only print shows the last code version.", async ({
  page,
}) => {
  await page.goto("/#/print");
  const slide = page.locator(`[data-deck-slide="${no}"]`);
  await expect(slide.getByRole("figure")).toContainText([first, second, second, third]);
  await page.goto("/?print=final#/print");
  await expect(slide.getByRole("figure")).toHaveCount(1);
  await expect(slide.getByRole("figure")).toContainText(third);
});

test("An added token fades on the first forward morph.", async ({ page }) => {
  await deckDriver(page).goto(no);
  const figure = page.locator("[data-deck-active]").getByRole("figure");
  const recording = await figure.evaluateHandle((element) => {
    const animations: Animation[] = [];
    const observer = new MutationObserver(() => {
      for (const animation of element.getAnimations({ subtree: true })) {
        if (
          !(animation instanceof CSSTransition) ||
          animation.transitionProperty !== "opacity" ||
          !(animation.effect instanceof KeyframeEffect) ||
          animation.effect.target?.textContent !== "string"
        )
          continue;
        animation.pause();
        animation.currentTime =
          Number(animation.effect.getTiming().delay) +
          Number(animation.effect.getTiming().duration) / 2;
        animations.push(animation);
      }
      if (animations.length) observer.disconnect();
    });
    observer.observe(element, { attributes: true, subtree: true, childList: true });
    return { animations, stop: () => observer.disconnect() };
  });
  try {
    await page.keyboard.press("ArrowRight");
    await expect
      .poll(() => recording.evaluate((state) => state.animations.length))
      .toBeGreaterThan(0);
    const opacity = await figure
      .getByText("string", { exact: true })
      .evaluate((token) => Number(getComputedStyle(token).opacity));
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThan(1);
  } finally {
    await recording.evaluate((state) => {
      state.stop();
      for (const animation of state.animations) animation.finish();
    });
    await recording.dispose();
  }
});
