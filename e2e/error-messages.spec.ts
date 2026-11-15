import { resolve } from "node:path";
import { expect } from "@playwright/test";
import { settled, test } from "./fixtures/deck.fixture";
import { test as errorTest } from "./fixtures/error.fixture";

errorTest(
  "A startup import failure shows its message and logs its stack.",
  async ({ page, errorDeck }) => {
    const app = await errorDeck({
      "components/Fail.tsx": 'throw new Error("Startup exploded"); export const Fail = () => null;',
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    await page.goto(app.url);
    await expect(page.getByText("The deck failed to start: Startup exploded")).toBeVisible();
    await expect.poll(() => errors.join("\n")).toContain("Startup exploded");
    expect(errors.join("\n")).toContain("/components/Fail.tsx");
    await expect.poll(() => app.terminal.join("\n")).toContain("Startup exploded");
    expect(app.terminal.join("\n")).not.toContain("This is a bug in react-decks.");
  },
);

errorTest(
  "An author's monorepo package is not classified as framework code.",
  async ({ page, errorDeck }) => {
    const app = await errorDeck({
      "components/External.tsx":
        'export { ExternalBadge } from "../author/packages/core/src/Badge";',
      "author/packages/core/src/Badge.tsx":
        'throw new Error("Author package exploded"); export const ExternalBadge = () => null;',
    });
    await page.goto(app.url);
    await expect(page.getByText("The deck failed to start: Author package exploded")).toBeVisible();
    await expect.poll(() => app.terminal.join("\n")).toContain("Author package exploded");
    expect(app.terminal.join("\n")).not.toContain("This is a bug in react-decks.");
  },
);

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
    },
    `/@fs/${resolve("packages/runtime/src/transition.ts")}`,
  );
  await settled(page);
  expect(errors).toEqual(["Apply failed"]);
});
