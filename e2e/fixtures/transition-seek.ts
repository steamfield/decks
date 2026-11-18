import type { Page } from "@playwright/test";

/**
 * Waits for a View Transition that animates `name` (a named group, or "root" for the slide
 * snapshots), seeks every transition animation to each progress point in turn, reads the group's
 * pose and both root snapshots' poses there, then finishes the transition.
 */
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
        // The deck turns the root group's animation off, so "root" is found by its snapshots.
        if (
          !animations.some(
            (animation) =>
              animation.effect instanceof KeyframeEffect &&
              animation.effect.pseudoElement?.endsWith(`(${name})`),
          )
        )
          return undefined;
        const snapshot = (kind: "old" | "new") => {
          const style = getComputedStyle(
            document.documentElement,
            `::view-transition-${kind}(root)`,
          );
          const matrix = new DOMMatrixReadOnly(
            style.transform === "none" ? undefined : style.transform,
          );
          const origin = Number.parseFloat(style.transformOrigin);
          const width = Number.parseFloat(style.width);
          const height = Number.parseFloat(style.height);
          const projectX = (x: number) => {
            const point = matrix.transformPoint({ x: x - origin });
            return origin + point.x / point.w;
          };
          return {
            x: matrix.m41,
            y: matrix.m42,
            stationary: matrix.isIdentity,
            turn: matrix.m13,
            perspective: matrix.m14,
            left: projectX(0),
            right: projectX(width),
            width,
            height,
            clip: style.clipPath,
            filter: style.filter,
            opacity: Number(style.opacity),
            z: Number(style.zIndex),
          };
        };
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
              old: snapshot("old"),
              next: snapshot("new"),
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
