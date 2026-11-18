import { expect } from "@playwright/test";
import { PNG } from "pngjs";
import { startSettling } from "./fixtures/deck-driver";
import { kitFixture } from "./fixtures/kit.fixture";
import { test } from "./fixtures/motion.fixture";
import { position, settled, slideNo } from "./fixtures/motion-gallery";

const examples = [
  ["device-mockup", "trail-desk.svg", "Both crews can read the handoff before they leave."],
  ["photo-reveal", "north-inlet.svg", "Fog rolls through North Inlet."],
  ["logo-reveal", "inlet-press.svg", "Field guides for the long way home."],
] as const;

for (const [name, file, sentence] of examples) {
  test(`${name} goes forward, back, through two quick clicks and reloads at its last click`, async ({
    page,
  }) => {
    const no = slideNo(`mt-${name}`);
    await page.goto(`/#/${no}`);
    const slide = page.locator("[data-deck-active]");
    const text = slide.getByText(sentence, { exact: true });
    await position(page, no);
    await settled(page, no, 0);
    await expect(text).toBeAttached();
    await expect(text).toBeHidden();
    await page.keyboard.press("ArrowRight");
    await position(page, no, 1);
    await settled(page, no, 1);
    await expect(text).toBeVisible();
    await expect(slide.getByRole("img")).toBeInViewport({ ratio: 1 });
    await page.keyboard.press("ArrowLeft");
    await settled(page, no, 0);
    await expect(text).toBeHidden();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowRight");
    await position(page, no, 1);
    await settled(page, no, 1);
    await expect(text).toBeInViewport({ ratio: 1 });
    await expect(text).toHaveCSS("opacity", "1");
    const spoken = await slide.getByRole("figure").ariaSnapshot();
    expect(spoken.split(sentence)).toHaveLength(2);
    const live = await slide.getByRole("img").evaluate((img) => {
      const style = getComputedStyle(img);
      return [style.opacity, style.transform, style.clipPath];
    });
    await page.addInitScript((sentence) => {
      const frame = () => {
        const slide = document.querySelector("[data-deck-active]");
        const image = slide?.querySelector("img");
        if (!image?.complete || !image.naturalWidth) return requestAnimationFrame(frame);
        const style = getComputedStyle(image);
        const text = Array.from(slide?.querySelectorAll("*") ?? []).find(
          (el) => !el.childElementCount && el.textContent === sentence,
        );
        Reflect.set(window, "readyPose", [
          text?.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }),
          getComputedStyle(text ?? image).opacity,
          style.opacity,
          style.transform,
          style.clipPath,
        ]);
      };
      requestAnimationFrame(frame);
    }, sentence);
    await page.reload();
    await expect
      .poll(() => page.evaluate(() => Reflect.get(window, "readyPose")))
      .toEqual([true, "1", ...live]);
  });

  test(`${name} keeps its parts hidden and settled() pending until the image loads`, async ({
    page,
    motionClock,
  }) => {
    const no = slideNo(`mt-${name}`);
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(`**/${file}`, async (route) => {
      await gate;
      await route.continue();
    });
    try {
      await page.goto(`/#/${no}`, { waitUntil: "domcontentloaded" });
      await position(page, no);
      const slide = page.locator("[data-deck-active]");
      const text = slide.getByText(sentence);
      await expect(slide.locator("img")).toBeAttached(); // no role until it loads
      await page.keyboard.press("ArrowRight");
      await position(page, no, 1);
      await motionClock.pauseAt();
      const settling = await startSettling(page);
      await motionClock.step(1500);
      await expect(text).toBeHidden();
      await expect(slide.getByRole("img")).toHaveCount(0);
      expect(await settling.evaluate((state) => state.done)).toBe(false);
      release();
      await expect(text).toHaveCSS("opacity", "1");
      await expect(slide.getByRole("img")).toBeVisible();
      await motionClock.settle();
      expect(await settling.evaluate((state) => state.done)).toBe(true);
      await settling.dispose();
    } finally {
      release();
    }
  });
}

