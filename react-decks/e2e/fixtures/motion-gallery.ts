import { expect, type Page } from "@playwright/test";
import { loadDeck, scanSlides } from "@react-decks/node";

export const gallery = await scanSlides(await loadDeck("examples/motion"));

export async function position(page: Page, no: number, click = 0) {
  const slide = gallery[no - 1];
  if (!slide) throw new Error(`Unknown gallery slide ${no}`);
  await expect(page.locator("[data-deck-active]")).toHaveAttribute("data-deck-slide", String(no));
  await expect(page.locator("[data-deck-active]").getByRole("heading").first()).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`#/${no}${click ? `\\?clicks=${click}` : ""}$`));
}

export async function settled(page: Page, no: number, click: number) {
  await page.evaluate(() => window.__deck?.settled());
  if (no === 13)
    await expect(page.locator('[data-deck-active] [aria-hidden="true"]')).toHaveText(
      click ? "1,200" : "0",
    );
  if (no === 15)
    await expect(
      page.getByRole("img", { name: "Three beats move and recolor two shapes" }).locator("g"),
    ).toHaveAttribute("transform", `translate(${140 + click * 320} 260)`);
  if (no === 16)
    await expect(
      page
        .getByRole("img", { name: "A circle grows from radius 48 to 180" })
        .locator("circle")
        .last(),
    ).toHaveAttribute("r", click ? "180" : "48");
}

export async function poses(page: Page) {
  const steps = page.locator("[data-deck-active] [data-step-state]");
  const morphs = page
    .locator("[data-deck-active]")
    .getByText(/^(ONE IDEA|ONE CLICK)$/)
    .locator("..");
  return steps.or(morphs).evaluateAll((elements) =>
    elements.map((element) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return {
        opacity: style.opacity,
        transform: style.transform,
        filter: style.filter,
        clip: style.clipPath,
        visibility: style.visibility,
        background: element.tagName === "MARK" ? style.backgroundSize : null,
        box: element.hasAttribute("data-step-state")
          ? null
          : { x: box.x, y: box.y, width: box.width, height: box.height },
        stroke:
          element.tagName === "g"
            ? Array.from(element.children, (child) => getComputedStyle(child).strokeDashoffset)
            : null,
      };
    }),
  );
}

export async function pauseEntry(page: Page) {
  const items = page.locator("[data-deck-active] [data-step-state] [data-step-state]");
  return items.evaluateAll(async (elements) => {
    for (const element of elements) getComputedStyle(element).opacity;
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", code: "ArrowRight" }));
    window.dispatchEvent(new KeyboardEvent("keyup", { key: "ArrowRight", code: "ArrowRight" }));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const animations = document.getAnimations().filter((animation) => {
      const target = animation.effect instanceof KeyframeEffect ? animation.effect.target : null;
      return (
        animation instanceof CSSTransition &&
        animation.transitionProperty === "opacity" &&
        elements.some((element) => element === target)
      );
    });
    for (const animation of animations) {
      animation.pause();
      animation.currentTime = 90;
    }
    const opacities = elements.map((element) => Number(getComputedStyle(element).opacity));
    return opacities;
  });
}
