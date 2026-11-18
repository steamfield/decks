import { PNG } from "pngjs";
import { expect, it, onTestFinished } from "vitest";
import { launchBrowser } from "./browser";
import { contactSheet } from "./contact-sheet";
import { skipBrowserTests } from "./server.test-support";

it.skipIf(skipBrowserTests)(
  "the sheet holds exactly --frames frames labelled with increasing ms, the last one equal to the span",
  { timeout: 30_000 },
  async () => {
    // Launch Chromium, decode four images and paint both rows of the sheet.
    const browser = await launchBrowser();
    onTestFinished(() => browser.close());
    const page = await browser.newPage({ viewport: { width: 300, height: 180 } });
    const colors = [35, 75, 105, 180];
    const frames = colors.map((red) => {
      const png = new PNG({ width: 300, height: 180 });
      for (let i = 0; i < png.data.length; i += 4) {
        png.data[i] = red;
        png.data[i + 3] = 255;
      }
      return PNG.sync.write(png);
    });
    const sheet = PNG.sync.read(await contactSheet(page, frames, [0, 100, 200, 300]));
    expect(await page.getByRole("figure").count()).toBe(4);
    for (const label of ["0 ms", "100 ms", "200 ms", "300 ms"]) {
      expect(await page.getByText(label, { exact: true }).isVisible()).toBe(true);
    }
    expect(sheet.width).toBe(300);
    const row = sheet.height / 2;
    const samples = [
      [50, 30],
      [150, 30],
      [250, 30],
      [50, row + 30],
    ];
    expect(samples.map(([x = 0, y = 0]) => sheet.data[4 * (sheet.width * y + x)])).toEqual(colors);
  },
);
