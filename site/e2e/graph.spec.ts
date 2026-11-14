import { expect, test } from "@playwright/test";
import { loadExamples } from "../src/data/examples";
import { announcement } from "../src/lib/player/format";

test("the files and graph slides survive two complete forward and reverse walks", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const example = loadExamples().find(({ name }) => name === "opendata-pitch");
  if (!example) throw new Error("missing OpenData pitch");
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !/Wake Lock permission request denied/.test(message.text()))
      errors.push(message.text());
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const player = page.getByRole("group", { name: /^Deck player:/ });
  await page
    .getByRole("link")
    .filter({ has: page.getByText(example.title, { exact: true }) })
    .click();
  await expect(player.locator("iframe")).toHaveAttribute("src", /\/d\/opendata-pitch\//);
  await expect(player.getByRole("status")).toContainText("Live deck", { timeout: 20_000 });
  await expect(player.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  const frame = page.frameLocator("iframe");
  const graphSlide = 4;
  const ordered = example.states.filter(
    ({ slide }) => slide >= example.startSlide && slide <= graphSlide,
  );
  expect(ordered.length).toBeGreaterThan(1);
  for (let cycle = 0; cycle < 2; cycle++) {
    for (const forward of [true, false]) {
      const label = forward ? "Step forward" : "Step back";
      const states = forward ? ordered.slice(1) : ordered.slice(0, -1).reverse();
      for (const state of states) {
        await player.getByRole("button", { name: label, exact: true }).click();
        await expect(
          player.getByText(
            announcement(
              { ...state, slides: example.slides },
              example.slideTitles[state.slide - 1],
            ),
            { exact: true },
          ),
        ).toBeAttached({ timeout: 15_000 });
        await expect(
          player.getByRole("paragraph").and(player.getByText(state.lead, { exact: true })),
        ).toBeVisible();
        const slide = frame.locator("[data-deck-active]");
        await expect(slide).toHaveAttribute("data-deck-slide", String(state.slide));
        if (state.slide === graphSlide && state.beat >= 1) {
          const canvas = slide.locator("canvas");
          await expect(canvas).toBeVisible();
          expect(
            await canvas.evaluate(
              (element: HTMLCanvasElement) => element.width > 0 && element.height > 0,
            ),
          ).toBe(true);
        }
        // A live frame must still paint after the graph mounts and unmounts.
        await slide.evaluate(
          () => new Promise<void>((done) => requestAnimationFrame(() => done())),
        );
      }
    }
  }
  expect(errors).toEqual([]);
});
