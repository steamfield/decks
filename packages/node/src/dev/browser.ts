import { type Browser, chromium, errors, type Page } from "playwright-core";
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
    // A compositor-thread animation keeps ticking on real time after the page pauses and seeks
    // it, so a capture could paint a frame the page never had (seen on Linux runners).
    return await chromium.launch({ args: ["--disable-threaded-animation"] });
  } catch (cause) {
    if (cause instanceof Error && cause.message.includes("Executable doesn't exist"))
      throw new MissingChromiumError(cause);
    throw cause;
  }
}

export async function waitForCapture(page: Page, timeout = 30_000): Promise<void> {
  try {
    await page.waitForFunction("window.__deck.settled().then(() => true)", undefined, { timeout });
  } catch (cause) {
    if (!(cause instanceof errors.TimeoutError)) throw cause;
    // What is still running, from public browser signals; a gsap tween does not show here.
    const busy = await page.evaluate<string[]>(`document.getAnimations().flatMap((animation) => {
      const end = animation.effect?.getComputedTiming().endTime;
      if (animation.playState !== "running" || typeof end !== "number" || !Number.isFinite(end))
        return [];
      const target = animation.effect instanceof KeyframeEffect ? animation.effect.target : null;
      const slide = target?.closest("[data-deck-slide]")?.getAttribute("data-deck-slide") ?? "unknown";
      const name = animation instanceof CSSAnimation ? animation.animationName : animation.id || "animation";
      return ["slide " + slide + ": " + name + " (ends at " + end + " ms)"];
    })`);
    const url = new URL(page.url());
    const [slide, query] = url.hash.slice(2).split("?");
    const click =
      slide === "print"
        ? new URLSearchParams(url.search).get("print") === "final"
          ? "final"
          : "all"
        : (new URLSearchParams(query).get("clicks") ?? "0");
    throw new DeckError(
      `Timed out after ${timeout} ms waiting to capture slide ${slide} click ${click}. Still busy: ${busy.length ? busy.join("; ") : "settled() has not resolved; no running finite browser animations"}.`,
      undefined,
      undefined,
      { cause },
    );
  }
}

/** A Vite preview of the built deck in `outDir`, on an OS-assigned port. */
export async function startPreview(outDir: string, base: string) {
  const server = await preview({
    configFile: false,
    base,
    build: { outDir },
    preview: { host: "127.0.0.1", port: 0, open: false },
    logLevel: "silent",
  });
  const url = server.resolvedUrls?.local[0];
  if (!url) {
    await server.close();
    throw new Error(`${outDir}: Vite preview did not provide a local URL`);
  }
  return { url, outDir, base, close: () => server.close() };
}

/**
 * Opens `path` on a running preview. The page is loaded but not waited on; `beforeLoad` runs
 * before navigation (to install a clock, say). `errors` collects page errors and console errors
 * as they happen. `close()` closes the page; the preview stays up for the next one.
 */
export async function openPreviewPage(
  browser: Browser,
  { url, outDir, base }: Awaited<ReturnType<typeof startPreview>>,
  path: string,
  viewport = { width: 1920, height: 1080 },
  beforeLoad?: (page: Page) => Promise<void>,
) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  try {
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
    await beforeLoad?.(page);
    // An exception before mount means window.__deck never appears; fail with it, not a timeout.
    const startupError = new Promise<never>((_, reject) =>
      page.once("pageerror", (error) =>
        reject(
          new DeckError(`Cannot capture ${outDir}: ${error.message}`, undefined, undefined, {
            cause: error,
          }),
        ),
      ),
    );
    startupError.catch(() => {});
    await page.goto(`${url}${path}`);
    const ready = page.waitForFunction("window.__deck !== undefined");
    ready.catch(() => {});
    await Promise.race([ready, startupError]);
    return { page, errors, close: () => page.close() };
  } catch (cause) {
    await page.close();
    throw cause;
  }
}

/** A page on its own preview server; `close()` closes both. */
export async function openBuiltPage(
  browser: Browser,
  outDir: string,
  base: string,
  path: string,
  viewport = { width: 1920, height: 1080 },
  beforeLoad?: (page: Page) => Promise<void>,
) {
  const server = await startPreview(outDir, base);
  try {
    const capture = await openPreviewPage(browser, server, path, viewport, beforeLoad);
    const close = async () => {
      try {
        await capture.close();
      } finally {
        await server.close();
      }
    };
    return { ...capture, close };
  } catch (cause) {
    await server.close();
    throw cause;
  }
}

/** A built deck opened and settled for capture. */
export async function openBuiltDeck(
  browser: Browser,
  outDir: string,
  base: string,
  path: string,
  viewport = { width: 1920, height: 1080 },
  settleTimeout = 30_000,
) {
  const { page, errors, close } = await openBuiltPage(browser, outDir, base, path, viewport);
  try {
    await waitForCapture(page, settleTimeout);
    if (errors.length) throw new DeckError(`Cannot capture ${outDir}: ${errors.join("; ")}`);
    return { page, close };
  } catch (cause) {
    await close();
    throw cause;
  }
}
