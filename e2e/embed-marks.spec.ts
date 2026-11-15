import { expect } from "@playwright/test";
import { settled } from "./fixtures/deck.fixture";
import { boot, step, test } from "./fixtures/embed.fixture";

test("Hovering an OpenChart bar tells the host about the interaction", async ({
  page,
  embedURL,
}) => {
  await boot(page, embedURL);
  await step(page, "go", 1, { slide: 1 });
  const chart = page.frameLocator("iframe").getByRole("region", { name: "Chart marks" });
  await chart.locator("[data-mark-id]").first().hover();
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.embedMessages.filter((message) => message.type === "decks:interaction"),
      ),
    )
    .toHaveLength(1);
});

test("Hovering a custom data-mark-id element tells the host about the interaction", async ({
  page,
  embedURL,
}) => {
  await boot(page, embedURL);
  await step(page, "go", 1, { slide: 1 });
  await page.frameLocator("iframe").getByText("Custom mark", { exact: true }).hover();
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.embedMessages.filter((message) => message.type === "decks:interaction"),
      ),
    )
    .toHaveLength(1);
});

for (const view of ["overview", "presenter"]) {
  test(`A command in ${view} leaves the position unchanged and reports nothing`, async ({
    page,
    embedURL,
  }) => {
    await page.goto(
      `${embedURL}embed-host.html?src=${encodeURIComponent(`${embedURL}index.html?decks-bridge=1#/${view}/2`)}`,
    );
    const deck = page.frames().find((candidate) => candidate.parentFrame());
    if (!deck) throw new Error("Missing iframe");
    await expect(
      page
        .frameLocator("iframe")
        .locator(`[data-deck-slide="2"][data-deck-context="${view}"]`)
        .getByRole("heading", { name: "Story slide" }),
    ).toBeVisible();
    await settled(deck);
    await page.waitForFunction(() =>
      window.embedMessages.some((message) => message.settled === true),
    );
    const before = await page.evaluate(() => window.embedMessages);
    await deck.evaluate(() =>
      window.addEventListener(
        "message",
        () => window.parent.postMessage({ type: "decks:sentinel" }, window.location.origin),
        { once: true },
      ),
    );
    await page.evaluate(() => window.sendEmbed({ type: "decks:cmd", cmd: "next", requestId: 2 }));
    await page.waitForFunction(() =>
      window.embedMessages.some((message) => message.type === "decks:sentinel"),
    );
    await settled(deck);
    expect(deck.url()).toMatch(new RegExp(`#/${view}/2$`));
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.embedMessages.filter((message) => message.type !== "decks:sentinel"),
        ),
      )
      .toEqual(before);
  });
}
