import { expect } from "@playwright/test";
import { boot, step, test } from "./fixtures/embed.fixture";

test("A built deck boots at a hash and acknowledges every command with the visible card", async ({
  page,
  embedURL,
}) => {
  await boot(page, embedURL);
  const messages = await page.evaluate(() => window.embedMessages);
  expect(messages.map((m) => m.type)).toEqual([
    "decks:ready",
    "decks:meta",
    "decks:state",
    "decks:state",
  ]);
  expect(messages[1]).toEqual({
    type: "decks:meta",
    title: "Embed fixture",
    slides: 4,
    slideTitles: ["Cover", "Story", "Stage", "Error"],
  });
  expect(messages[2]).toMatchObject({
    slide: 2,
    beat: 0,
    beats: 2,
    direction: null,
    settled: false,
  });
  expect(messages[3]).toMatchObject({
    slide: 2,
    beat: 0,
    lead: "Lead 0",
    body: "Body 0",
    direction: null,
    settled: true,
  });
  const cases: [string, Record<string, number>, Record<string, unknown>][] = [
    ["next", {}, { slide: 2, beat: 1, lead: "Lead 1", body: "Body 1", direction: "forward" }],
    ["prev", {}, { slide: 2, beat: 0, direction: "backward" }],
    ["go", { slide: 2, beat: 2 }, { slide: 2, beat: 2, lead: "Lead 2", direction: "forward" }],
    ["next", {}, { slide: 3, beat: 0, beats: 1, lead: "", body: "", direction: "forward" }],
    ["prev", {}, { slide: 2, beat: 2, lead: "Lead 2", direction: "backward" }],
    ["nextSlide", {}, { slide: 3, beat: 0, direction: "forward" }],
    ["go", { slide: 3, beat: 1 }, { slide: 3, beat: 1 }],
    ["prevSlide", {}, { slide: 2, beat: 0, direction: "backward" }],
    ["go", { slide: -10, beat: -5 }, { slide: 1, beat: 0, lead: "", body: "" }],
    ["prev", {}, { slide: 1, beat: 0, direction: null }],
    ["go", { slide: 1, beat: 0 }, { slide: 1, beat: 0, direction: null }],
    ["go", { slide: 200, beat: 0 }, { slide: 4, beat: 0 }],
    ["nextSlide", {}, { slide: 4, beat: 0, direction: null }],
    ["go", { slide: 2, beat: 200 }, { slide: 2, beat: 2, beats: 2 }],
  ];
  for (const [index, [cmd, extra, wanted]] of cases.entries()) {
    const states = await step(page, cmd, index + 1, extra);
    expect(states.map((m) => m.settled)).toEqual([false, true]);
    expect(states[1]).toMatchObject(wanted);
  }
});

test("Only the newest of three rapid commands settles, including a pending slide transition", async ({
  page,
  embedURL,
}) => {
  await boot(page, embedURL);
  const deck = page.frames().find((candidate) => candidate.parentFrame());
  if (!deck) throw new Error("Missing iframe");
  await deck.evaluate(() => {
    const hold = document.body.animate([{ opacity: 1 }, { opacity: 0.99 }], { duration: 1000 });
    hold.id = "embed-hold";
    hold.playbackRate = 0;
  });
  await page.evaluate(() => {
    window.sendEmbed({ type: "decks:cmd", cmd: "next", requestId: 101 });
  });
  await page.waitForFunction(() =>
    window.embedMessages.some((m) => m.requestId === 101 && m.settled === false),
  );
  await page.evaluate(() => {
    for (const requestId of [102, 103])
      window.sendEmbed({ type: "decks:cmd", cmd: "next", requestId });
  });
  await page.waitForFunction(() =>
    window.embedMessages.some((m) => m.requestId === 103 && m.settled === false),
  );
  await deck.evaluate(() => {
    for (const animation of document.getAnimations())
      if (animation.id === "embed-hold") animation.cancel();
  });
  await page.waitForFunction(() =>
    window.embedMessages.some((m) => m.requestId === 103 && m.settled === true),
  );
  const settled = await page.evaluate(() =>
    window.embedMessages.filter((m) => m.settled === true && typeof m.requestId === "number"),
  );
  expect(settled).toEqual([expect.objectContaining({ requestId: 103, slide: 3, beat: 0 })]);
  expect(
    await page.evaluate(() =>
      window.embedMessages
        .filter((m) => m.settled === false && [101, 102, 103].includes(Number(m.requestId)))
        .map((m) => [m.requestId, m.slide, m.beat]),
    ),
  ).toEqual([
    [101, 2, 1],
    [102, 2, 2],
    [103, 3, 0],
  ]);
  await step(page, "go", 104, { slide: 2, beat: 0 });
  await page.evaluate(() => {
    window.sendEmbed({ type: "decks:cmd", cmd: "nextSlide", requestId: 105 });
    window.sendEmbed({ type: "decks:cmd", cmd: "prev", requestId: 106 });
  });
  await page.waitForFunction(() =>
    window.embedMessages.some((m) => m.requestId === 106 && m.settled === true),
  );
  expect(
    await page.evaluate(() =>
      window.embedMessages.filter((m) => m.requestId === 105 && m.settled === true),
    ),
  ).toEqual([]);
  expect(
    await page.evaluate(() =>
      window.embedMessages.find((m) => m.requestId === 106 && m.settled === true),
    ),
  ).toMatchObject({ slide: 2, beat: 2, lead: "Lead 2" });
});

