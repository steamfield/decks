import { expect, type Page } from "@playwright/test";
import { settled } from "./fixtures/deck-driver";
import { test } from "./fixtures/live-term";

for (const view of ["presenter", "overview", "instant motion", "embedded"]) {
  test(`${view} keeps its recording while the play window runs a command`, async ({
    page,
    context,
    liveServer,
  }) => {
    await page.goto(liveServer.url);
    await expect(page.getByLabel("Terminal status")).toHaveText("Live");
    let other: Page;
    if (view === "presenter") {
      const popup = page.waitForEvent("popup");
      await page.keyboard.press("p");
      other = await popup;
    } else {
      other = await context.newPage();
      const location =
        view === "overview"
          ? "#/overview"
          : view === "instant motion"
            ? "?motion=instant#/1"
            : "?embedded#/1";
      await other.goto(`${liveServer.url}${location}`);
    }
    await settled(other);
    await page.keyboard.press("ArrowRight");
    await expect(
      page
        .getByRole("application")
        .locator(".xterm-rows > div")
        .filter({ hasText: /^hello$/ }),
    ).toHaveCount(1);
    await expect(page.getByLabel("Terminal status")).toHaveText("Live");
    // The completed command is a later sentinel, so this cannot pass just by observing
    // the other window's initial recording before its HMR attach has been answered.
    await settled(other);
    const scope =
      view === "presenter" ? other.getByRole("region", { name: "Current slide" }) : other;
    await expect(scope.getByLabel("Terminal recording", { exact: true })).toBeVisible();
    await expect(other.getByRole("application")).toHaveCount(0);
    await other.close();
  });
}
