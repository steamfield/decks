import { expect } from "@playwright/test";
import { settled } from "./fixtures/deck.fixture";
import { test } from "./fixtures/error.fixture";

test("A rendering failure names the slide, file and cause, and a component fix recovers at the same URL.", async ({
  page,
  errorDeck,
}) => {
  const app = await errorDeck({
    "components/Bomb.tsx": 'export function Bomb(){throw new Error("Chart needs data")}',
    "slides/01-cover.mdx": "# Cover\n\n<Bomb />",
  });
  await page.goto(app.url);
  const message = "Slide 01-cover (slides/01-cover.mdx) failed to render: Chart needs data";
  await expect(page.getByText(message, { exact: true })).toBeVisible();
  await expect(page.getByText(/at Bomb/)).toBeVisible();
  const url = page.url();
  await app.put("components/Bomb.tsx", "export function Bomb(){return <h1>Chart recovered</h1>}");
  await expect(page.getByRole("heading", { name: "Chart recovered" })).toBeVisible();
  await expect(page).toHaveURL(url);
  await test.info().attach("qa-render", { body: message, contentType: "text/plain" });
});

test("A component that throws at import leaves a startup message instead of a blank page.", async ({
  page,
  errorDeck,
}) => {
  const app = await errorDeck({
    "components/Bomb.tsx":
      'throw new Error("Missing API key"); export function Bomb(){return null}',
  });
  await page.goto(app.url);
  await expect(
    page.getByText("The deck failed to start: Missing API key", { exact: true }),
  ).toBeVisible();
});

test("A cold compile failure recovers on save without manual reload and keeps its neighbour usable.", async ({
  page,
  errorDeck,
}) => {
  const app = await errorDeck({ "slides/01-cover.mdx": "# Broken\n\n<div" });
  await page.goto(app.url);
  await expect(
    page.getByText("Slide 01-cover failed to load. See the terminal or the error overlay.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText(/Unexpected end of file in name/)).toBeVisible();
  await test
    .info()
    .attach("qa-cold-compile", { body: app.terminal.join("\n"), contentType: "text/plain" });
  await app.put("slides/01-cover.mdx", "# Recovered at cold start");
  await expect(
    page.getByRole("heading", { name: "Recovered at cold start", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Unexpected end of file in name/)).not.toBeVisible();
  await page.keyboard.press("End");
  await expect(page.getByRole("heading", { name: "The end", exact: true })).toBeVisible();
  await settled(page);
  expect(app.terminal.join("\n")).not.toMatch(/This is a bug|\n\s+at /);
});

test("A new tab opened during a syntax error recovers while the original tab keeps its document.", async ({
  page,
  context,
  errorDeck,
}) => {
  const app = await errorDeck({ "slides/01-cover.mdx": "# Last good slide" });
  await page.goto(app.url);
  await expect(page.getByRole("heading", { name: "Last good slide", exact: true })).toBeVisible();
  await page.evaluate(() => {
    window.e2eDocument = "original tab";
  });
  await app.put("slides/01-cover.mdx", "# Last good slide\n\n<div");
  await expect(page.getByText(/Unexpected end of file in name/)).toBeVisible();
  const newcomer = await context.newPage();
  await newcomer.goto(app.url);
  await expect(
    newcomer.getByText("Slide 01-cover failed to load. See the terminal or the error overlay.", {
      exact: true,
    }),
  ).toBeVisible();
  const url = newcomer.url();
  await app.put("slides/01-cover.mdx", "# Recovered in both tabs");
  await expect(
    newcomer.getByRole("heading", { name: "Recovered in both tabs", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Recovered in both tabs", exact: true }),
  ).toBeVisible();
  await expect(newcomer).toHaveURL(url);
  await expect.poll(() => page.evaluate(() => window.e2eDocument)).toBe("original tab");
});

test("A failed load retries on the next successful hot update even when the slide module did not change.", async ({
  page,
  errorDeck,
}) => {
  const app = await errorDeck({
    "slides/01-cover.mdx":
      'export const ready = (() => { if (!sessionStorage.getItem("ready")) throw new Error("Waiting for data"); return true; })()\n\n# Loaded after retry',
  });
  await page.goto(app.url);
  await expect(
    page.getByText("Slide 01-cover failed to load. See the terminal or the error overlay.", {
      exact: true,
    }),
  ).toBeVisible();
  const url = page.url();
  await page.evaluate(() => sessionStorage.setItem("ready", "yes"));
  await app.put("styles/index.css", ":root { --qa-update: 1; }");
  await expect(
    page.getByRole("heading", { name: "Loaded after retry", exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(url);
});