test("A move reversed before it presents still acknowledges the final request", async ({
  page,
  embedURL,
}) => {
  await boot(page, embedURL);
  await page.evaluate(() => {
    window.sendEmbed({ type: "decks:cmd", cmd: "nextSlide", requestId: 108 });
    window.sendEmbed({ type: "decks:cmd", cmd: "prevSlide", requestId: 109 });
  });
  await page.waitForFunction(() =>
    window.embedMessages.some((m) => m.requestId === 109 && m.settled === true),
  );
  expect(
    await page.evaluate(() =>
      window.embedMessages.find((m) => m.requestId === 109 && m.settled === true),
    ),
  ).toMatchObject({ slide: 2, beat: 0, lead: "Lead 0" });
});

test("Arrow keys ask the parent, inputs retain their keys, and an owning stage uses the routing helper", async ({
  page,
  embedURL,
}) => {
  await boot(page, embedURL);
  const frame = page.frameLocator("iframe");
  const deck = page.frames().find((candidate) => candidate.parentFrame());
  if (!deck) throw new Error("Missing iframe");
  await frame.getByRole("heading", { name: "Story slide" }).click();
  for (const key of ["ArrowRight", "ArrowLeft", "Shift+ArrowRight", "Shift+ArrowLeft"]) {
    await page.keyboard.press(key);
    await deck.evaluate(() => window.__deck?.settled());
    expect(deck.url()).toMatch(/#\/2$/);
  }
  await frame.getByRole("textbox", { name: "Caption input" }).fill("typing");
  await page.keyboard.press("ArrowRight");
  await step(page, "go", 201, { slide: 3, beat: 0 });
  await frame.getByRole("button", { name: "Stage keys" }).focus();
  await page.keyboard.press("ArrowRight");
  await deck.evaluate(() => window.__deck?.settled());
  expect(deck.url()).toMatch(/#\/3$/);
  await step(page, "go", 202, { slide: 3, beat: 0 });
  const messages = await page.evaluate(() => window.embedMessages);
  expect(messages.filter((m) => m.type === "decks:navigate").map((m) => m.cmd)).toEqual([
    "next",
    "prev",
    "nextSlide",
    "prevSlide",
    "next",
  ]);
  expect(messages.some((m) => m.type === "decks:interaction")).toBe(true);
  expect(messages.find((m) => m.requestId === 202 && m.settled === true)).toMatchObject({
    slide: 3,
    beat: 0,
  });
});

test("A directly opened bridge URL keeps normal keys and the owning stage navigates locally", async ({
  page,
  embedURL,
}) => {
  const messages: unknown[] = [];
  await page.exposeFunction("recordDeckMessage", (message: unknown) => messages.push(message));
  await page.addInitScript(() =>
    window.addEventListener("message", (event) => {
      if (event.data?.type?.startsWith("decks:"))
        Reflect.get(window, "recordDeckMessage")(event.data);
    }),
  );
  await page.goto(`${embedURL}index.html?decks-bridge=1#/2`);
  await expect(page.getByText("Lead 0", { exact: true })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("Lead 1", { exact: true })).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.getByRole("button", { name: "Stage keys" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/#\/3\?clicks=1$/);
  await page.evaluate(() => window.__deck?.settled());
  expect(messages).toEqual([]);
});

for (const mode of ["no flag", "cross origin"]) {
  test(`An iframe with ${mode} stays silent and ignores commands`, async ({ page, embedURL }) => {
    const src = new URL(
      `${embedURL}index.html${mode === "cross origin" ? "?decks-bridge=1" : ""}#/2`,
    );
    if (mode === "cross origin")
      src.hostname = src.hostname === "localhost" ? "127.0.0.1" : "localhost";
    await page.goto(`${embedURL}embed-host.html?src=${encodeURIComponent(src.href)}`);
    const frame = page.frameLocator("iframe");
    await expect(frame.getByText("Lead 0", { exact: true })).toBeVisible();
    await page.evaluate(() => window.sendEmbed({ type: "decks:cmd", cmd: "next", requestId: 301 }));
    await frame.getByRole("heading", { name: "Story slide" }).click();
    await page.keyboard.press("ArrowRight");
    await expect(frame.getByText("Lead 1", { exact: true })).toBeVisible();
    const deck = page.frames().find((candidate) => candidate.parentFrame());
    if (!deck) throw new Error("Missing iframe");
    await deck.evaluate(() => window.__deck?.settled());
    expect(await page.evaluate(() => window.embedMessages)).toEqual([]);
  });
}

test("A thrown render error is reported to the host and the deck can navigate away", async ({
  page,
  embedURL,
}) => {
  await boot(page, embedURL);
  await step(page, "go", 401, { slide: 4, beat: 0 });
  await step(page, "next", 402);
  await expect(
    page.frameLocator("iframe").getByText(/failed to render: Fixture render failed/),
  ).toBeVisible();
  expect(
    await page.evaluate(() => window.embedMessages.filter((m) => m.type === "decks:error")),
  ).toEqual([{ type: "decks:error", message: "Fixture render failed" }]);
  const states = await step(page, "go", 403, { slide: 2, beat: 1 });
  expect(states[1]).toMatchObject({ lead: "Lead 1", body: "Body 1" });
});

test("Messages from another sender and malformed commands do not navigate or acknowledge", async ({
  page,
  embedURL,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await boot(page, embedURL);
  const deck = page.frames().find((candidate) => candidate.parentFrame());
  if (!deck) throw new Error("Missing iframe");
  await deck.evaluate(() =>
    window.postMessage({ type: "decks:cmd", cmd: "next", requestId: 501 }, window.location.origin),
  );
  await page.evaluate(() => {
    for (const data of [
      null,
      { type: "other", cmd: "next" },
      { type: "decks:cmd", cmd: "other" },
      { type: "decks:cmd", cmd: "go", slide: "2", beat: 0 },
    ])
      window.sendEmbed(data);
  });
  const states = await step(page, "next", 502);
  expect(states[1]).toMatchObject({ slide: 2, beat: 1 });
  expect(
    await page.evaluate(() => window.embedMessages.filter((m) => m.type === "decks:state")),
  ).toHaveLength(4);
  expect(errors).toEqual([]);
});

test("Late and hidden cards keep the host caption in step with the visible copy", async ({
  page,
  embedURL,
}) => {
  await boot(page, embedURL);
  const frame = page.frameLocator("iframe");
  await frame.getByRole("button", { name: "Late caption" }).click();
  await page.waitForFunction(() =>
    window.embedMessages.some((m) => m.settled === true && m.lead === "Late lead"),
  );
  await frame.getByRole("button", { name: "Hide caption" }).click();
  await page.waitForFunction(() =>
    window.embedMessages.some((m) => m.settled === true && m.lead === "" && m.slide === 2),
  );
  await frame.getByRole("button", { name: "Show caption" }).click();
  await page.waitForFunction(() =>
    window.embedMessages.some((m) => m.settled === true && m.lead === "Visible lead"),
  );
  await expect(frame.getByText("Hidden lead", { exact: true })).toBeHidden();
});
