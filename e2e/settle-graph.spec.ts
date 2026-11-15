import { resolve } from "node:path";
import { expect } from "@playwright/test";
import { loadDeck, scanSlides } from "@steamfield/decks/node";
import { settled as settle, startSettling, test } from "./fixtures/deck.fixture";
import { kitFixture } from "./fixtures/kit.fixture";

test.use({ viewport: { width: 390, height: 844 } });

const graphSlide = (await scanSlides(await loadDeck("examples/opendata-pitch"))).find((slide) =>
  slide.meta.id.endsWith("scale-graph"),
)?.meta;
if (!graphSlide) throw new Error("examples/opendata-pitch has no scale-graph slide");
// Forward through every click, then back to the start.
const walkClicks = Array.from({ length: graphSlide.clicks * 2 }, (_, i) =>
  i < graphSlide.clicks ? i + 1 : 2 * graphSlide.clicks - 1 - i,
);

test("The Dataset Graph settles on two forward and reverse walks while its orbit runs", async ({
  page,
  deckServer,
}, testInfo) => {
  test.setTimeout(180_000);
  const server = await deckServer(resolve("examples/opendata-pitch"));
  const motion = `/@fs/${resolve("packages/decks/src/motion.ts")}`;
  try {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", {
      rate: Number(process.env.DECK_E2E_CPU_RATE ?? 4),
    });
    await page.goto(`${server.url}#/${graphSlide.no}`);
    const heading = page.getByRole("heading", { name: graphSlide.title });
    await expect(heading).toBeVisible();
    await settle(page);
    for (let walk = 0; walk < 2; walk++) {
      let previous = 0;
      for (const click of walkClicks) {
        await page.keyboard.press(click > previous ? "ArrowRight" : "ArrowLeft");
        await expect(page).toHaveURL(
          new RegExp(`#/${graphSlide.no}${click ? `\\?clicks=${click}` : ""}$`),
        );
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
  motionClock,
  deckServer,
}) => {
  const server = await kitFixture(deckServer, {
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
    await page.goto(server.url);
    await expect(page.getByRole("status", { name: "Finite beat" })).toHaveText("0");
    await settle(page);
    await motionClock.pauseAt();
    await page.keyboard.press("ArrowRight");
    const result = await startSettling(page);
    try {
      await motionClock.step(400);
      await expect.poll(() => result.evaluate((result) => result.done)).toBe(false);
      const midBeat = Number(await page.getByRole("status", { name: "Finite beat" }).textContent());
      expect(midBeat).toBeGreaterThan(0);
      expect(midBeat).toBeLessThan(100);
      await page.clock.fastForward(2000);
      await motionClock.step(64);
      await expect(page.getByRole("status", { name: "Finite beat" })).toHaveText("100");
      await expect.poll(() => result.evaluate((result) => result.done)).toBe(true);
      const before = await page
        .getByText("Orbit", { exact: true })
        .evaluate((element) => element.style.transform);
      await motionClock.step(100);
      await expect
        .poll(() =>
          page.getByText("Orbit", { exact: true }).evaluate((element) => element.style.transform),
        )
        .not.toBe(before);
    } finally {
      await result.dispose();
    }
  } finally {
    await server.close();
  }
});
