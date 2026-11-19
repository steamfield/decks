import { expect } from "@playwright/test";
import { bootShow, readLog, record, step, test } from "./fixtures/embed-show.fixture";

const between = (values: (string | null)[]) =>
  values.some((value) => value !== null && Number(value) > 0 && Number(value) < 1);

test("show lands on the last beat of an entrance slide with no transition or entrance motion", async ({
  page,
  embedURL,
}) => {
  const frame = await bootShow(page, embedURL, 1);
  await record(frame);
  const messages = await step(page, "show", 1, { slide: 2, beat: 2 });
  expect(messages.at(-1)).toMatchObject({
    type: "decks:state",
    requestId: 1,
    slide: 2,
    beat: 2,
    beats: 2,
    settled: true,
    direction: "forward",
  });
  await expect(frame.locator("[data-deck-active]")).toHaveAttribute("data-deck-slide", "2");
  await expect(frame.getByRole("heading", { name: "Entrance beat 2" })).toBeVisible();
  const log = await readLog(frame);
  expect(log["data-deck-transition"]).toEqual([]);
  expect(log["data-deck-nav"]).toEqual([]);
  expect(log.opacity.every((value) => value === "1")).toBe(true);
  expect(log["data-deck-motion"]).toEqual(["instant", "live"]);
});

test("go to the same slide plays the push transition and the entrance that show skips", async ({
  page,
  embedURL,
}) => {
  const frame = await bootShow(page, embedURL, 1);
  await record(frame);
  await step(page, "go", 1, { slide: 2, beat: 0 });
  const log = await readLog(frame);
  expect(log["data-deck-transition"]).toContain("push");
  expect(log["data-deck-nav"]).toContain("forward");
  expect(between(log.opacity)).toBe(true);
  expect(log.opacity.at(-1)).toBe("1");
  expect(log["data-deck-motion"]).toEqual([]);
});

test("go with a backward direction plays a later slide backward and reports it", async ({
  page,
  embedURL,
}) => {
  const frame = await bootShow(page, embedURL, 1);
  await record(frame);
  const messages = await step(page, "go", 1, { slide: 2, beat: 0, direction: "backward" });
  expect(messages.at(-1)).toMatchObject({
    requestId: 1,
    slide: 2,
    settled: true,
    direction: "backward",
  });
  const log = await readLog(frame);
  expect(log["data-deck-transition"]).toContain("push");
  expect(log["data-deck-nav"]).toContain("backward");
  expect(log["data-deck-nav"]).not.toContain("forward");
});

test("show to the current position reports settled and restores live motion", async ({
  page,
  embedURL,
}) => {
  const frame = await bootShow(page, embedURL, 2);
  const messages = await step(page, "show", 1, { slide: 2, beat: 0 });
  expect(messages.at(-1)).toMatchObject({
    requestId: 1,
    slide: 2,
    beat: 0,
    settled: true,
    direction: null,
  });
  await expect(frame.locator("html")).toHaveAttribute("data-deck-motion", "live");
});

