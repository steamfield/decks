import { expect, type Page } from "@playwright/test";

/**
 * Counts the page's in-flight requests from now on. Playwright's `networkidle` never settles
 * once the hero session runs, so a test that must know loading has finished polls this count
 * down to zero instead. Call it before `page.goto` so no request is missed.
 */
export function trackRequests(page: Page) {
  let inFlight = 0;
  page.on("request", () => {
    inFlight += 1;
  });
  page.on("requestfinished", () => {
    inFlight -= 1;
  });
  page.on("requestfailed", () => {
    inFlight -= 1;
  });
  return {
    /** Resolves when no request is in flight. */
    idle: () => expect.poll(() => inFlight, { message: "requests still in flight" }).toBe(0),
  };
}
