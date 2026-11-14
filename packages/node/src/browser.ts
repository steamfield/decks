import { type Browser, chromium } from "playwright-core";
import { preview } from "vite";
import { DeckError } from "./errors";

export class MissingChromiumError extends DeckError {
  constructor(cause: unknown) {
    super("Chromium is not installed. Run npx playwright install chromium.", undefined, undefined, {
      cause,
    });
  }
}

export async function launchBrowser(): Promise<Browser> {
  try {
    return await chromium.launch();
  } catch (cause) {
    if (cause instanceof Error && cause.message.includes("Executable doesn't exist"))
      throw new MissingChromiumError(cause);
    throw cause;
  }
}

/** Each capture owns a preview server on an OS-assigned port. */
export async function openBuiltDeck(
  browser: Browser,
  outDir: string,
  base: string,
  path: string,
  viewport = { width: 1920, height: 1080 },
) {
  const server = await preview({
    configFile: false,
    base,
    build: { outDir },
    preview: { host: "127.0.0.1", port: 0, open: false },
    logLevel: "silent",
  });
  try {
    const url = server.resolvedUrls?.local[0];
    if (!url) throw new Error(`${outDir}: Vite preview did not provide a local URL`);
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    const errors: string[] = [];
    if (/^https?:\/\//.test(base)) {
      const assets = new URL(base);
      const local = new URL(url);
      await page.route(`${assets.origin}/**`, async (route) => {
        const request = new URL(route.request().url());
        try {
          const response = await page.request.get(
            `${local.origin}${request.pathname}${request.search}`,
            { headers: { origin: local.origin } },
          );
          await route.fulfill({ response });
        } catch (cause) {
          errors.push(
            `Cannot load ${request.href}: ${cause instanceof Error ? cause.message : String(cause)}`,
          );
          await route.abort();
        }
      });
    }
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto(`${url}${path}`);
    await page.waitForFunction("window.__deck !== undefined");
    await page.evaluate("window.__deck.settled()");
    if (errors.length) throw new DeckError(`Cannot capture ${outDir}: ${errors.join("; ")}`);
    return { page, close: () => server.close() };
  } catch (cause) {
    await server.close();
    throw cause;
  }
}
