import { resolve } from "node:path";
import { expect } from "@playwright/test";
import { test } from "./fixtures/deck.fixture";

test("An exception applying a view transition is reported once and settles.", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#/1");
  await expect(
    page.getByRole("heading", { name: "Basic fixture deck", exact: true }),
  ).toBeVisible();
  await page.evaluate(
    async (moduleUrl) => {
      const { runTransition } = await import(moduleUrl);
      runTransition(
        () => {
          throw new Error("Apply failed");
        },
        "fade",
        "forward",
        {},
      );
      await window.__deck?.settled();
    },
    `/@fs/${resolve("packages/runtime/src/transition.ts")}`,
  );
  expect(errors).toEqual(["Apply failed"]);
});