test("device-mockup draws each of the three devices with the screenshot inside its screen", async ({
  page,
  deckServer,
}) => {
  const devices = ["laptop", "phone", "browser"] as const;
  const slides = Object.fromEntries(
    devices.map((device, index) => [
      `slides/0${index + 1}-device.mdx`,
      `import { MotionTemplate } from "@steamfield/decks/kit";

<MotionTemplate template="device-mockup" device="${device}" src="./screen.svg" alt="Dispatch" />`,
    ]),
  );
  const fixture = await kitFixture(deckServer, {
    ...slides,
    "public/screen.svg":
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="teal"/></svg>',
  });
  try {
    const shapes = [];
    for (const [index, device] of devices.entries()) {
      await page.goto(`${fixture.url}?motion=instant#/${index + 1}`);
      const figure = page.locator("[data-deck-active]").getByRole("figure");
      const img = figure.getByRole("img", { name: "Dispatch" });
      await expect(img).toBeVisible();
      await expect(img).toHaveCSS("object-fit", "cover");
      await expect(img).toHaveCSS("object-position", "50% 0%");
      const outline = figure.locator("svg"); // the frame: decorative, hidden, found by tag
      const box = await img.boundingBox();
      const frame = await outline.boundingBox();
      if (!box || !frame) throw new Error(`Missing ${device} screen or frame`);
      expect(box.x).toBeGreaterThan(frame.x);
      expect(box.y).toBeGreaterThan(frame.y);
      expect(box.x + box.width).toBeLessThan(frame.x + frame.width);
      expect(box.y + box.height).toBeLessThan(frame.y + frame.height);
      expect(box.height > box.width).toBe(device === "phone");
      const pixels = PNG.sync.read(await outline.screenshot());
      // Paint at the laptop base, phone earpiece and browser control distinguishes the silhouettes.
      const samples = {
        laptop: [0.5, 0.965],
        phone: [0.5, 15 / 400],
        browser: [23 / 800, 21 / 500],
      } as const;
      const [x, y] = samples[device];
      const offset =
        (Math.floor(pixels.height * y) * pixels.width + Math.floor(pixels.width * x)) * 4;
      const [r, g, b] = pixels.data.subarray(offset, offset + 3);
      if (device === "laptop") expect([r, g, b]).toEqual([24, 24, 27]);
      else expect((g ?? 0) - (r ?? 0)).toBeGreaterThan(50);
      shapes.push(frame.width / frame.height);
    }
    expect(new Set(shapes).size).toBe(3);
    const body = '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="40"/>';
    await page.route("**/screen.svg", (route) =>
      route.fulfill({ contentType: "image/svg+xml", body }),
    );
    await page.reload();
    const fallback = page.locator("[data-deck-active]").getByRole("figure", { name: "Dispatch" });
    await expect(fallback).toHaveCSS("height", "0px");
    await expect(fallback).toHaveText("");
  } finally {
    await fixture.close();
  }
});

test("the accent prop changes the accent colour to that hue's step 3", async ({
  page,
  deckServer,
}) => {
  const fixture = await kitFixture(deckServer, {
    "slides/01-accents.mdx": `import { MotionTemplate } from "@steamfield/decks/kit";

<MotionTemplate template="device-mockup" src="./stamp.svg" device="browser" alt="App" accent="rose" />
<MotionTemplate template="photo-reveal" src="./stamp.svg" caption="The inlet" alt="Water" accent="rose" />
<MotionTemplate template="logo-reveal" src="./stamp.svg" alt="Stamp" accent="rose" />`,
    "public/stamp.svg":
      '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><circle cx="40" cy="40" r="30"/></svg>',
    "setup.ts": `import { installTheme, resolveTheme } from "@steamfield/decks/kit";
installTheme(resolveTheme({ramps: {rose: ["#501020", "#aa3040", "#dd6688", "#ffddee"]}}));`,
  });
  try {
    await page.goto(`${fixture.url}?motion=instant#/1`);
    const slide = page.locator("[data-deck-active]");
    await expect(slide.getByRole("img")).toHaveCount(3);
    const rose = "rgb(221, 102, 136)";
    // Only the device mockup draws a frame, a decorative hidden drawing found by its tag.
    await expect(slide.getByRole("figure").locator("svg")).toHaveCSS("stroke", rose);
    await expect(slide.getByText("The inlet")).toHaveCSS("border-left-color", rose);
    await expect(slide.getByRole("separator")).toHaveCSS("background-color", rose);
  } finally {
    await fixture.close();
  }
});

