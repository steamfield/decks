import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect } from "@playwright/test";
import { loadDeck, scanSlides } from "@steamfield/decks/node";
import { test as editableTest, seekTransition, settled } from "./fixtures/deck.fixture";
import { test } from "./fixtures/motion.fixture";
import { slideNo } from "./fixtures/motion-gallery";

const push = slideNo("push");

const total = (await scanSlides(await loadDeck("examples/motion"))).length;

test("Every gallery slide and each overview and presenter instance shows its own number", async ({
  page,
}) => {
  await page.goto("/?motion=instant#/2");
  for (let no = 2; no <= total; no++) {
    await expect(page.locator("[data-deck-active]").getByLabel("Slide number")).toHaveText(
      `${no} / ${total}`,
    );
    if (no < total) await page.keyboard.press("ArrowDown");
  }
  await page.keyboard.press("o");
  for (let no = 2; no <= total; no++) {
    await expect(
      page
        .locator(`[data-deck-context="overview"][data-deck-slide="${no}"]`)
        .getByLabel("Slide number"),
    ).toHaveText(`${no} / ${total}`);
  }
  await page.goto(`/?motion=instant#/${push}`);
  await expect(page.locator("[data-deck-active]").getByLabel("Slide number")).toHaveText(
    `${push} / ${total}`,
  );
  const popup = page.waitForEvent("popup");
  await page.keyboard.press("p");
  const presenter = await popup;
  await expect(
    presenter.getByRole("region", { name: "Current slide" }).getByLabel("Slide number"),
  ).toHaveText(`${push} / ${total}`);
  await expect(
    presenter.getByRole("region", { name: "Next", exact: true }).getByLabel("Slide number"),
  ).toHaveText(`${push + 1} / ${total}`);
});

test("The layer holds its box still throughout a push transition", async ({ page }) => {
  await page.goto(`/#/${push}`);
  await expect(page.getByRole("heading", { name: "Keep moving." })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Change the scale.", includeHidden: true }),
  ).toHaveCount(1);
  await settled(page);
  const samples = seekTransition(page, "deck-layer-above", [0, 0.25, 0.5, 0.75, 1]);
  await page.keyboard.press("ArrowRight");
  const frames = await samples;
  for (const frame of frames) {
    expect(frame.transform).toBe(frames[0]?.transform);
    expect(frame.width).toBe(frames[0]?.width);
    expect(frame.height).toBe(frames[0]?.height);
  }
  expect(frames[0]?.root).not.toBe(frames.at(-1)?.root);
  expect(frames[0]?.width).toBe(1920);
  expect(frames[0]?.height).toBe("1080px");
  await expect(page.locator("[data-deck-active]").getByLabel("Slide number")).toHaveText(
    `${push + 1} / ${total}`,
  );
});

test("The cover opts out of both of the deck's layers", async ({ page }) => {
  await page.goto("/#/1");
  await expect(page.getByRole("heading", { name: "Motion", exact: true })).toBeVisible();
  await expect(
    page.locator('[data-deck-active] :is([data-deck-layer="above"], [data-deck-layer="below"])'),
  ).toHaveCount(0);
});

editableTest(
  "Adding editing and removing a layer takes effect in the running deck",
  async ({ page, editableDeck }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${editableDeck.url}#/3`);
    await expect(page.getByRole("heading", { name: "A deck component" })).toBeVisible();
    await mkdir(join(editableDeck.dir, "layers"), { recursive: true });
    const file = join(editableDeck.dir, "layers/below.tsx");
    const loaded = page.waitForEvent("load");
    await writeFile(
      file,
      "export default function Below() { return <span>Added backdrop</span>; }",
    );
    await loaded;
    await expect(
      page.locator("[data-deck-active]").getByText("Added backdrop", { exact: true }),
    ).toBeVisible();
    await writeFile(
      file,
      "export default function Below() { return <span>Edited backdrop</span>; }",
    );
    await expect(
      page.locator("[data-deck-active]").getByText("Edited backdrop", { exact: true }),
    ).toBeVisible();
    const removed = page.waitForEvent("load");
    await rm(file);
    await removed;
    await expect(page.getByText("Edited backdrop", { exact: true })).toHaveCount(0);
    await expect(page).toHaveURL(/#\/3$/);
    expect(errors).toEqual([]);
  },
);

editableTest(
  "Slide content paints over a below layer before during and after a push",
  async ({ page, editableDeck }) => {
    await mkdir(join(editableDeck.dir, "layers"), { recursive: true });
    await writeFile(
      join(editableDeck.dir, "layers/below.tsx"),
      'export default function Below() { return <div style={{position:"absolute",inset:0,background:"rgb(255,0,0)"}} />; }',
    );
    const body =
      '---\ntransition: push\n---\n<button style={{position:"absolute",left:100,top:100,width:200,height:200,background:"rgb(0,0,255)",border:0}} onClick={event => event.currentTarget.textContent = "Pressed"}>Press me</button>';
    await writeFile(join(editableDeck.dir, "slides/01-cover.mdx"), body);
    await writeFile(join(editableDeck.dir, "slides/02-steps.mdx"), body);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(editableDeck.url);
    await page.locator("[data-deck-active]").getByRole("button", { name: "Press me" }).click();
    await expect(page.getByRole("button", { name: "Pressed" })).toBeVisible();
    await expect(page).toHaveScreenshot("below-layer-before.png", {
      animations: "allow",
      maxDiffPixelRatio: 0.002,
    });
    await expect(
      page
        .locator('[data-deck-slide="2"]')
        .getByRole("button", { name: "Press me", includeHidden: true }),
    ).toBeAttached();
    await page.evaluate(() => {
      const start = document.startViewTransition.bind(document);
      document.startViewTransition = (update) => {
        const transition = start(update);
        window.e2eTransition = transition;
        return transition;
      };
    });
    await page.keyboard.press("ArrowRight");
    await page.evaluate(async () => {
      const captured = window.e2eTransition;
      if (!captured) throw new Error("Missing push transition");
      await captured.ready;
      for (const animation of document.getAnimations()) {
        animation.pause();
        animation.currentTime = Number(animation.effect?.getComputedTiming().duration) * 0.5;
      }
    });
    await expect(page).toHaveScreenshot("below-layer-during.png", {
      animations: "allow",
      maxDiffPixelRatio: 0.002,
    });
    await page.evaluate(async () => {
      for (const animation of document.getAnimations()) animation.finish();
    });
    await settled(page);
    await expect(page).toHaveURL(/#\/2$/);
    await expect(page).toHaveScreenshot("below-layer-after.png", {
      animations: "allow",
      maxDiffPixelRatio: 0.002,
    });
  },
);
