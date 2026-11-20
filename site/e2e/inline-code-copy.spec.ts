import { expect, type Page, test } from "@playwright/test";

const DOC = "/docs/cli/";

/** An inline code pill in the article's prose, found by its text. */
const pill = (page: Page, text: string) =>
  page.getByRole("article").getByText(text, { exact: true }).first();

/** Every string the page writes to the clipboard, in order, for "nothing was copied" checks. */
async function recordCopies(page: Page) {
  await page.addInitScript(() => {
    const copies: string[] = [];
    Object.assign(window, { copies });
    const write = navigator.clipboard.writeText.bind(navigator.clipboard);
    navigator.clipboard.writeText = (text: string) => {
      copies.push(text);
      return write(text);
    };
  });
}
const copies = (page: Page) =>
  page.evaluate(() => (window as unknown as { copies: string[] }).copies);

test("clicking an inline code pill copies its text and announces Copied", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(DOC);
  const status = page.getByRole("status").filter({ hasText: "Copied" });
  await pill(page, "decks build").click();
  await expect(status).toHaveText("Copied");
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("decks build");
  await expect(status).toBeHidden();
});

test("selecting text across a pill does not copy", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await recordCopies(page);
  await page.goto(DOC);
  const target = pill(page, "decks dev");
  await expect(page.getByRole("article")).toHaveAttribute("data-copy-inline", "");
  const box = await target.boundingBox();
  if (!box) throw new Error("pill has no box");
  await page.mouse.move(box.x + 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 2, box.y + box.height / 2, { steps: 4 });
  await page.mouse.up();
  // A later click on another pill copies; if the selection had copied, it would be listed first.
  await pill(page, "decks build").click();
  await expect.poll(() => copies(page)).toEqual(["decks build"]);
});

test("a pill inside a link follows the link and copies nothing", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/docs/agents/");
  await page.evaluate(() => navigator.clipboard.writeText("untouched"));
  await expect(page.getByRole("article")).toHaveAttribute("data-copy-inline", "");
  const before = page.url();
  await page
    .getByRole("article")
    .getByRole("link", { name: "decks init", exact: true })
    .first()
    .click();
  // Arriving on the linked page is the later event; the clipboard outlives the navigation.
  await expect.poll(() => page.url()).not.toBe(before);
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("untouched");
});
