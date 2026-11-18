import { expect } from "@playwright/test";
import { kitFixture } from "./fixtures/kit.fixture";
import { test } from "./fixtures/motion.fixture";
import { position, settled, slideNo } from "./fixtures/motion-gallery";

const examples = [
  ["list-cascade", "Try the revised checklist", 3],
  ["quote-card", "Shift supervisor, demo interview", 1],
  ["section-wipe", "Where the handoff breaks", 1],
  ["agenda", "Handoff gaps", 1],
  ["end-card", "Take the checklist to your next shift.", 1],
] as const;

for (const [name, lastText, last] of examples) {
  test(`${name} goes forward, back, through two quick clicks and reloads at its last click`, async ({
    page,
  }) => {
    const no = slideNo(`mt-${name}`);
    await page.addInitScript(() => {
      const pose = () => {
        const slide = document.querySelector("[data-deck-active]");
        return Array.from(slide?.querySelectorAll("*") ?? [])
          .filter((node) => !node.closest("[data-deck-layer]"))
          .map((node) => {
            const style = getComputedStyle(node);
            return [
              node.textContent,
              style.opacity,
              style.visibility,
              style.clipPath,
              style.strokeDashoffset,
            ];
          });
      };
      Reflect.set(window, "readTemplatePose", pose);
      const frame = () => {
        if (document.querySelector("[data-deck-active] h1"))
          Reflect.set(window, "templateFirstPaint", pose());
        else requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    await page.goto(`/#/${no}`);
    await position(page, no);
    const active = page.locator("[data-deck-active]");
    const text = active.getByText(lastText, { exact: true });
    await expect(text).toBeAttached();
    await expect(text).toBeHidden();
    await page.keyboard.press("ArrowRight");
    await position(page, no, 1);
    await settled(page, no, 1);
    const first = name === "list-cascade" ? active.getByText("Read the field notes") : text;
    await expect(first).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await position(page, no);
    await settled(page, no, 0);
    await expect(first).toBeHidden();
    await page.keyboard.press("ArrowRight");
    if (last > 1) {
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("ArrowRight");
    } else {
      await page.keyboard.press("ArrowLeft");
      await page.keyboard.press("ArrowRight");
    }
    await position(page, no, last);
    await settled(page, no, last);
    await expect(text).toBeVisible();
    await expect(text).toBeInViewport({ ratio: 1 });
    const live = await page.evaluate(() => Reflect.get(window, "readTemplatePose")());
    await page.reload();
    await position(page, no, last);
    await expect
      .poll(() => page.evaluate(() => Reflect.get(window, "templateFirstPaint")))
      .toEqual(live);
  });
}

test("a conventional deck scales template text and uses the selected theme ramp", async ({
  page,
  deckServer,
}) => {
  const fixture = await kitFixture(deckServer, {
    "slides/01-templates.mdx": `---
clicks: 0
---

import { MotionTemplate } from "@steamfield/decks/kit";

<p className="od-body">Body reference</p>
<MotionTemplate template="list-cascade" items={["List item"]} />
<MotionTemplate template="agenda" items={["Agenda item"]} current={1} />
<MotionTemplate template="quote-card" quote="Quote" source="Source" accent="rose" />
<MotionTemplate template="section-wipe" title="Chapter" number="02" />
<MotionTemplate template="end-card" title="End" link="https://example.org" />`,
    "setup.ts": `import {installTheme, resolveTheme} from "@steamfield/decks/kit";
installTheme(resolveTheme({ramps: {rose: ["#501020", "#aa3040", "#dd6688", "#ffddee"]}}));`,
  });
  try {
    await page.goto(`${fixture.url}?motion=instant#/1`);
    const slide = page.locator("[data-deck-active]");
    await expect(slide.getByRole("figure").locator("svg")).toHaveCSS(
      "stroke",
      "rgb(221, 102, 136)",
    );
    const sizes = () =>
      slide.evaluate((root) =>
        ["Body reference", "List item", "Agenda item", "Source", "02", "https://example.org"].map(
          (text) => {
            const element = Array.from(root.querySelectorAll("p, span, figcaption, div, a")).find(
              (el) => (el.childElementCount === 0 || el.tagName === "A") && el.textContent === text,
            );
            if (!element) throw new Error(`Missing ${text}`);
            return parseFloat(getComputedStyle(element).fontSize);
          },
        ),
      );
    const before = await sizes();
    await page.keyboard.press("Control+Equal");
    await expect.poll(sizes).not.toEqual(before);
    const after = await sizes();
    after.forEach((size, index) => {
      expect(size).toBeGreaterThanOrEqual(after[0] ?? Infinity);
      expect(size).toBeGreaterThan(before[index] ?? Infinity);
    });
  } finally {
    await fixture.close();
  }
});

test("the section panel covers the canvas and clears the footer when it settles", async ({
  page,
  motionClock,
}) => {
  const no = slideNo("mt-section-wipe");
  await page.goto(`/#/${no}`);
  await position(page, no);
  await motionClock.pauseAt();
  const patch = () => page.screenshot({ clip: { x: 1810, y: 960, width: 8, height: 8 } });
  const canvas = await patch();
  await page.keyboard.press("ArrowRight");
  await motionClock.step(250);
  expect(await patch()).not.toEqual(canvas);
  await motionClock.step(1000);
  expect(await patch()).toEqual(canvas);
});

test("the quote marks draw on the entrance click", async ({ page }) => {
  const no = slideNo("mt-quote-card");
  await page.goto(`/#/${no}`);
  await position(page, no);
  const marks = page.getByRole("figure").locator("svg");
  const before = await marks.screenshot();
  await page.keyboard.press("ArrowRight");
  await settled(page, no, 1);
  expect(await marks.screenshot()).not.toEqual(before);
});

test("three quick forward keys carry a finished list into a complete quotation", async ({
  page,
}) => {
  const no = slideNo("mt-list-cascade");
  await page.goto(`/#/${no}?clicks=2`);
  await position(page, no, 2);
  for (let press = 0; press < 3; press++) await page.keyboard.press("ArrowRight");
  const quote = slideNo("mt-quote-card");
  await position(page, quote, 1);
  await settled(page, quote, 1);
  await expect(
    page.getByRole("heading", { name: "One missed handoff can hold up the whole crew." }),
  ).toBeVisible();
});

test("the current agenda item sits forward of the completed and upcoming items", async ({
  page,
}) => {
  const no = slideNo("mt-agenda");
  await page.goto(`/?motion=instant#/${no}?clicks=1`);
  await position(page, no, 1);
  const rows = page.locator("[data-deck-active]").getByRole("listitem");
  const current = rows.nth(1);
  await expect(current).toHaveCSS("color", "rgb(34, 211, 238)");
  await expect(rows.first()).toHaveCSS("color", "rgb(113, 113, 122)");
  await expect(rows.last()).toHaveCSS("color", "rgb(161, 161, 170)");
  const [doneX, currentX, laterX] = await rows.evaluateAll((items) =>
    items.map((item) => item.getBoundingClientRect().x),
  );
  expect(currentX).toBeGreaterThan(doneX ?? Infinity);
  expect(doneX).toBe(laterX);
});

for (const mode of ["presenter", "instant"] as const) {
  test(`${mode} shows the next quote on a click without advancing the motion clock`, async ({
    page,
    motionClock,
  }) => {
    const no = slideNo("mt-quote-card");
    const presenter = mode === "presenter";
    await page.goto(presenter ? `/#/presenter/${no}` : `/?motion=instant#/${no}`);
    const slide = page.locator(
      presenter ? '[data-deck-context="presenter"]' : "[data-deck-active]",
    );
    const credit = slide.getByText("Shift supervisor, demo interview");
    await expect(credit).toBeAttached();
    await expect(credit).toBeHidden();
    await motionClock.pauseAt();
    await page.keyboard.press("ArrowRight");
    await expect(credit).toHaveCSS("opacity", "1");
    await expect(credit).toBeVisible();
  });
}
