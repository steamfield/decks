import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { build } from "esbuild";

// The landing's hero mounts DeckStage inside the agent session, which drives it on its own
// clock; to test the stage alone, the spec bundles a harness that mounts only DeckStage and
// serves it from the preview server's origin, beside the real agent-hero build in /d/. The
// page takes the landing's own stylesheets and inline tokens from the built index.
const HARNESS = "/__deck-stage-harness";

async function harnessPage() {
  const bundle = await build({
    entryPoints: ["e2e/fixtures/deck-stage-harness.tsx"],
    bundle: true,
    write: false,
    format: "esm",
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"' },
  });
  const script = bundle.outputFiles[0]?.text ?? "";
  const head = readFileSync("dist/index.html", "utf8").match(/<head>([\s\S]*?)<\/head>/)?.[1];
  if (!head) throw new Error("dist/index.html has no <head>: run make build first");
  const styles = head.match(/<link rel="stylesheet"[^>]*>|<style[^>]*>[\s\S]*?<\/style>/g) ?? [];
  return `<!doctype html><html lang="en" class="dark" data-page="landing"><head><meta charset="utf-8"><title>DeckStage harness</title>${styles.join("")}</head><body><main style="width: min(960px, 100%)"><div id="root"></div></main><script type="module">${script.replaceAll("</script", "<\\/script")}</script></body></html>`;
}

let html = "";
test.beforeAll(async () => {
  html = await harnessPage();
});

async function open(page: Page) {
  await page.route(`**${HARNESS}`, (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: html }),
  );
  await page.goto(HARNESS);
  await expect(page.getByRole("img", { name: "The deck the agent built" })).toBeVisible();
  await page.waitForFunction(() => window.stage !== undefined);
}

const positions = (page: Page) =>
  page.evaluate(() => window.settledStates.map(({ slide, beat }) => [slide, beat]));

test("show resolves settled on its slide", async ({ page }) => {
  await open(page);
  const result = await page.evaluate(() => window.stage?.show(4, 0));
  expect(result).toMatchObject({ cancelled: false, state: { slide: 4, beat: 0, settled: true } });
});

test("go with a forced direction reports that direction", async ({ page }) => {
  await open(page);
  await page.evaluate(() => window.stage?.show(9, 0));
  const result = await page.evaluate(() => window.stage?.go(7, 0, { direction: "forward" }));
  expect(result).toMatchObject({
    cancelled: false,
    state: { slide: 7, beat: 0, settled: true, direction: "forward" },
  });
});

test("play steps the beats of stepped slides and whole slides elsewhere", async ({ page }) => {
  await open(page);
  const result = await page.evaluate(() =>
    window.stage?.play({ first: 2, last: 6, stepBeatsOn: [3] }, { dwellMs: 0 }),
  );
  expect(result).toMatchObject({ cancelled: false, state: { slide: 6, beat: 0 } });
  expect(await positions(page)).toEqual([
    [2, 0],
    [3, 0],
    [3, 1],
    [3, 2],
    [4, 0],
    [5, 0],
    [6, 0],
  ]);
  expect(await page.evaluate(() => window.settledStates[0]?.direction)).toBe("forward");
});

test("a show during a play cancels it and the deck stays on the show's slide", async ({ page }) => {
  await open(page);
  const [played, shown] = await page.evaluate(async () => {
    const stage = window.stage;
    if (!stage) throw new Error("no stage");
    const onThree = new Promise<void>((resolve) => {
      const check = () => {
        if (window.settledStates.some((state) => state.slide === 3)) {
          window.removeEventListener("message", check);
          resolve();
        }
      };
      window.addEventListener("message", check);
    });
    const play = stage.play({ first: 2, last: 6, stepBeatsOn: [3] }, { dwellMs: 0 });
    await onThree;
    const show = stage.show(8, 0);
    return Promise.all([play, show]);
  });
  expect(played).toEqual({ cancelled: true });
  expect(shown).toMatchObject({ cancelled: false, state: { slide: 8, beat: 0 } });
  // A second show is the sentinel: nothing from the cancelled play lands between the two.
  await page.evaluate(() => window.stage?.show(8, 0));
  const log = await positions(page);
  expect(log.slice(-2)).toEqual([
    [8, 0],
    [8, 0],
  ]);
  expect(log.slice(0, -2).every(([slide]) => slide === 2 || slide === 3)).toBe(true);
});

test("the stage passes axe before and after the frame shows", async ({ page }) => {
  await open(page);
  const audit = async () =>
    expect(
      (
        await new AxeBuilder({ page })
          .include("#root")
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
  await audit();
  await page.evaluate(() => window.stage?.show(4, 0));
  await expect(page.locator("#root iframe")).toBeVisible();
  await audit();
});

test("the poster gives way to the frame with no moment where neither shows", async ({ page }) => {
  await open(page);
  const stage = page.getByRole("img", { name: "The deck the agent built" });
  await expect(stage.locator("picture img")).toBeVisible();
  await page.evaluate(() => window.stage?.show(4, 0));
  await expect(stage.locator("picture")).toHaveCount(0);
  await expect(stage.locator("iframe")).toBeVisible();
  const log = await page.evaluate(() => window.swapLog);
  expect(log[0]).toEqual({ poster: true, frame: false });
  expect(log.at(-1)).toEqual({ poster: false, frame: true });
  expect(log.filter((entry) => !entry.poster && !entry.frame)).toEqual([]);
});
