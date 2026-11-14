import { expect, type Page } from "@playwright/test";
import { loadDeck, scanSlides } from "@react-decks/node";
import { test } from "./motion.fixture";

const gallerySize = (await scanSlides(await loadDeck("examples/motion"))).length;

declare global {
  interface Window {
    e2eTransition?: ViewTransition;
    e2eTransitionNames: string[];
    e2eTransitionAttributes: string[];
    e2eAnswers: number;
  }
}

async function settle(page: Page) {
  await page.evaluate(() => {
    if (!window.__deck) throw new Error("Missing deck settle API");
    return window.__deck.settled();
  });
}

async function open(page: Page, slide = 17, search = "") {
  await page.goto(`/${search}#/${slide}`);
  await expect(page.locator("[data-deck-active]")).toHaveAttribute(
    "data-deck-slide",
    String(slide),
  );
  await page.waitForFunction(
    (count) =>
      performance
        .getEntriesByType("resource")
        .filter((entry) => /\/slides\/.*\.mdx$/.test(new URL(entry.name).pathname)).length ===
      count,
    gallerySize,
  );
  await page.evaluate(async () => {
    await Promise.all(
      performance
        .getEntriesByType("resource")
        .filter((entry) => /\/slides\/.*\.mdx$/.test(new URL(entry.name).pathname))
        .map((entry) => import(new URL(entry.name).pathname)),
    );
  });
  await settle(page);
}

async function keys(page: Page, names: string[]) {
  await page.evaluate((names) => {
    for (const key of names) {
      window.dispatchEvent(new KeyboardEvent("keydown", { key, code: key, bubbles: true }));
      window.dispatchEvent(new KeyboardEvent("keyup", { key, code: key, bubbles: true }));
    }
  }, names);
}

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    const start = document.startViewTransition.bind(document);
    window.e2eTransitionNames = [];
    window.e2eTransitionAttributes = [];
    new MutationObserver((records) => {
      for (const record of records) {
        if (record.target !== document.documentElement) continue;
        const current = document.documentElement.getAttribute("data-deck-transition");
        if (record.oldValue) window.e2eTransitionAttributes.push(record.oldValue);
        if (current) window.e2eTransitionAttributes.push(current);
      }
    }).observe(document, {
      subtree: true,
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ["data-deck-transition"],
    });
    document.startViewTransition = (update) => {
      window.e2eTransitionNames.push(
        document.documentElement.getAttribute("data-deck-transition") ?? "missing",
      );
      const transition = start(update);
      window.e2eTransition = transition;
      return transition;
    };
  });
});

