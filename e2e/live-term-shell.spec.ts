import { expect } from "@playwright/test";
import { settled } from "./fixtures/deck-driver";
import { test } from "./fixtures/live-term";

test("next types the prepared command before its output appears", async ({ page, liveServer }) => {
  await page.goto(liveServer.url);
  await expect(page.getByLabel("Terminal status")).toHaveText("Live");
  // Record the reading pause rather than trying to sample its 600 ms window.
  const log = await page.evaluateHandle(() => {
    const lines: string[][] = [];
    const observer = new MutationObserver(() => {
      lines.push(
        Array.from(document.querySelectorAll(".xterm-rows > div"), (row) =>
          (row.textContent ?? "").trimEnd(),
        ),
      );
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return { lines, observer };
  });
  await page.keyboard.press("ArrowRight");
  const rows = page
    .getByRole("application", { name: "Live terminal" })
    .locator(".xterm-rows > div");
  await expect(rows.filter({ hasText: /^hello$/ })).toHaveCount(1);
  await expect(page.getByLabel("Terminal status")).toHaveText("Live");
  const output = await log.evaluate(({ lines, observer }) => {
    observer.disconnect();
    return lines;
  });
  expect(
    output.some(
      (lines) => lines.includes("$ echo hello; printf 1 >> executions") && !lines.includes("hello"),
    ),
  ).toBe(true);
  await log.dispose();
});

test("two audience windows run each presenter command once and the sole window can reload then advance", async ({
  page,
  context,
  liveServer,
}) => {
  await page.goto(liveServer.url);
  await expect(page.getByLabel("Terminal status")).toHaveText("Live");
  const second = await context.newPage();
  await second.goto(liveServer.url);
  await expect(second.getByLabel("Terminal status")).toHaveText("Live");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByLabel("Terminal status")).toHaveText("Live");
  await expect(
    page
      .getByRole("application")
      .locator(".xterm-rows > div")
      .filter({ hasText: /^hello$/ }),
  ).toHaveCount(1);
  const popup = page.waitForEvent("popup");
  await page.keyboard.press("p");
  const presenter = await popup;
  await expect(
    presenter.getByRole("region", { name: "Current slide" }).getByLabel("Terminal recording"),
  ).toBeVisible();
  await settled(presenter);
  await presenter.keyboard.press("ArrowRight");
  await expect(
    page
      .getByRole("application")
      .locator(".xterm-rows > div")
      .filter({ hasText: /^Finish ls:\s*$/ }),
  ).toHaveCount(1);
  await expect(page.getByLabel("Terminal status")).toHaveText("Live · busy");
  await presenter.close();
  await second.close();
  await page.reload();
  await expect(
    page
      .getByRole("application")
      .locator(".xterm-rows > div")
      .filter({ hasText: /^Finish ls:\s*$/ }),
  ).toHaveCount(1);
  await page.keyboard.press("ArrowRight");
  await expect(page.getByLabel("Terminal status")).toHaveText("Live · queued");
  await page.getByRole("application").click();
  await page.keyboard.press("Enter");
  await expect(
    page
      .getByRole("application")
      .locator(".xterm-rows > div")
      .filter({ hasText: /^third$/ }),
  ).toHaveCount(1);
  await expect(page.getByLabel("Terminal status")).toHaveText("Live");
  const rows = page.getByRole("application").locator(".xterm-rows > div");
  await expect(rows.filter({ hasText: /^executions=123$/ })).toHaveCount(1);
  await expect(rows.filter({ hasText: /^third$/ })).toHaveCount(1);
});

test("shell exit shows the reason in the frame, or below the fallback without a frame", async ({
  page,
  liveServer,
}) => {
  await page.goto(liveServer.url);
  await expect(page.getByLabel("Terminal status")).toHaveText("Live");
  await page.getByRole("application").click();
  await page.keyboard.type("exit");
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Terminal recording", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Terminal status")).toHaveText(
    "Recorded · live unavailable: Shell exited (0)",
  );
  await expect(page.getByRole("status")).toHaveCount(0);
  await page.goto(`${liveServer.url}#/2`);
  await expect(page.getByRole("application")).toBeVisible();
  await expect(page.getByLabel("Plain terminal recording")).not.toBeVisible();
  await page.getByRole("application").click();
  await page.keyboard.type("exit");
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Plain terminal recording")).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Shell exited (0)");
});
