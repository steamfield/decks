import type { Page } from "@playwright/test";

export async function seekTransition(page: Page, name: string, points: number[]) {
  try {
    const samples = await page.waitForFunction(
      ({ name, points }) => {
        if (!document.documentElement.hasAttribute("data-deck-transition")) return undefined;
        const animations = document
          .getAnimations()
          .filter(
            (animation) =>
              animation.effect instanceof KeyframeEffect &&
              animation.effect.pseudoElement?.startsWith("::view-transition"),
          );
        if (
          !animations.some(
            (animation) =>
              animation.effect instanceof KeyframeEffect &&
              animation.effect.pseudoElement === `::view-transition-group(${name})`,
          )
        )
          return undefined;
        for (const animation of animations) animation.pause();
        try {
          return points.map((point) => {
            for (const animation of animations) {
              const end = animation.effect?.getComputedTiming().endTime;
              if (typeof end !== "number" || !Number.isFinite(end))
                throw new Error(`Missing finite View Transition duration for ${name}`);
              animation.currentTime = end * point;
            }
            const group = getComputedStyle(
              document.documentElement,
              `::view-transition-group(${name})`,
            );
            const root = getComputedStyle(document.documentElement, "::view-transition-new(root)");
            const old = getComputedStyle(document.documentElement, "::view-transition-old(root)");
            const matrix = new DOMMatrixReadOnly(group.transform);
            return {
              x: matrix.e,
              y: matrix.f,
              width: Number.parseFloat(group.width),
              height: group.height,
              transform: group.transform,
              root: root.transform,
              rootOldDisplay: old.display,
              rootAnimation: root.animationName,
            };
          });
        } finally {
          for (const animation of animations) animation.finish();
        }
      },
      { name, points },
      { timeout: 5000 },
    );
    try {
      const values = await samples.jsonValue();
      if (!values) throw new Error(`Missing View Transition samples for ${name}`);
      return values;
    } finally {
      await samples.dispose();
    }
  } catch (cause) {
    throw new Error(
      `Waiting for View Transition group ${name} at progress ${points.join(", ")} failed`,
      { cause },
    );
  }
}
