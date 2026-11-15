import { expect, type Page } from "@playwright/test";
import { loadDeck, scanSlides } from "@steamfield/decks/node";
import { settled as settleDeck } from "./deck-driver";

export const gallery = await scanSlides(await loadDeck("examples/motion"));

/**
 * The 1-based number of a gallery slide, looked up by its file name without the order prefix
 * ("push" for `17-push.mdx`), so inserting or reordering slides does not move a test. Two files
 * can share a name (`01-cover`, `27-cover`); `occurrence` picks among them in deck order.
 */
export function slideNo(name: string, occurrence = 0) {
  const matches = gallery.filter((slide) => slide.meta.id.replace(/^\d+-/, "") === name);
  const match = matches[occurrence];
  if (!match) throw new Error(`No gallery slide named "${name}" (occurrence ${occurrence})`);
  return match.meta.no;
}

export async function position(page: Page, no: number, click = 0) {
  const slide = gallery[no - 1];
  if (!slide) throw new Error(`Unknown gallery slide ${no}`);
  await expect(page.locator("[data-deck-active]")).toHaveAttribute("data-deck-slide", String(no));
  await expect(page.locator("[data-deck-active]").getByRole("heading").first()).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`#/${no}${click ? `\\?clicks=${click}` : ""}$`));
}

export async function settled(page: Page, no: number, click: number) {
  await settleDeck(page);
  if (no === slideNo("count-up"))
    await expect(page.locator('[data-deck-active] span[aria-hidden="true"]')).toHaveText(
      click ? "1,200" : "0",
    );
  if (no === slideNo("timeline"))
    await expect(
      page.getByRole("img", { name: "Three beats move and recolor two shapes" }).locator("g"),
    ).toHaveAttribute("transform", `translate(${140 + click * 320} 260)`);
  if (no === slideNo("tween"))
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
  await items.evaluateAll((elements) => {
    for (const element of elements) getComputedStyle(element).opacity;
  });
  const ready = page.waitForFunction(() => {
    const elements = Array.from(
      document.querySelectorAll("[data-deck-active] [data-step-state] [data-step-state]"),
    );
    const animations = document.getAnimations().filter((animation) => {
      const target = animation.effect instanceof KeyframeEffect ? animation.effect.target : null;
      return (
        animation instanceof CSSTransition &&
        animation.transitionProperty === "opacity" &&
        elements.some((element) => element === target)
      );
    });
    if (!animations.length) return 0;
    for (const animation of animations) {
      animation.pause();
      animation.currentTime = 90;
    }
    return animations.length;
  });
  await page.keyboard.press("ArrowRight");
  const count = await ready;
  try {
    return await count.jsonValue();
  } finally {
    await count.dispose();
  }
}
