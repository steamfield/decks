import { expect, test } from "@playwright/test";
import type { gsap } from "@react-decks/kit";
import { kitFixture, settled } from "./fixtures/kit.fixture";

test("A card overlaps outgoing copy and eases its top edge to the new height", async ({ page }) => {
  const server = await kitFixture({
    "slides/01-card.mdx": "---\nclicks: 1\n---\n<CardProbe />",
    "components/CardProbe.tsx": `
import { StoryStage, StoryCard, useScriptedDemo, gsap } from "@react-decks/kit";
export { gsap };
export function CardProbe() {
 const { clicks } = useScriptedDemo();
 return <StoryStage card={<StoryCard lead={clicks ? "A taller card" : "A short card"} body={clicks ? "A much longer explanation that wraps across several lines inside the card. ".repeat(5) : "One line."} />} />;
}`,
  });
  try {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(server.url);
    await page.evaluate(() => {
      const file = "/slides/01-card.mdx";
      return import(file);
    });
    await expect(page.getByText("A short card")).toBeVisible();
    await settled(page);
    const from = await page.evaluate(async () => {
      const file = "/components/CardProbe.tsx";
      const { gsap } = await import(file);
      const card = document.querySelector(".od-story-card");
      if (!card) throw new Error("Missing card");
      gsap.globalTimeline.pause();
      const { top, bottom } = card.getBoundingClientRect();
      return { top, bottom };
    });
    await page.keyboard.press("ArrowRight");
    await expect(page.getByText("A taller card")).toBeAttached();
    await expect(page.getByText("A short card")).toBeVisible();
    const frames = await page.evaluate(async () => {
      const file = "/components/CardProbe.tsx";
      const { gsap } = await import(file);
      const card = document.querySelector(".od-story-card");
      const body = document.querySelector(".od-story-card-body");
      const height = gsap.getTweensOf(body).find((tween: gsap.core.Tween) => tween.duration() > 0);
      if (!card || !height?.parent) throw new Error("Missing card height animation");
      const samples = [];
      for (const progress of [0, 0.5, 1]) {
        height.parent.pause().progress(progress);
        samples.push({
          top: card.getBoundingClientRect().top,
          bottom: card.getBoundingClientRect().bottom,
        });
      }
      gsap.globalTimeline.resume();
      return samples;
    });
    const to = frames.at(-1);
    if (!to) throw new Error("Missing height samples");
    expect(to.top).toBeLessThan(from.top);
    expect(frames.some((frame) => frame.top < from.top && frame.top > to.top)).toBe(true);
    expect(frames.every((frame) => Math.abs(frame.bottom - from.bottom) < 1)).toBe(true);
    await expect(page.getByText("A short card")).toHaveCount(0);
  } finally {
    await server.close();
  }
});
