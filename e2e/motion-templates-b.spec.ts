import { expect } from "@playwright/test";
import { kitFixture } from "./fixtures/kit.fixture";
import { test } from "./fixtures/motion.fixture";
import { position, settled, slideNo } from "./fixtures/motion-gallery";
import { paintAt, paints } from "./fixtures/paint";

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
    // The quote marks draw in the rose ramp's step 3.
    await expect.poll(() => paints(slide.getByRole("figure"), 0xdd6688)).toBe(true);
    const texts = [
      "Body reference",
      "List item",
      "Agenda item",
      "Source",
      "02",
      "https://example.org",
    ];
    const sizes = () =>
      Promise.all(
        texts.map((text) =>
          slide
            .getByText(text, { exact: true })
            .evaluate((element) => parseFloat(getComputedStyle(element).fontSize)),
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

// The default theme's cyan step 3, which paints the section panel.
const cyan = 0x22d3ee;

test("the section panel covers the canvas and clears the footer when it settles", async ({
  page,
  motionClock,
}) => {
  const no = slideNo("mt-section-wipe");
  await page.goto(`/#/${no}`);
  await position(page, no);
  await motionClock.pauseAt();
  const corner = { x: 1814, y: 964 };
  const [before] = await paintAt(page, [corner]);
  expect(before).not.toBe(cyan);
  await page.keyboard.press("ArrowRight");
  await motionClock.step(250);
  expect(await paintAt(page, [corner])).toEqual([cyan]);
  await motionClock.step(1000);
  expect(await paintAt(page, [corner])).toEqual([before]);
});

test("the quote marks draw on the entrance click", async ({ page }) => {
  const no = slideNo("mt-quote-card");
  await page.goto(`/#/${no}`);
  await position(page, no);
  await settled(page, no, 0);
  const card = page.getByRole("figure");
  // The gallery's rose step 3, which the marks stroke in.
  const rose = 0xfb7185;
  await expect(card.getByText("Shift supervisor, demo interview")).toBeHidden();
  expect(await paints(card, rose)).toBe(false);
  await page.keyboard.press("ArrowRight");
  await settled(page, no, 1);
  await expect.poll(() => paints(card, rose)).toBe(true);
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
  await expect(current).toBeVisible();
  // Current in cyan step 3; completed in zinc 500 and upcoming in zinc 400, the muted text tones.
  await expect.poll(() => paints(current, cyan)).toBe(true);
  await expect.poll(() => paints(rows.first(), 0x71717a)).toBe(true);
  await expect.poll(() => paints(rows.last(), 0xa1a1aa)).toBe(true);
  expect(await paints(rows.first(), cyan)).toBe(false);
  const [doneX, currentX, laterX] = await rows.evaluateAll((items) =>
    items.map((item) => item.getBoundingClientRect().x),
  );
  expect(currentX).toBeGreaterThan(doneX ?? Infinity);
  expect(doneX).toBe(laterX);
});
