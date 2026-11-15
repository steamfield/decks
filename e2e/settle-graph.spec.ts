import { resolve } from "node:path";
import { expect, type Page, test } from "@playwright/test";
import { dev, loadDeck } from "@steamfield/decks/node";
import { kitFixture } from "./fixtures/kit.fixture";

async function settle(page: Page) {
  const result = await page.evaluateHandle(() => {
    if (!window.__deck) throw new Error("Missing deck settle API");
    const result = { done: false };
    void window.__deck.settled().then(() => {
      result.done = true;
    });
    return result;
  });
  try {
    await page.waitForFunction((result) => result.done, result, { timeout: 15_000 });
  } finally {
    await result.dispose();
  }
}

test.use({ viewport: { width: 390, height: 844 } });

test("The Dataset Graph settles on two forward and reverse walks while its orbit runs", async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  const server = await dev(await loadDeck(resolve("examples/opendata-pitch")), { port: 0 });
  const motion = `/@fs/${resolve("packages/decks/src/motion.ts")}`;
  try {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.goto(`${server.url}#/4`);
    const heading = page.getByRole("heading", {
      name: "Every dataset we clean joins the Dataset Graph.",
    });
    await expect(heading).toBeVisible();
    await settle(page);
    for (let walk = 0; walk < 2; walk++) {
      let previous = 0;
      for (const click of [1, 2, 3, 2, 1, 0]) {
        await page.keyboard.press(click > previous ? "ArrowRight" : "ArrowLeft");
        await expect(page).toHaveURL(new RegExp(`#/4${click ? `\\?clicks=${click}` : ""}$`));
        await settle(page);
        await expect(heading).toBeVisible();
        if (click === 2)
          await expect(page.getByText(/^\d+ datasets\. [\d,]+ relationships\.$/)).toBeVisible();
        previous = click;
      }
    }
  } finally {
    try {
      await testInfo.attach("settle-signals", {
        body: JSON.stringify(
          await page.evaluate(async (file) => {
            const { gsap }: typeof import("@steamfield/decks/motion") = await import(file);
            return {
              hash: location.hash,
              fonts: document.fonts.status,
              transition: document.documentElement.getAttribute("data-deck-transition"),
              animations: document.getAnimations().map((animation) => ({
                state: animation.playState,
                pending: animation.pending,
                start: animation.startTime,
                name: animation instanceof CSSAnimation ? animation.animationName : undefined,
                property:
                  animation instanceof CSSTransition ? animation.transitionProperty : undefined,
                target:
                  animation.effect instanceof KeyframeEffect &&
                  animation.effect.target instanceof Element
                    ? animation.effect.target.outerHTML.slice(0, 700)
                    : undefined,
                timing: animation.effect?.getComputedTiming(),
              })),
              tweens: gsap.globalTimeline.getChildren(true, true, false).map((tween) => {
                const ancestors = [];
                for (
                  let animation: gsap.core.Animation | null = tween;
                  animation;
                  animation = animation.parent
                ) {
                  ancestors.push({
                    progress: animation.totalProgress(),
                    time: animation.totalTime(),
                    duration: animation.totalDuration(),
                    paused: animation.paused(),
                    repeat: animation.repeat(),
                  });
                }
                return { ancestors, vars: Object.keys(tween.vars) };
              }),
            };
          }, motion),
          null,
          2,
        ),
        contentType: "application/json",
      });
    } finally {
      await server.close();
    }
  }
});

test("A finite beat finishes after skipped frames while an infinite animation keeps running", async ({
  page,
}) => {
  const server = await kitFixture({
    "slides/01-beat.mdx": "---\nclicks: 1\n---\n<Beat />",
    "components/Beat.tsx": `
import { gsap, useTimeline, useTween } from "@steamfield/decks/motion";
import { useLayoutEffect, useRef } from "react";
export function Beat() {
  const value = useTween({ x: 0 });
  const ring = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const loop = gsap.to(ring.current, { rotation: 360, duration: 1, repeat: -1, ease: "none" });
    return () => { loop.kill(); };
  }, []);
  useTimeline((tl, beat) => {
    beat(0);
    tl.to(value, { x: 100, duration: 1, ease: "none" });
    beat(1);
  });
  return <><output aria-label="Finite beat">{value.x.toFixed(0)}</output><span ref={ring}>Orbit</span></>;
}`,
  });
  try {
    await page.clock.install();
    await page.goto(server.url);
    await expect(page.getByRole("status", { name: "Finite beat" })).toHaveText("0");
    await settle(page);
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
    await page.keyboard.press("ArrowRight");
    const result = await page.evaluateHandle(() => {
      if (!window.__deck) throw new Error("Missing deck settle API");
      const result = { done: false };
      void window.__deck.settled().then(() => {
        result.done = true;
      });
      return result;
    });
    try {
      await page.clock.runFor(400);
      expect(await result.evaluate((result) => result.done)).toBe(false);
      const midBeat = Number(await page.getByRole("status", { name: "Finite beat" }).textContent());
      expect(midBeat).toBeGreaterThan(0);
      expect(midBeat).toBeLessThan(100);
      await page.clock.fastForward(2000);
      await page.clock.runFor(64);
      await expect(page.getByRole("status", { name: "Finite beat" })).toHaveText("100");
      expect(await result.evaluate((result) => result.done)).toBe(true);
      const before = await page
        .getByText("Orbit", { exact: true })
        .evaluate((element) => element.style.transform);
      await page.clock.runFor(100);
      expect(
        await page
          .getByText("Orbit", { exact: true })
          .evaluate((element) => element.style.transform),
      ).not.toBe(before);
    } finally {
      await result.dispose();
    }
  } finally {
    await server.close();
  }
});
