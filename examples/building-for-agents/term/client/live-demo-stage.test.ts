import { resolve } from "node:path";
import { chromium, expect } from "@playwright/test";
import { onTestFinished, test } from "vitest";
import { settled } from "../../../../e2e/fixtures/deck-driver";
import { deckServer } from "../../../../e2e/fixtures/deck-server";

const browserTest = test.skipIf(process.env.DECKS_LIVE_TERM !== "1");

async function openDemo() {
  const browser = await chromium.launch();
  let server: Awaited<ReturnType<typeof deckServer>> | undefined;
  const errors: string[] = [];
  onTestFinished(async () => {
    await browser.close();
    await server?.close();
    expect(errors).toEqual([]);
  });
  server = await deckServer(browser, resolve(import.meta.dirname, "../.."));
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return { page, url: server.url };
}

browserTest(
  "the opening caption stays visible with the screen off, including after stepping back",
  async () => {
    const { page, url } = await openDemo();
    await page.goto(`${url}?motion=instant#/5`);
    await expect(
      page.getByRole("heading", { name: "Stacks gives a failed check an exit code." }),
    ).toBeVisible();
    const leads = await page.evaluate<string[]>(
      `import("/data/05-stacks-live.ts").then(({ COPY }) => COPY.map(entry => entry.lead))`,
    );
    for (const click of [0, 1, 0]) {
      if (click === 1) await page.keyboard.press("ArrowRight");
      else if (page.url().includes("clicks=1")) await page.keyboard.press("ArrowLeft");
      await settled(page);
      const lead = leads[click];
      if (!lead) throw new Error(`Missing caption at click ${click}`);
      await expect
        .poll(() =>
          page
            .getByText(lead, { exact: true })
            .evaluateAll((elements) =>
              elements.some((element) =>
                element.checkVisibility({ opacityProperty: true, visibilityProperty: true }),
              ),
            ),
        )
        .toBe(true);
    }
  },
);

browserTest("all sixteen ANSI colors remain visually distinct in the live pane", async () => {
  const { page, url } = await openDemo();
  await page.goto(`${url}#/5?clicks=1`);
  const terminal = page.getByRole("application", { name: "Live terminal" });
  await expect(terminal.getByText("$", { exact: true })).toBeVisible();
  await terminal.click();
  await page.keyboard.type(
    "for n in {0..15}; do if (( n < 8 )); then c=$((30+n)); else c=$((90+n-8)); fi; printf '\\e[%smANSI%02d\\e[0m ' $c $n; done; printf '\\n'",
  );
  await page.keyboard.press("Enter");
  await expect(terminal.getByText("ANSI15", { exact: true })).toBeVisible();
  const colors: string[] = [];
  for (let n = 0; n < 16; n++)
    colors.push(
      await terminal
        .getByText(`ANSI${String(n).padStart(2, "0")}`, { exact: true })
        .evaluate((element) => getComputedStyle(element).color),
    );
  expect(new Set(colors).size).toBe(16);
});