test("the laptop and its screen rise together during the entrance", async ({
  page,
  motionClock,
}) => {
  const no = slideNo("mt-device-mockup");
  // First build the laptop while hidden on its neighbor, then return and replay its entrance.
  const next = slideNo("mt-photo-reveal");
  await page.goto(`/#/${next}`);
  await position(page, next);
  await settled(page, next, 0);
  await page.keyboard.press("ArrowLeft");
  await position(page, no, 1);
  await page.keyboard.press("ArrowLeft");
  await position(page, no, 0);
  await settled(page, no, 0);
  const slide = page.locator("[data-deck-active]");
  const screen = slide.getByAltText("Trail Desk showing the lake and ridge patrols");
  const frame = slide.getByRole("figure", { includeHidden: true }).locator("svg"); // decorative
  const tops = async () =>
    Promise.all(
      [frame, screen].map((part) => part.evaluate((el) => el.getBoundingClientRect().top)),
    );
  await motionClock.pauseAt();
  const start = await tops();
  await page.keyboard.press("ArrowRight");
  await motionClock.step(160);
  const mid = await tops();
  await motionClock.step(1040);
  const end = await tops();
  for (const [index, top] of start.entries()) {
    expect(mid[index]).toBeLessThan(top);
    expect(end[index]).toBeLessThan(mid[index] ?? top);
  }
});

test("three quick next clicks enter the next image slide with the complete caption", async ({
  page,
}) => {
  await page.goto(`/#/${slideNo("mt-device-mockup")}`);
  await position(page, slideNo("mt-device-mockup"));
  for (let press = 0; press < 3; press++) await page.keyboard.press("ArrowRight");
  const no = slideNo("mt-photo-reveal");
  await position(page, no, 1);
  await settled(page, no, 1);
  const active = page.locator("[data-deck-active]");
  await expect(active.getByRole("heading", { name: examples[1][2] })).toHaveCSS("opacity", "1");
  await expect(active.getByText("Field sketch by Mira Chen")).toBeVisible();
});

test("the full-bleed photo settles as shade and credit rise from below", async ({
  page,
  motionClock,
}) => {
  const no = slideNo("mt-photo-reveal");
  await page.goto(`/#/${no}`);
  await position(page, no);
  await settled(page, no, 0);
  const slide = page.locator("[data-deck-active]");
  const img = slide.getByAltText("Pine silhouettes above the water at North Inlet");
  const shade = slide.getByRole("figure", { includeHidden: true }).locator("[aria-hidden]"); // decorative
  const credit = slide.getByText("Field sketch by Mira Chen");
  const top = () => shade.evaluate((el) => el.getBoundingClientRect().top);
  await motionClock.pauseAt();
  const start = await top();
  await page.keyboard.press("ArrowRight");
  await motionClock.step(360);
  const middle = await top();
  expect(middle).toBeLessThan(start);
  const opacity = Number(await credit.evaluate((el) => getComputedStyle(el).opacity));
  expect(opacity).toBeGreaterThan(0);
  expect(opacity).toBeLessThan(1);
  const near = await img.boundingBox();
  await motionClock.step(840);
  expect(await top()).toBeLessThan(middle);
  const full = await slide.boundingBox();
  expect(await img.boundingBox()).toEqual(full);
  expect(near?.width).toBeGreaterThan(full?.width ?? Infinity);
  await expect(credit).toHaveCSS("opacity", "1");
});

test("the logo settles to its natural scale as its mask opens", async ({ page, motionClock }) => {
  const no = slideNo("mt-logo-reveal");
  await page.goto(`/#/${no}`);
  await position(page, no);
  await settled(page, no, 0);
  const logo = page
    .locator("[data-deck-active]")
    .getByAltText("Inlet Press wordmark and folding map symbol");
  await motionClock.pauseAt();
  await page.keyboard.press("ArrowRight");
  await motionClock.step(150);
  const near = await logo.boundingBox();
  await motionClock.step(1050);
  const end = await logo.boundingBox();
  expect(near?.width).toBeGreaterThan(end?.width ?? Infinity);
});
