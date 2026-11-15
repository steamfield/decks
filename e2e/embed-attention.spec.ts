import { expect } from "@playwright/test";
import { boot, step, test } from "./fixtures/embed.fixture";

test("Hovering or focusing an interactive element tells the host once per element", async ({
  page,
  embedURL,
}) => {
  await boot(page, embedURL);
  const frame = page.frameLocator("iframe");
  await step(page, "go", 301, { slide: 3, beat: 0 });
  const count = () =>
    page.evaluate(() => window.embedMessages.filter((m) => m.type === "decks:interaction").length);
  const before = await count();
  const button = frame.getByRole("button", { name: "Stage keys" });
  await button.hover();
  await expect.poll(count).toBe(before + 1);
  await button.hover({ position: { x: 2, y: 2 } });
  await page.mouse.move(2, 2);
  await button.focus();
  await expect.poll(count).toBe(before + 2);
});