test("A fade boundary publishes its URL immediately and removes its forward attributes before settling", async ({
  page,
}) => {
  await open(page, 1);
  await keys(page, ["ArrowRight"]);
  await expect(page).toHaveURL(/#\/2$/);
  await expect(page.locator("html")).toHaveAttribute("data-deck-transition", "fade");
  await expect(page.locator("html")).toHaveAttribute("data-deck-nav", "forward");
  await settle(page);
  await expect(page.locator("html")).not.toHaveAttribute("data-deck-transition");
  await expect(page.locator("html")).not.toHaveAttribute("data-deck-nav");
});

test("Going back across a fade boundary uses its backward direction", async ({ page }) => {
  await open(page, 2);
  await keys(page, ["ArrowLeft"]);
  await expect(page.locator("html")).toHaveAttribute("data-deck-transition", "fade");
  await expect(page.locator("html")).toHaveAttribute("data-deck-nav", "backward");
  await settle(page);
  await expect(page).toHaveURL(/#\/1$/);
});

test("Fade preserves additive cross-fade coverage for both root snapshots", async ({ page }) => {
  await open(page, 1);
  await keys(page, ["ArrowRight"]);
  const blending = await page.evaluate(async () => {
    await window.e2eTransition?.ready;
    return ["old", "new"].map(
      (kind) =>
        getComputedStyle(document.documentElement, `::view-transition-${kind}(root)`).mixBlendMode,
    );
  });
  expect(blending).toEqual(["plus-lighter", "plus-lighter"]);
  await settle(page);
});

test("Fade has no root-group motion that outlasts its opacity animation", async ({ page }) => {
  await open(page, 1);
  await keys(page, ["ArrowRight"]);
  const durations = await page.evaluate(async () => {
    await window.e2eTransition?.ready;
    const group = getComputedStyle(document.documentElement, "::view-transition-group(root)");
    const snapshot = getComputedStyle(document.documentElement, "::view-transition-new(root)");
    return {
      group: group.animationName === "none" ? 0 : Number.parseFloat(group.animationDuration),
      snapshot: Number.parseFloat(snapshot.animationDuration),
    };
  });
  expect(durations.group).toBeLessThanOrEqual(durations.snapshot);
  await settle(page);
});

test("Two arrows in one frame cross two boundaries with one transition", async ({ page }) => {
  await open(page);
  await keys(page, ["ArrowRight", "ArrowRight"]);
  await settle(page);
  await expect(page).toHaveURL(/#\/19$/);
  await expect(page.getByRole("heading", { name: "Make a clean cut." })).toBeVisible();
  expect(await page.evaluate(() => window.e2eTransitionNames)).toEqual(["push"]);
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
  const outcome = await page.evaluate(async () => {
    const transition = window.e2eTransition;
    const result = await transition?.ready.then(
      () => "animated",
      () => "skipped",
    );
    await window.__deck?.settled();
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
  await page.evaluate(async () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", code: "ArrowRight" }));
    window.dispatchEvent(new KeyboardEvent("keyup", { key: "ArrowRight", code: "ArrowRight" }));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    history.back();
  });
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

test("A newcomer answered during a pending transition receives the logical position", async ({
  page,
  context,
}) => {
  await open(page);
  const responder = await context.newPage();
  await open(responder);
  const newcomer = await context.newPage();
  // Hold the old snapshot callback until the newcomer has received its sync answer.
  await page.evaluate(() => {
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = (update) =>
      start(async () => {
        await new Promise<void>((resolve) => {
          window.addEventListener("release-snapshot", () => resolve(), { once: true });
        });
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
  // Deliver the responder's answer first, then the navigating window's delayed answer.
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
  await page.evaluate(() => window.dispatchEvent(new Event("release-answers")));
  await page.evaluate(() => window.dispatchEvent(new Event("release-snapshot")));
  await settle(page);
  await settle(newcomer);
  await settle(responder);
  await expect(newcomer.getByRole("heading", { name: "Change the scale." })).toBeVisible();
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
  expect(await page.evaluate(() => window.e2eTransitionNames)).toEqual(["push", "zoom"]);
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
  expect(await page.evaluate(() => window.e2eTransitionNames)).toEqual(["fade"]);
  await expect(page.locator("html")).not.toHaveAttribute("data-deck-transition");
});

test("A cut boundary never sets transition attributes", async ({ page }) => {
  await open(page, 19);
  await keys(page, ["ArrowRight"]);
  await settle(page);
  await expect(page.getByRole("heading", { name: "Follow one idea." })).toBeVisible();
  expect(await page.evaluate(() => window.e2eTransitionNames)).toEqual([]);
  expect(await page.evaluate(() => window.e2eTransitionAttributes)).toEqual([]);
});

test("Instant and live reduced-motion changes disable transitions", async ({ page }) => {
  await open(page, 17, "?motion=instant");
  await keys(page, ["ArrowRight"]);
  await settle(page);
  await expect(page.locator("html")).toHaveAttribute("data-deck-motion", "instant");
  expect(await page.evaluate(() => window.e2eTransitionNames)).toEqual([]);
  expect(await page.evaluate(() => window.e2eTransitionAttributes)).toEqual([]);
  await open(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("html")).toHaveAttribute("data-deck-motion", "instant");
  await keys(page, ["ArrowRight"]);
  await settle(page);
  expect(await page.evaluate(() => window.e2eTransitionNames)).toEqual([]);
  expect(await page.evaluate(() => window.e2eTransitionAttributes)).toEqual([]);
});

test("Only clicks marked morphSteps start a step transition", async ({ page }) => {
  await open(page, 2);
  await keys(page, ["ArrowRight"]);
  await settle(page);
  expect(await page.evaluate(() => window.e2eTransitionNames)).toEqual([]);
  await open(page, 22);
  await keys(page, ["ArrowRight"]);
  await expect(page.locator("html")).toHaveAttribute("data-deck-transition", "step");
  await settle(page);
  expect(await page.evaluate(() => window.e2eTransitionNames)).toEqual(["fade", "step"]);
});

test("End before the final module resolves cuts without an error", async ({ page }) => {
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(/\/slides\/25-code-steps\.mdx/, async (route) => {
    await held;
    await route.continue();
  });
  await page.goto("/#/1");
  await expect(page.getByRole("heading", { name: "Motion", exact: true })).toBeVisible();
  await keys(page, ["End"]);
  await expect(page).toHaveURL(/#\/25$/);
  release();
  await expect(
    page.getByRole("heading", { name: "Follow the state through the store." }),
  ).toBeVisible();
  await settle(page);
  expect(await page.evaluate(() => window.e2eTransitionNames)).toEqual([]);
});

test("An unresolved target skips a transition whose callback is still pending", async ({
  page,
}) => {
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(/\/slides\/25-code-steps\.mdx/, async (route) => {
    await held;
    await route.continue();
  });
  await page.goto("/#/17");
  await expect(page.getByRole("heading", { name: "Keep moving." })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Change the scale.", includeHidden: true }),
  ).toHaveCount(1);
  await keys(page, ["ArrowRight", "End"]);
  await expect(page).toHaveURL(/#\/25$/);
  const snapshot = await page.evaluate(() =>
    window.e2eTransition?.ready.then(
      () => "animated",
      () => "skipped",
    ),
  );
  expect(snapshot).toBe("skipped");
  release();
  await expect(
    page.getByRole("heading", { name: "Follow the state through the store." }),
  ).toBeVisible();
  await settle(page);
});

test("Instant End and Home paint their target in the next frame", async ({ page }) => {
  await open(page, 1, "?motion=instant");
  for (const [key, heading] of [
    ["End", "Follow the state through the store."],
    ["Home", "Motion"],
  ]) {
    const visible = await page.evaluate(
      async ({ key, heading }) => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key, code: key }));
        window.dispatchEvent(new KeyboardEvent("keyup", { key, code: key }));
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        return Array.from(document.querySelectorAll("h1")).some(
          (node) => node.textContent === heading && node.checkVisibility(),
        );
      },
      { key, heading },
    );
    expect(visible).toBe(true);
    await settle(page);
  }
});

test("Presenter controls animate the audience while the presenter stays still", async ({
  page,
}) => {
  await open(page);
  const popup = page.waitForEvent("popup");
  await page.keyboard.press("p");
  const presenter = await popup;
  await expect(presenter.getByRole("region", { name: "Current slide" })).toBeVisible();
  await keys(presenter, ["ArrowRight"]);
  await expect(page).toHaveURL(/#\/18$/);
  await expect(page.locator("html")).toHaveAttribute("data-deck-transition", "push");
  await expect(presenter.locator("html")).not.toHaveAttribute("data-deck-transition");
  await settle(page);
  await settle(presenter);
  await expect(presenter.locator("html")).toHaveAttribute("data-deck-motion", "instant");
  expect(await presenter.evaluate(() => window.e2eTransitionAttributes)).toEqual([]);
});
