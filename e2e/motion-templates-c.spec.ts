import { readFile } from "node:fs/promises";
import { expect, type Route } from "@playwright/test";
import { PNG } from "pngjs";
import { kitFixture } from "./fixtures/kit.fixture";
import { test } from "./fixtures/motion.fixture";
import { position, settled, slideNo } from "./fixtures/motion-gallery";

const demos = [
  [
    "timeline-sweep",
    ["Dock trials begin.", "Passenger service opens.", "The evening route opens."],
  ],
  ["process-flow", ["Scan the boarding pass.", "Assign a berth.", "Release the gangway."]],
  ["comparison-split", ["Paper tickets", "Mobile passes"]],
  ["myth-fact", ["The tide sets the departure time.", "The ramp adjusts to the tide."]],
  ["spotlight", ["Harbour entrance"]],
] satisfies [string, string[]][];

for (const [name, words] of demos) {
  test(`each entrance in the live slide plays and settles within about 1.2 s of virtual time per beat (${name})`, async ({
    page,
    deck,
    motionClock,
  }) => {
    await deck.goto(slideNo(`mt-${name}`));
    await motionClock.pauseAt();
    for (const [i, word] of words.entries()) {
      const graphic = () =>
        page.locator("[data-deck-active]").evaluate(
          (slide, { name, i }) => {
            const heading = slide.querySelectorAll("h1")[1];
            let target: Element | null | undefined = heading;
            if (name === "timeline-sweep")
              target = slide.querySelector("ol")?.previousElementSibling;
            if (name === "process-flow")
              target = slide.querySelectorAll("li")[i]?.firstElementChild;
            if (name === "comparison-split" && i === 1)
              target = heading?.parentElement?.nextElementSibling;
            if (name === "myth-fact" && i === 1) target = heading?.firstElementChild;
            if (name === "spotlight") target = slide.querySelector("svg circle");
            if (!target) throw new Error(`Missing graphic for ${name} beat ${i}`);
            const { left, transform, backgroundSize, strokeDasharray } = getComputedStyle(target);
            return [left, transform, backgroundSize, strokeDasharray];
          },
          { name, i },
        );
      await deck.press("ArrowRight");
      await motionClock.step(180);
      const moving = await graphic();
      expect(await page.evaluate(() => window.__deck?.busy().length)).toBeGreaterThan(0);
      await motionClock.step(1020);
      expect(await graphic()).not.toEqual(moving);
      expect(await page.evaluate(() => window.__deck?.busy())).toEqual([]);
      await expect(
        page.locator("[data-deck-active]").getByText(word, { exact: true }),
      ).toBeVisible();
    }
  });

  test(`each slide forward, back, two quick clicks and reload at the last click (${name})`, async ({
    page,
  }) => {
    const no = slideNo(`mt-${name}`);
    const slide = page.locator("[data-deck-active]");
    const parts = words.map((word) => slide.getByText(word, { exact: true }));
    await page.goto(`/#/${no}`);
    await position(page, no);
    for (const part of parts) await expect(part).toBeHidden();
    for (const [i, part] of parts.entries()) {
      await page.keyboard.press("ArrowRight");
      await position(page, no, i + 1);
      await settled(page, no, i + 1);
      await expect(part).toBeVisible();
    }
    const last = parts[parts.length - 1];
    if (!last) throw new Error(`Missing demo text for ${name}`);
    await page.keyboard.press("ArrowLeft");
    await position(page, no, parts.length - 1);
    await settled(page, no, parts.length - 1);
    await expect(last).toBeHidden();
    if (parts.length > 1) {
      await page.keyboard.press("ArrowLeft");
      await position(page, no, parts.length - 2);
      await settled(page, no, parts.length - 2);
      await page.keyboard.press("ArrowRight");
    } else {
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("ArrowLeft");
    }
    await page.keyboard.press("ArrowRight");
    await position(page, no, parts.length);
    await settled(page, no, parts.length);
    for (const part of parts) await expect(part).toBeVisible();
    const speech = await slide.ariaSnapshot();
    for (const word of words) expect(speech.split(word)).toHaveLength(2);

    // Capture the first animation frame with mounted content, before an accidental replay could finish.
    function recordPose(labels: string[]) {
      function sample() {
        const slide = document.querySelector("[data-deck-active]");
        const img = slide?.querySelector("img");
        if (
          !slide ||
          !labels.every((word) => slide.textContent?.includes(word)) ||
          (img instanceof HTMLImageElement && !img.complete)
        ) {
          requestAnimationFrame(sample);
          return;
        }
        const artwork = Array.from(slide.querySelectorAll(":scope > :not([data-deck-layer]) *"));
        Reflect.set(
          window,
          "templatePose",
          artwork.map((node) => {
            const { left, opacity, visibility, transform, backgroundSize, strokeDasharray } =
              getComputedStyle(node);
            return [left, opacity, visibility, transform, backgroundSize, strokeDasharray];
          }),
        );
      }
      requestAnimationFrame(sample);
    }
    await page.evaluate(recordPose, words);
    const live = await page.waitForFunction(() => Reflect.get(window, "templatePose"));
    const expected = await live.jsonValue();
    await page.addInitScript(recordPose, words);
    await page.reload();
    await expect
      .poll(() => page.evaluate(() => Reflect.get(window, "templatePose")))
      .toEqual(expected);
  });
}

