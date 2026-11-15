import { expect, type Locator, type Page } from "@playwright/test";
import { settled } from "./deck-driver";

export async function record(
  locator: Locator,
  read: (element: Element) => number,
  settle = () => settled(locator.page()),
) {
  const reader = await locator
    .page()
    .evaluateHandle<(element: Element) => number>(`(${read.toString()})`);
  const recording = await locator.evaluateHandle((element, read) => {
    const values = [read(element)];
    let frame = 0;
    const sample = () => {
      values.push(read(element));
      frame = requestAnimationFrame(sample);
    };
    const observer = new MutationObserver(() => values.push(read(element)));
    observer.observe(element, {
      attributes: true,
      subtree: true,
      childList: true,
      characterData: true,
    });
    frame = requestAnimationFrame(sample);
    return {
      values,
      stop() {
        cancelAnimationFrame(frame);
        observer.disconnect();
        values.push(read(element));
      },
    };
  }, reader);
  await reader.dispose();
  return {
    async log() {
      await settle();
      await recording.evaluate((recording) => recording.stop());
      const values = await recording.evaluate((recording) => recording.values);
      await recording.dispose();
      return values;
    },
  };
}

export function expectMonotone(values: number[], start: number, end: number) {
  expect(values[0], "motion starts at its initial pose").toBe(start);
  expect(values.at(-1), "motion ends at its destination").toBe(end);
  expect(
    values.some((value) => value > Math.min(start, end) && value < Math.max(start, end)),
    "motion includes an intermediate pose",
  ).toBe(true);
  const sign = Math.sign(end - start);
  for (const [index, value] of values.entries()) {
    expect(
      (value - (values[index - 1] ?? start)) * sign,
      `motion at sample ${index}`,
    ).toBeGreaterThanOrEqual(0);
  }
}

export async function noBlankFrame(page: Page, from: number, to: number, key: string) {
  const recording = await page.evaluateHandle(
    ({ from, to }) => {
      const values: boolean[] = [];
      let frame = 0;
      const sample = () => {
        values.push(
          [from, to].some((slide) =>
            Array.from(
              document.querySelectorAll(`[data-deck-slide="${slide}"] > :not([data-deck-layer])`),
            ).some((content) => content.checkVisibility({ checkOpacity: true })),
          ),
        );
        frame = requestAnimationFrame(sample);
      };
      sample();
      return {
        values,
        stop() {
          cancelAnimationFrame(frame);
        },
      };
    },
    { from, to },
  );
  try {
    await page.keyboard.press(key);
    await settled(page);
    await recording.evaluate((recording) => recording.stop());
    const values = await recording.evaluate((recording) => recording.values);
    expect(values, `${key} keeps slide content visible on every frame`).not.toContain(false);
  } finally {
    await recording.dispose();
  }
}