test("under reduced motion show keeps motion instant throughout and after", async ({
  page,
  embedURL,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const frame = await bootShow(page, embedURL, 1);
  await record(frame);
  await step(page, "show", 1, { slide: 2, beat: 2 });
  const log = await readLog(frame);
  expect(log["data-deck-motion"].length).toBeGreaterThan(0);
  expect(log["data-deck-motion"].every((value) => value === "instant")).toBe(true);
  await expect(frame.locator("html")).toHaveAttribute("data-deck-motion", "instant");
});

test("a go sent before a show settles runs live and leaves no instant motion behind", async ({
  page,
  embedURL,
}) => {
  const frame = await bootShow(page, embedURL, 2);
  await record(frame);
  await page.evaluate(() => {
    window.sendEmbed({ type: "decks:cmd", cmd: "show", slide: 1, beat: 0, requestId: 1 });
    window.sendEmbed({ type: "decks:cmd", cmd: "go", slide: 2, beat: 0, requestId: 2 });
  });
  await page.waitForFunction(() =>
    window.embedMessages.some((m) => m.requestId === 2 && m.settled === true),
  );
  const log = await readLog(frame);
  expect(log["data-deck-nav"]).toContain("forward");
  expect(log["data-deck-motion"].at(-1)).toBe("live");
  await expect(frame.locator("html")).toHaveAttribute("data-deck-motion", "live");
});

test("a show sent before a go settles lands without motion and then restores live motion", async ({
  page,
  embedURL,
}) => {
  const frame = await bootShow(page, embedURL, 1);
  await record(frame);
  await page.evaluate(() => {
    window.sendEmbed({ type: "decks:cmd", cmd: "go", slide: 2, beat: 0, requestId: 1 });
    window.sendEmbed({ type: "decks:cmd", cmd: "show", slide: 2, beat: 2, requestId: 2 });
  });
  await page.waitForFunction(() =>
    window.embedMessages.some((m) => m.requestId === 2 && m.settled === true),
  );
  await expect(frame.getByRole("heading", { name: "Entrance beat 2" })).toBeVisible();
  const log = await readLog(frame);
  expect(log["data-deck-motion"]).toEqual(["instant", "live"]);
  await expect(frame.locator("html")).toHaveAttribute("data-deck-motion", "live");
});

test("go to the current position with a direction leaves the next move its natural direction", async ({
  page,
  embedURL,
}) => {
  const frame = await bootShow(page, embedURL, 1);
  await frame.getByRole("heading", { name: "Show cover" }).click();
  await record(frame);
  await step(page, "go", 1, { slide: 1, beat: 0, direction: "backward" });
  // A viewer's key: a later command would set its own direction and hide a leaked one.
  await page.keyboard.press("PageDown");
  await page.waitForFunction(() =>
    window.embedMessages.some((m) => m.slide === 2 && m.settled === true),
  );
  const log = await readLog(frame);
  expect(log["data-deck-transition"]).toContain("push");
  expect(log["data-deck-nav"]).toContain("forward");
  expect(log["data-deck-nav"]).not.toContain("backward");
});

test("a viewer's move while a show settles plays its entrance live", async ({ page, embedURL }) => {
  const frame = await bootShow(page, embedURL, 2);
  await frame.getByRole("heading", { name: "Entrance beat 0" }).click();
  await record(frame);
  // A paused finite animation holds settled(), so the key press lands before the show settles.
  await frame.evaluate(() => {
    const hold = document.body.animate([{ opacity: 1 }, { opacity: 0.99 }], { duration: 1000 });
    hold.id = "show-hold";
    hold.playbackRate = 0;
  });
  await page.evaluate(() =>
    window.sendEmbed({ type: "decks:cmd", cmd: "show", slide: 1, beat: 0, requestId: 1 }),
  );
  await page.waitForFunction(() =>
    window.embedMessages.some((m) => m.requestId === 1 && m.settled === false),
  );
  await expect(frame.locator("html")).toHaveAttribute("data-deck-motion", "instant");
  const before = await page.evaluate(() => window.embedMessages.length);
  await page.keyboard.press("PageDown");
  await expect(frame.locator("[data-deck-active]")).toHaveAttribute("data-deck-slide", "2");
  await frame.evaluate(() => {
    for (const animation of document.getAnimations())
      if (animation.id === "show-hold") animation.cancel();
  });
  await page.waitForFunction(
    (from) => window.embedMessages.slice(from).some((m) => m.settled === true),
    before,
  );
  const settledStates = await page.evaluate(
    (from) => window.embedMessages.slice(from).filter((m) => m.settled === true),
    before,
  );
  expect(settledStates).toEqual([
    expect.objectContaining({ slide: 2, beat: 0, direction: "forward" }),
  ]);
  expect(settledStates[0]).not.toHaveProperty("requestId");
  const log = await readLog(frame);
  expect(log["data-deck-motion"]).toEqual(["instant", "live"]);
  expect(between(log.opacity)).toBe(true);
  expect(log.opacity.at(-1)).toBe("1");
});
