import { expect } from "@playwright/test";

import { keys, open, settle, test } from "./fixtures/transitions";

declare global {
  interface Window {
    e2eAnswers: number;
  }
}

test("A newcomer answered during a pending transition receives the logical position", async ({
  page,
  context,
}) => {
  await open(page);
  const responder = await context.newPage();
  await open(responder);
  const newcomer = await context.newPage();
  // A long CSS animation starts after the callback; only gating it holds the old snapshot.
  await page.evaluate(() => {
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = (update) =>
      start(async () => {
        await new Promise<void>((resolve) =>
          window.addEventListener("release-snapshot", () => resolve(), { once: true }),
        );
        if (typeof update === "function") await update();
      });
  });
  await keys(page, ["ArrowRight"]);
  await expect(responder).toHaveURL(/#\/18$/);
  await responder.evaluate(() => {
    const post = BroadcastChannel.prototype.postMessage;
    window.e2eAnswers = 0;
    BroadcastChannel.prototype.postMessage = function (message: unknown) {
      if (message && typeof message === "object" && "type" in message && message.type === "state")
        window.e2eAnswers++;
      post.call(this, message);
    };
  });
  // Deliver the responder's answer before the navigating window's delayed answer.
  await page.evaluate(() => {
    const post = BroadcastChannel.prototype.postMessage;
    const held: { channel: BroadcastChannel; message: unknown }[] = [];
    BroadcastChannel.prototype.postMessage = function (message: unknown) {
      held.push({ channel: this, message });
    };
    window.addEventListener(
      "release-answers",
      () => {
        BroadcastChannel.prototype.postMessage = post;
        for (const { channel, message } of held) post.call(channel, message);
      },
      { once: true },
    );
  });
  await newcomer.goto(new URL("/#/1", page.url()).href);
  await expect(newcomer).toHaveURL(/#\/18$/);
  await expect.poll(() => responder.evaluate(() => window.e2eAnswers)).toBeGreaterThan(0);
  await expect(page.getByRole("heading", { name: "Keep moving." })).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("release-answers")));
  await page.evaluate(() => window.dispatchEvent(new Event("release-snapshot")));
  await settle(page);
  await settle(newcomer);
  await settle(responder);
  await expect(newcomer.getByRole("heading", { name: "Change the scale." })).toBeVisible();
});

test("Two arrows in one frame cross two boundaries with one transition", async ({ page }) => {
  await open(page);
  await keys(page, ["ArrowRight", "ArrowRight"]);
  await settle(page);
  await expect(page).toHaveURL(/#\/19$/);
  await expect(page.getByRole("heading", { name: "Make a clean cut." })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.e2eTransitionNames)).toEqual(["push"]);
});

test("Opposite arrows in one frame leave both windows and the URL at the original position", async ({
  page,
  context,
}) => {
  await open(page);
  const other = await context.newPage();
  await other.goto(new URL("/#/17", page.url()).href);
  await expect(other.getByRole("heading", { name: "Keep moving." })).toBeVisible();
  await settle(other);
  const received: string[] = [];
  other.on("framenavigated", (frame) => {
    if (frame === other.mainFrame()) received.push(new URL(frame.url()).hash);
  });
  await keys(page, ["ArrowRight", "ArrowLeft"]);
  await settle(page);
  const outcome = await page.evaluate(async () => {
    const transition = window.e2eTransition;
    const result = await transition?.ready.then(
      () => "animated",
      () => "skipped",
    );
    return {
      result,
      transition: document.documentElement.getAttribute("data-deck-transition"),
      direction: document.documentElement.getAttribute("data-deck-nav"),
    };
  });
  expect(outcome).toEqual({ result: "skipped", transition: null, direction: null });
  await expect.poll(() => received).toEqual(["#/18", "#/17"]);
  await expect(other).toHaveURL(/#\/17$/);
  await settle(page);
  await settle(other);
  await expect(page).toHaveURL(/#\/17$/);
  await expect(page.getByRole("heading", { name: "Keep moving." })).toBeVisible();
  await expect(other.getByRole("heading", { name: "Keep moving." })).toBeVisible();
});

test("Opening overview in the same frame as navigation shows overview and clears attributes", async ({
  page,
}) => {
  await open(page);
  await keys(page, ["ArrowRight", "o"]);
  await settle(page);
  await expect(page).toHaveURL(/#\/overview\/18$/);
  await expect(page.getByRole("button", { name: "Slide 18: Transition / zoom" })).toBeFocused();
  await expect(page.locator("html")).not.toHaveAttribute("data-deck-transition");
});

test("Back in the frame after navigation restores the earlier slide and URL", async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    window.addEventListener(
      "keydown",
      () => {
        requestAnimationFrame(() => history.back());
      },
      { once: true },
    );
  });
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/#\/17$/);
  await settle(page);
  await expect(page.getByRole("heading", { name: "Keep moving." })).toBeVisible();
});

test("The update callback commits visible content into the incoming snapshot", async ({ page }) => {
  await open(page);
  await keys(page, ["ArrowRight"]);
  const visible = await page.evaluate(async () => {
    await window.e2eTransition?.updateCallbackDone;
    return Array.from(document.querySelectorAll("h1")).some(
      (heading) => heading.textContent === "Change the scale." && heading.checkVisibility(),
    );
  });
  expect(visible).toBe(true);
  await settle(page);
});

test("A second arrow after the callback replaces the transition without lingering attributes", async ({
  page,
}) => {
  await open(page);
  await keys(page, ["ArrowRight"]);
  await page.evaluate(() => window.e2eTransition?.updateCallbackDone);
  await keys(page, ["ArrowRight"]);
  await settle(page);
  await expect(page).toHaveURL(/#\/19$/);
  await expect(page.getByRole("heading", { name: "Make a clean cut." })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.e2eTransitionNames)).toEqual(["push", "zoom"]);
  await expect(page.locator("html")).not.toHaveAttribute("data-deck-transition");
});

test("A regular click after the callback skips the slide transition and presents the click immediately", async ({
  page,
}) => {
  await open(page, 1);
  await keys(page, ["ArrowRight"]);
  await page.evaluate(() => window.e2eTransition?.updateCallbackDone);
  await keys(page, ["ArrowRight"]);
  await expect(page).toHaveURL(/#\/2\?clicks=1$/);
  await settle(page);
  await expect(page.locator("[data-deck-active] [data-step-state]")).toHaveAttribute(
    "data-step-state",
    "current",
  );
  await expect.poll(() => page.evaluate(() => window.e2eTransitionNames)).toEqual(["fade"]);
  await expect(page.locator("html")).not.toHaveAttribute("data-deck-transition");
});
