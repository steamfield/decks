import { expect } from "@playwright/test";
import { settled } from "./fixtures/deck-driver";
import { openLive, shellRows, test } from "./fixtures/live-term";

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

test("two audience windows and a presenter run each command once", async ({
  page,
  context,
  liveServer,
}) => {
  await openLive(page, liveServer.url);
  const second = await context.newPage();
  await openLive(second, liveServer.url);
  await page.keyboard.press("ArrowRight");
  await expect(shellRows(page).filter({ hasText: /^hello$/ })).toHaveCount(1);
  const popup = page.waitForEvent("popup");
  await page.keyboard.press("p");
  const presenter = await popup;
  await settled(presenter);
  await presenter.keyboard.press("ArrowRight");
  await expect(shellRows(page).filter({ hasText: /^Finish ls:\s*$/ })).toHaveCount(1);
  await page.getByRole("application").click();
  await page.keyboard.press("Enter");
  await presenter.keyboard.press("ArrowRight");
  // The third command prints what the first two appended to the `executions` file: a command
  // that ran in two windows would show 1123 or 11223.
  await expect(shellRows(page).filter({ hasText: /^executions=123$/ })).toHaveCount(1);
  await expect(shellRows(second).filter({ hasText: /^executions=123$/ })).toHaveCount(1);
});

test("a reloaded window reattaches to the running shell and the next click runs the next command", async ({
  page,
  liveServer,
}) => {
  await openLive(page, liveServer.url);
  await page.keyboard.press("ArrowRight");
  await expect(shellRows(page).filter({ hasText: /^hello$/ })).toHaveCount(1);
  await page.keyboard.press("ArrowRight");
  await expect(shellRows(page).filter({ hasText: /^Finish ls:\s*$/ })).toHaveCount(1);
  await page.reload();
  await expect(shellRows(page).filter({ hasText: /^Finish ls:\s*$/ })).toHaveCount(1);
  await page.getByRole("application").click();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Terminal status")).toHaveText("Live");
  await page.keyboard.press("Escape");
  await page.keyboard.press("ArrowRight");
  await expect(shellRows(page).filter({ hasText: /^executions=123$/ })).toHaveCount(1);
});

test("a click pressed while a command waits is queued and runs after the prompt returns", async ({
  page,
  liveServer,
}) => {
  await openLive(page, liveServer.url);
  await page.keyboard.press("ArrowRight");
  await expect(shellRows(page).filter({ hasText: /^hello$/ })).toHaveCount(1);
  await page.keyboard.press("ArrowRight");
  await expect(shellRows(page).filter({ hasText: /^Finish ls:\s*$/ })).toHaveCount(1);
  await expect(page.getByLabel("Terminal status")).toHaveText("Live · busy");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByLabel("Terminal status")).toHaveText("Live · queued");
  await expect(shellRows(page).filter({ hasText: /^third$/ })).toHaveCount(0);
  await page.getByRole("application").click();
  await page.keyboard.press("Enter");
  await expect(shellRows(page).filter({ hasText: /^third$/ })).toHaveCount(1);
  await expect(page.getByLabel("Terminal status")).toHaveText("Live");
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
