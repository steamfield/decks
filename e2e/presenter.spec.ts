import { appendFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, type Page } from "@playwright/test";
import { test } from "./fixtures/deck.fixture";

async function openPresenter(page: Page, hash = "#/2?clicks=1") {
  await page.goto(`/${hash}`);
  await expect(page).toHaveURL(new RegExp(`${hash.replace("?", "\\?")}$`));
  await expect(page.getByRole("heading", { name: "Three steps", exact: true })).toBeVisible();
  const opened = page.waitForEvent("popup");
  await page.keyboard.press("p");
  const presenter = await opened;
  await expect(presenter.getByRole("region", { name: "Current slide" })).toBeVisible();
  await expect(presenter).toHaveURL(/#\/presenter\/2\?clicks=1$/);
  return presenter;
}

test("p opens the current frame and reuses the named presenter without navigating it", async ({
  page,
  context,
}) => {
  const presenter = await openPresenter(page);
  await presenter.keyboard.press("o");
  await expect(presenter).toHaveURL(/#\/overview\/2\?clicks=1$/);
  await page.keyboard.press("p");
  expect(context.pages()).toHaveLength(2);
  await expect(presenter).toHaveURL(/#\/overview\/2\?clicks=1$/);
});

test("either window advances both windows including their URLs", async ({ page }) => {
  const presenter = await openPresenter(page);
  await presenter.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/#\/2\?clicks=2$/);
  await expect(page.getByRole("listitem")).toHaveText(["First point", "Second point"]);
  await page.keyboard.press("ArrowRight");
  await expect(presenter).toHaveURL(/#\/presenter\/2\?clicks=3$/);
  await expect(
    presenter.getByRole("region", { name: "Current slide" }).getByRole("listitem"),
  ).toHaveText(["First point", "Second point", "Third point"]);
});

test("reloading the presenter mid-talk preserves the room's position", async ({ page }) => {
  const presenter = await openPresenter(page);
  await page.keyboard.press("ArrowDown");
  await expect(presenter).toHaveURL(/#\/presenter\/3$/);
  await presenter.reload();
  await expect(
    presenter
      .getByRole("region", { name: "Current slide" })
      .getByRole("heading", { name: "A deck component", exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/#\/3$/);
});

test("reloading the audience mid-talk preserves the presenter's position", async ({ page }) => {
  const presenter = await openPresenter(page);
  await presenter.keyboard.press("ArrowDown");
  await expect(page).toHaveURL(/#\/3$/);
  await page.reload();
  await expect(page.getByRole("heading", { name: "A deck component", exact: true })).toBeVisible();
  await expect(presenter).toHaveURL(/#\/presenter\/3$/);
});

test("a third window at slide one joins the talk without moving either existing window", async ({
  page,
  context,
}) => {
  const presenter = await openPresenter(page);
  const third = await context.newPage();
  await third.goto(new URL("/#/1", page.url()).href);
  await expect(third).toHaveURL(/#\/2\?clicks=1$/);
  await expect(third.getByRole("listitem")).toHaveText(["First point"]);
  await expect(page).toHaveURL(/#\/2\?clicks=1$/);
  await expect(presenter).toHaveURL(/#\/presenter\/2\?clicks=1$/);
});

for (const entry of ["?embedded#/1", "?decks-bridge#/1", "#/print"]) {
  test(`a window mounted at ${entry} stays outside sync even after a URL view change`, async ({
    page,
    context,
  }) => {
    const presenter = await openPresenter(page);
    const isolated = await context.newPage();
    await isolated.goto(new URL(`/${entry}`, page.url()).href);
    await expect(
      isolated.getByRole("heading", { name: "Basic fixture deck", exact: true }),
    ).toBeVisible();
    await isolated.evaluate(() => {
      window.location.hash = "#/3";
    });
    await expect(
      isolated.getByRole("heading", { name: "A deck component", exact: true }),
    ).toBeVisible();
    await expect(page).toHaveURL(/#\/2\?clicks=1$/);
    await expect(presenter).toHaveURL(/#\/presenter\/2\?clicks=1$/);
  });
}

test("overview focus and Escape never move the audience and preserve the talk's click", async ({
  page,
}) => {
  const presenter = await openPresenter(page);
  const audienceUrls: string[] = [];
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) audienceUrls.push(frame.url());
  });
  await presenter.keyboard.press("o");
  await presenter.keyboard.press("ArrowRight");
  await expect(presenter.getByRole("button", { name: "Slide 3: A deck component" })).toBeFocused();
  await expect(page).toHaveURL(/#\/2\?clicks=1$/);
  await presenter.keyboard.press("Escape");
  await expect(presenter).toHaveURL(/#\/presenter\/2\?clicks=1$/);
  await expect(page.getByRole("listitem")).toHaveText(["First point"]);
  expect(audienceUrls).toEqual([]);
});

test("activating an overview slide and Back move both windows while preserving presenter view", async ({
  page,
}) => {
  const presenter = await openPresenter(page);
  await presenter.keyboard.press("o");
  await presenter.getByRole("button", { name: "Slide 5: The end" }).click();
  await expect(presenter).toHaveURL(/#\/presenter\/5$/);
  await expect(page).toHaveURL(/#\/5$/);
  await expect(page.getByRole("heading", { name: "The end", exact: true })).toBeVisible();
  await presenter.goBack();
  await expect(presenter).toHaveURL(/#\/presenter\/2\?clicks=1$/);
  await expect(page).toHaveURL(/#\/2\?clicks=1$/);
  await expect(
    presenter.getByRole("region", { name: "Current slide" }).getByRole("listitem"),
  ).toHaveText(["First point"]);
  await expect(page.getByRole("listitem")).toHaveText(["First point"]);
});

test("after Reset timer, arrows and PageDown navigate while Space activates the button", async ({
  page,
  context,
}) => {
  // Installed on the context so the presenter popup opens under the same fake clock.
  await context.clock.install();
  const presenter = await openPresenter(page);
  await presenter.getByRole("button", { name: "Reset timer" }).click();
  await presenter.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/#\/2\?clicks=2$/);
  await expect(presenter).toHaveURL(/#\/presenter\/2\?clicks=2$/);
  // The first navigation starts the talk; let the timer run so Space has something to reset.
  const timer = presenter.getByLabel("Elapsed time");
  await context.clock.runFor(3000);
  await expect(timer).not.toHaveText("00:00");
  await presenter.keyboard.press("Space");
  await expect(timer).toHaveText("00:00");
  await expect(presenter).toHaveURL(/#\/presenter\/2\?clicks=2$/);
  await presenter.keyboard.press("PageDown");
  await expect(page).toHaveURL(/#\/2\?clicks=3$/);
  await expect(presenter).toHaveURL(/#\/presenter\/2\?clicks=3$/);
});

test("an audience reload while the presenter browses overview restores the talk rather than its focused tile", async ({
  page,
}) => {
  const presenter = await openPresenter(page);
  await presenter.keyboard.press("o");
  await presenter.keyboard.press("End");
  await page.reload();
  await expect(page).toHaveURL(/#\/2\?clicks=1$/);
  await expect(page.getByRole("listitem")).toHaveText(["First point"]);
  await expect(presenter.getByRole("button", { name: "Slide 5: The end" })).toBeFocused();
});

test("a presenter reloaded in overview returns to presenter on Escape", async ({ page }) => {
  const presenter = await openPresenter(page);
  await presenter.keyboard.press("o");
  await presenter.reload();
  await expect(presenter.getByRole("button", { name: "Slide 2: Three steps" })).toBeFocused();
  await presenter.keyboard.press("Escape");
  await expect(presenter).toHaveURL(/#\/presenter\/2\?clicks=1$/);
});

test("back in presenter steps the whole room back after three audience slide changes", async ({
  page,
}) => {
  const presenter = await openPresenter(page);
  for (const slide of [3, 4, 5]) {
    await page.keyboard.press("ArrowDown");
    await expect(presenter).toHaveURL(new RegExp(`#/presenter/${slide}$`));
  }
  await presenter.goBack();
  await expect(presenter).toHaveURL(/#\/presenter\/4$/);
  await expect(page).toHaveURL(/#\/4$/);
});

test("opening and cancelling overview leaves Back pointing to the previous talk slide", async ({
  page,
}) => {
  const presenter = await openPresenter(page);
  await page.keyboard.press("ArrowDown");
  await expect(presenter).toHaveURL(/#\/presenter\/3$/);
  await presenter.keyboard.press("o");
  await presenter.keyboard.press("Escape");
  await presenter.goBack();
  await expect(presenter).toHaveURL(/#\/presenter\/2\?clicks=1$/);
  await expect(page).toHaveURL(/#\/2\?clicks=1$/);
});

test("overview preview controls are inert so Tab only visits slide buttons", async ({
  page,
  editableDeck,
}) => {
  await appendFile(
    join(editableDeck.dir, "slides/01-cover.mdx"),
    '\n<input aria-label="Preview control" />\n',
  );
  await page.goto(`${editableDeck.url}#/overview/1`);
  await expect(page.getByRole("button", { name: "Slide 1: Cover" })).toBeFocused();
  await expect(page.getByLabel("Preview control")).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Slide 2: Three steps" })).toBeFocused();
  await page.getByLabel("Preview control").evaluate((input) => input.focus());
  await expect(page.getByRole("button", { name: "Slide 2: Three steps" })).toBeFocused();
});

test("advancing pins the current click's notes to the top of the panel, past the earlier ones", async ({
  page,
}) => {
  const presenter = await openPresenter(page);
  const notes = presenter.getByRole("region", { name: "Notes" });
  const first = notes.getByText("First point.", { exact: true });
  const second = notes.getByText("Second point.", { exact: true });
  await expect(first.locator("..")).toHaveAttribute("aria-current", "true");
  await notes.evaluate((region) => {
    region.style.height = "100px";
  });
  await presenter.keyboard.press("ArrowRight");
  await expect(second.locator("..")).toHaveAttribute("aria-current", "true");
  await expect(second).toBeInViewport();
  await expect(first).not.toBeInViewport();
});

test("a 4:3 audience resize frames both previews before and after presenter reload", async ({
  page,
}) => {
  const presenter = await openPresenter(page);
  await page.setViewportSize({ width: 800, height: 600 });
  async function expectRatio() {
    for (const context of ["presenter", "preview"]) {
      const slide = presenter.locator(`[data-deck-context="${context}"]`);
      await expect
        .poll(async () => {
          const box = await slide.boundingBox();
          return box ? box.width / box.height : 0;
        })
        .toBeCloseTo(4 / 3, 3);
    }
  }
  await expectRatio();
  await presenter.reload();
  await expectRatio();
});

test("the play cursor hides on idle, pointer movement restores it, and f toggles fullscreen", async ({
  page,
}) => {
  await page.goto("/#/2");
  await expect(page.getByRole("heading", { name: "Three steps", exact: true })).toBeVisible();
  await page.clock.install();
  await page.mouse.move(20, 20);
  await page.clock.fastForward(4000);
  await expect(page.locator("html")).toHaveAttribute("data-deck-idle", "");
  await expect(page.getByRole("heading", { name: "Three steps", exact: true })).toHaveCSS(
    "cursor",
    "none",
  );
  await page.mouse.move(40, 40);
  await expect(page.locator("html")).not.toHaveAttribute("data-deck-idle");
  await page.keyboard.press("f");
  await expect
    .poll(() => page.evaluate(() => document.fullscreenElement === document.documentElement))
    .toBe(true);
  await page.keyboard.press("f");
  await expect.poll(() => page.evaluate(() => document.fullscreenElement === null)).toBe(true);
});