function isRose(pixel: Buffer, i: number) {
  return pixel[i] === 200 && pixel[i + 1] === 61 && pixel[i + 2] === 213;
}

const themed = test.extend<object, { themedURL: string }>({
  themedURL: [
    async ({ deckServer }, use) => {
      const files: Record<string, string> = {
        "public/nested/field.svg":
          '<svg xmlns="http://www.w3.org/2000/svg" width="520" height="360"><rect width="520" height="360" fill="rgb(80,80,80)"/></svg>',
        "setup.ts": `import { installTheme, resolveTheme } from "@steamfield/decks/kit";
// Resolve public images as a deck deployed in a subdirectory would.
const base = document.createElement("base"); base.href = "/nested/"; document.head.prepend(base);
installTheme(resolveTheme({surfaces:{canvas:"#ffffff"},ramps:{rose:["#775580", "#a25390", "#c83dd5", "#ed9bf5"]}}));`,
      };
      for (const [index, [name]] of demos.entries()) {
        const file = `slides/${60 + index}-mt-${name}.mdx`;
        const slide = await readFile(`examples/motion/${file}`, "utf8");
        files[file] = slide
          .replace("y={0.5}", "y={0.27}")
          .replace('accent="rose"', "")
          .replace("at={1}", `accent="rose" at={${index === 0 ? 0 : 1}}`);
      }
      const server = await kitFixture(deckServer, files);
      try {
        await use(server.url);
      } finally {
        await server.close();
      }
    },
    { scope: "worker" },
  ],
});

for (const [index, [name, words]] of demos.entries()) {
  themed(
    `the accent prop changes the accent colour to that hue's step 3 (${name})`,
    async ({ page, themedURL }) => {
      const click = words.length - (index === 0 ? 1 : 0);
      await page.goto(new URL(`?motion=instant#/${index + 1}?clicks=${click}`, themedURL).href);
      const active = page.locator("[data-deck-active]");
      await expect(
        active.getByText(words[words.length - 1] ?? name, { exact: true }),
      ).toBeVisible();
      const image = PNG.sync.read(await active.screenshot());
      const painted = image.data.some((_, i) => i % 4 === 0 && isRose(image.data, i));
      expect(painted, name).toBe(true);
      if (name === "comparison-split")
        await expect(active.getByRole("list").first()).toHaveCSS("list-style-type", "disc");
      if (name === "process-flow") {
        const boxes = await active.getByRole("listitem").evaluateAll((items) =>
          items.map((item) => {
            const r = item.getBoundingClientRect();
            return { left: r.left, right: r.right, middle: r.top + r.height / 2 };
          }),
        );
        const [first, second] = boxes;
        if (!first || !second) throw new Error("Missing adjacent process boxes");
        const frame = PNG.sync.read(await page.screenshot());
        for (let x = Math.ceil(first.right); x < Math.floor(second.left); x++) {
          const y = Math.ceil(first.middle);
          const offset = (y * frame.width + x) * 4;
          expect(
            frame.data.readUInt8(offset + 2) - frame.data.readUInt8(offset + 1),
            "connector reaches both boxes",
          ).toBeGreaterThan(20);
        }
      }
    },
  );
}

