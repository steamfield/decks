import type { Locator, Page } from "@playwright/test";
import { PNG } from "pngjs";

/** The colours painted at viewport points in one screenshot of the page, each as 0xRRGGBB. */
export async function paintAt(page: Page, points: { x: number; y: number }[]) {
  const image = PNG.sync.read(await page.screenshot());
  return points.map(({ x, y }) =>
    image.data.readUIntBE(4 * (Math.round(y) * image.width + Math.round(x)), 3),
  );
}

/** Whether a screenshot of the element contains a pixel of exactly this colour (0xRRGGBB). */
export async function paints(element: Locator, colour: number) {
  const { data } = PNG.sync.read(await element.screenshot());
  for (let i = 0; i < data.length; i += 4) if (data.readUIntBE(i, 3) === colour) return true;
  return false;
}
