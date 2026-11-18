import type { Page } from "playwright-core";

export async function contactSheet(page: Page, frames: Buffer[], times: number[]): Promise<Buffer> {
  const figures = frames.map(
    (frame, i) => `<figure>
    <img alt="" src="data:image/png;base64,${frame.toString("base64")}">
    <figcaption>${times[i]} ms</figcaption>
  </figure>`,
  );
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>
    * { box-sizing: border-box }
    body { margin: 0; color: #fff; background: #202124; font: 14px/20px monospace }
    main { display: grid; grid-template-columns: repeat(${Math.min(frames.length, 3)}, minmax(0, 1fr)) }
    figure { margin: 0 }
    img { display: block; width: 100% }
    figcaption { padding: 2px 6px }
  </style><main>${figures.join("")}</main>`);
  await page.evaluate("Promise.all(Array.from(document.images, img => img.decode()))");
  return page.getByRole("main").screenshot({ type: "png" });
}