themed(
  "spotlight places its ring at x and y of the rendered image and throws outside 0..1",
  async ({ page, themedURL }) => {
    await page.goto(new URL("?motion=instant#/5?clicks=1", themedURL).href);
    const active = page.locator("[data-deck-active]");
    await expect(active.getByText("Harbour entrance")).toBeVisible();
    const photo = active.getByRole("img", { name: "Six paths meeting at a buoy" });
    expect(
      await photo.evaluate(
        (el) => el instanceof HTMLImageElement && new URL(el.currentSrc).pathname,
      ),
    ).toBe("/nested/field.svg");
    expect(await photo.evaluate((el) => el instanceof HTMLImageElement && el.naturalWidth)).toBe(
      520,
    );
    const img = PNG.sync.read(await photo.screenshot());
    const cx = img.width * 0.54,
      cy = img.height * 0.27;
    const xs: number[] = [],
      ys: number[] = [];
    for (let y = 0; y < img.height; y++)
      for (let x = 0; x < img.width; x++) {
        const i = (y * img.width + x) * 4;
        if (Math.abs(y - cy) > 2 && isRose(img.data, i)) {
          xs.push(x);
          ys.push(y);
        }
      }
    expect(Math.abs((Math.min(...xs) + Math.max(...xs)) / 2 - cx)).toBeLessThan(2);
    expect(Math.abs((Math.min(...ys) + Math.max(...ys)) / 2 - cy)).toBeLessThan(2);
    expect(img.data[0]).toBeLessThan(80);
    expect(img.data[(Math.round(cy) * img.width + Math.round(cx)) * 4]).toBe(80);
  },
);

themed(
  "returning from the next slide keeps the playhead above the last date",
  async ({ page, themedURL }) => {
    await page.goto(new URL("#/1?clicks=2", themedURL).href);
    const list = page.locator("[data-deck-active]").getByRole("list");
    const dot = async () => {
      const box = await list.boundingBox();
      if (!box) throw new Error("Missing timeline");
      const frame = PNG.sync.read(await page.screenshot());
      const row = Math.round(box.y) - 1;
      const xs: number[] = [];
      for (let x = Math.ceil(box.x); x < box.x + box.width; x++) {
        const i = 4 * (row * frame.width + x);
        if (isRose(frame.data, i)) xs.push(x);
      }
      expect(xs.length).toBeGreaterThan(0);
      return (Math.min(...xs) + Math.max(...xs)) / 2;
    };
    await expect(list.getByText("July")).toBeVisible();
    const before = await dot();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("heading", { name: "Process flow" })).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await expect(list.getByText("July")).toBeVisible();
    await page.evaluate(() => window.__deck?.settled());
    expect(await dot()).toBe(before);
    const date = await list.getByText("July").boundingBox();
    if (!date) throw new Error("Missing last date");
    expect(Math.abs(before - date.x - date.width / 2)).toBeLessThan(2);
  },
);

test("a cold image holds capture and a failed image leaves the label without a ring", async ({
  page,
}) => {
  const warnings: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "warning" && msg.text().includes("field.svg")) warnings.push(msg.text());
  });
  const pending = Promise.withResolvers<Route>();
  await page.route("**/field.svg", (route) => pending.resolve(route));
  const no = slideNo("mt-spotlight");
  await page.goto(`/?motion=instant#/${no}?clicks=1`, { waitUntil: "domcontentloaded" });
  await position(page, no, 1);
  const route = await pending.promise;
  const caption = page.getByText("Harbour entrance", { exact: true });
  await expect(caption).toBeHidden();
  expect(await page.evaluate(() => window.__deck?.busy().length)).toBeGreaterThan(0);
  await route.fulfill({ contentType: "image/svg+xml", body: "unreadable image" });
  await expect(caption).toBeVisible();
  await expect(page.locator("[data-deck-active] circle")).toBeHidden();
  await settled(page, no, 1);
  expect(warnings).toEqual(["spotlight: could not load field.svg"]);
});
