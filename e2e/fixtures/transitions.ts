import { expect, type Page } from "@playwright/test";
import { loadDeck, scanSlides } from "@steamfield/decks/node";
import { test as motionTest } from "./motion.fixture";
import { slideNo } from "./motion-gallery";

const gallery = await scanSlides(await loadDeck("examples/motion"));
const gallerySize = gallery.length;
const finalSlide = gallery.at(-1)?.meta;
if (!finalSlide) throw new Error("The motion gallery has no slides");
export const lastSlide = finalSlide;

declare global {
  interface Window {
    e2eTransition?: ViewTransition;
    e2eCaptureTransition?: (transition: ViewTransition) => void;
    e2eTransitionNames: string[];
    e2eTransitionAttributes: string[];
    e2eNavAttributes: string[];
  }
}

export { settled as settle } from "./deck-driver";

import { settled as settle } from "./deck-driver";

export async function open(page: Page, slide = slideNo("push"), search = "") {
  // The wait below counts slide modules in resource timing, whose default buffer (250 entries)
  // the gallery's modules, styles and images outgrow.
  await page.addInitScript(() => performance.setResourceTimingBufferSize(5000));
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

export async function keys(page: Page, names: string[]) {
  if (names.length > 1)
    await page.evaluate(() => {
      const start = document.startViewTransition.bind(document);
      const released = new Promise<void>((resolve) =>
        window.addEventListener("release-key-batch", () => resolve(), { once: true }),
      );
      document.startViewTransition = (update) =>
        start(async () => {
          await released;
          if (typeof update === "function") await update();
        });
      window.addEventListener(
        "restore-key-batch",
        () => {
          document.startViewTransition = start;
        },
        { once: true },
      );
    });
  for (const key of names) await page.keyboard.press(key);
  if (names.length > 1)
    await page.evaluate(() => {
      window.dispatchEvent(new Event("restore-key-batch"));
      window.dispatchEvent(new Event("release-key-batch"));
    });
}

export async function sampleRootTransition(page: Page, key: string, points: number[]) {
  const capture = await page.evaluateHandle((points) => {
    const started = Promise.withResolvers<ViewTransition>();
    window.e2eCaptureTransition = started.resolve;
    const frames = started.promise.then(async (transition) => {
      await transition.ready;
      const animations = document
        .getAnimations()
        .filter(
          (animation) =>
            animation.effect instanceof KeyframeEffect &&
            animation.effect.pseudoElement?.startsWith("::view-transition"),
        );
      // Named groups can outlast the root snapshots, such as the gallery's footer during blur.
      const end = Math.max(
        ...animations.map(({ effect }) =>
          effect instanceof KeyframeEffect &&
          (effect.pseudoElement === "::view-transition-old(root)" ||
            effect.pseudoElement === "::view-transition-new(root)")
            ? Number(effect.getComputedTiming().endTime)
            : 0,
        ),
      );
      if (!Number.isFinite(end) || end <= 0) throw new Error("Missing finite root animation");
      for (const animation of animations) animation.pause();
      try {
        return points.map((point) => {
          for (const animation of animations) animation.currentTime = end * point;
          const read = (kind: "old" | "new") => {
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
          return { old: read("old"), next: read("new") };
        });
      } finally {
        for (const animation of animations) animation.finish();
      }
    });
    const state = {
      done: false,
      frames: frames
        .catch((error: unknown) => String(error))
        .finally(() => {
          state.done = true;
        }),
    };
    return state;
  }, points);
  try {
    await keys(page, [key]);
    const done = await page.waitForFunction(({ done }) => done, capture, { timeout: 5000 });
    await done.dispose();
    const frames = await capture.evaluate(({ frames }) => frames);
    if (typeof frames === "string") throw new Error(frames);
    return frames;
  } catch (cause) {
    throw new Error(
      `Waiting for root snapshots after ${key} at progress ${points.join(", ")} failed`,
      {
        cause,
      },
    );
  } finally {
    await capture.dispose();
  }
}

export const test = motionTest.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      const start = document.startViewTransition.bind(document);
      window.e2eTransitionNames = [];
      window.e2eTransitionAttributes = [];
      window.e2eNavAttributes = [];
      new MutationObserver((records) => {
        const changed = new Set<string>();
        for (const record of records) {
          if (record.target !== document.documentElement) continue;
          const name = record.attributeName;
          if (!name) continue;
          const log =
            name === "data-deck-nav" ? window.e2eNavAttributes : window.e2eTransitionAttributes;
          if (record.oldValue) log.push(record.oldValue);
          changed.add(name);
        }
        for (const name of changed) {
          const log =
            name === "data-deck-nav" ? window.e2eNavAttributes : window.e2eTransitionAttributes;
          const current = document.documentElement.getAttribute(name);
          if (current) log.push(current);
        }
      }).observe(document, {
        subtree: true,
        attributes: true,
        attributeOldValue: true,
        attributeFilter: ["data-deck-transition", "data-deck-nav"],
      });
      document.startViewTransition = (update) => {
        window.e2eTransitionNames.push(
          document.documentElement.getAttribute("data-deck-transition") ?? "missing",
        );
        const transition = start(update);
        window.e2eTransition = transition;
        window.e2eCaptureTransition?.(transition);
        delete window.e2eCaptureTransition;
        return transition;
      };
    });
    await use(context);
  },
});
