import { expect, type Page } from "@playwright/test";
import { test } from "./fixtures/remote";

const cover = (page: Page) => page.getByRole("heading", { name: "Basic fixture deck" });
const steps = (page: Page) => page.getByRole("heading", { name: "Three steps", exact: true });
const notes = (page: Page) => page.getByRole("region", { name: "Notes" });
const next = (page: Page) => page.getByRole("button", { name: "Next", exact: true });
const click = (page: Page, count: number) => page.getByText(`click ${count} of 3`, { exact: true });

test("Next on the remote advances the play window one click and the remote shows the new position", async ({
  page,
  remotePage,
  remoteServer,
}) => {
  const { url, remoteURL } = await remoteServer();
  await page.goto(`${url}#/2`);
  await remotePage.goto(remoteURL);
  await expect(steps(page)).toBeVisible();
  await expect(click(remotePage, 0)).toBeVisible();

  await next(remotePage).click();
  await expect(page).toHaveURL(/#\/2\?clicks=1$/);
  await expect(page.getByRole("listitem")).toHaveText(["First point"]);
  await expect(remotePage.getByText("2 / 5", { exact: true })).toBeVisible();
  await expect(click(remotePage, 1)).toBeVisible();
});

test("the presenter window in context A follows a remote Next (it syncs over BroadcastChannel from the play window)", async ({
  page,
  context,
  remotePage,
  remoteServer,
}) => {
  const { url, remoteURL } = await remoteServer();
  await page.goto(`${url}#/2`);
  await expect(steps(page)).toBeVisible();
  const presenter = await context.newPage();
  await presenter.goto(`${url}#/presenter/2`);
  const current = presenter.getByRole("region", { name: "Current slide" });
  await expect(current.getByRole("heading", { name: "Three steps" })).toBeVisible();
  await remotePage.goto(remoteURL);
  await expect(click(remotePage, 0)).toBeVisible();
  await page.bringToFront();

  await next(remotePage).click();
  await expect(page.getByRole("listitem")).toHaveText(["First point"]);
  await expect(presenter).toHaveURL(/#\/presenter\/2\?clicks=1$/);
  await expect(current.getByRole("listitem")).toHaveText(["First point"]);
  await expect(click(remotePage, 1)).toBeVisible();
});

test("pressing ArrowRight in the play window updates the remote's position and notes", async ({
  page,
  remotePage,
  remoteServer,
}) => {
  const { url, remoteURL } = await remoteServer();
  await page.goto(url);
  await expect(cover(page)).toBeVisible();
  await remotePage.goto(remoteURL);
  await expect(notes(remotePage)).toHaveText("Welcome everyone. This is the cover.");

  await page.keyboard.press("ArrowRight");
  await expect(steps(remotePage)).toBeVisible();
  await expect(remotePage.getByText("2 / 5", { exact: true })).toBeVisible();
  await expect(click(remotePage, 0)).toBeVisible();
  await expect(notes(remotePage).getByText("Start here.", { exact: true })).toBeInViewport();
});

test("with two play windows open, one remote Next advances the talk exactly one click", async ({
  page,
  context,
  remotePage,
  remoteServer,
}) => {
  const { url, remoteURL } = await remoteServer();
  await page.goto(`${url}#/2`);
  await expect(steps(page)).toBeVisible();
  const second = await context.newPage();
  await second.goto(`${url}#/2`);
  await expect(steps(second)).toBeVisible();
  await remotePage.goto(remoteURL);
  await expect(click(remotePage, 0)).toBeVisible();

  await next(remotePage).click();
  await expect(page.getByRole("listitem")).toHaveText(["First point"]);
  await expect(second.getByRole("listitem")).toHaveText(["First point"]);
  await expect(click(remotePage, 1)).toBeVisible();

  // A late extra advance would make the second press land on click 3.
  await next(remotePage).click();
  await expect(page.getByRole("listitem")).toHaveText(["First point", "Second point"]);
  await expect(second.getByRole("listitem")).toHaveText(["First point", "Second point"]);
  await expect(click(remotePage, 2)).toBeVisible();
});

test("the remote reloaded mid-talk shows the current slide and its timer keeps counting from the elapsed time", async ({
  page,
  remotePage,
  remoteServer,
}) => {
  const { url, remoteURL, advanceClock } = await remoteServer("clock");
  await remotePage.clock.install({ time: 0 });
  await remotePage.clock.pauseAt(86_400_000);
  await page.goto(url);
  await expect(cover(page)).toBeVisible();
  await remotePage.goto(remoteURL);
  const timer = remotePage.getByRole("timer", { name: "Elapsed time" });
  await expect(timer).toHaveText("00:00");
  await page.keyboard.press("ArrowRight");
  // The remote title confirms receipt of the relay's timer start.
  await expect(steps(remotePage)).toBeVisible();

  await advanceClock();
  await remotePage.clock.fastForward(3000);
  await expect(timer).toHaveText("00:03");
  await remotePage.reload();
  await expect(steps(remotePage)).toBeVisible();
  await expect(remotePage.getByText("2 / 5", { exact: true })).toBeVisible();
  await expect(timer).toHaveText("00:03");
  await remotePage.clock.fastForward(2000);
  await expect(timer).toHaveText("00:05");
});

test("the remote shows Waiting for the deck after every deck window closes, and the position again when one reopens", async ({
  page,
  context,
  remotePage,
  remoteServer,
}) => {
  const { url, remoteURL } = await remoteServer();
  const reports: unknown[] = [];
  remotePage.on("websocket", (socket) => {
    socket.on("framereceived", ({ payload }) => {
      if (typeof payload === "string") reports.push(JSON.parse(payload));
    });
  });
  await remotePage.goto(remoteURL);
  const status = remotePage.getByRole("status");
  await expect(status).toHaveText("Waiting for the deck");
  await page.goto(`${url}#/2?clicks=1`);
  await expect(click(remotePage, 1)).toBeVisible();

  const second = await context.newPage();
  // Its initial position reaches the relay before it catches up to the existing talk.
  await second.goto(`${url}#/2?clicks=2`);
  await expect
    .poll(() => reports)
    .toContainEqual(expect.objectContaining({ type: "position", slide: 2, click: 2 }));
  await expect(second.getByRole("listitem")).toHaveText(["First point"]);
  await expect(click(remotePage, 1)).toBeVisible();
  // A surviving window's update can replace a premature waiting screen.
  const waitingWhileOpen = await remotePage.getByRole("main").evaluateHandle((main) => {
    let seen = false;
    const observer = new MutationObserver((records) => {
      seen ||= records.some(({ addedNodes, removedNodes }) =>
        [...addedNodes, ...removedNodes].some(
          (node) => node.textContent === "Waiting for the deck",
        ),
      );
    });
    observer.observe(main.parentNode ?? main, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      return seen;
    };
  });
  await page.close();
  await second.keyboard.press("ArrowRight");
  await expect(second.getByRole("listitem")).toHaveText(["First point", "Second point"]);
  await expect(click(remotePage, 2)).toBeVisible();
  const showedWaiting = await waitingWhileOpen.evaluate((read) => read());
  await waitingWhileOpen.dispose();
  expect(showedWaiting).toBe(false);

  await second.close();
  await expect(status).toHaveText("Waiting for the deck");
  const reopened = await context.newPage();
  await reopened.goto(`${url}#/2?clicks=2`);
  await expect(steps(remotePage)).toBeVisible();
  await expect(click(remotePage, 2)).toBeVisible();
});

test("a remote Next on the live terminal fixture's slide runs its command exactly once (start that server with --live-term too)", async ({
  page,
  remotePage,
  remoteServer,
}) => {
  const { url, remoteURL, executions } = await remoteServer("live-term");
  await page.goto(url);
  const status = page.getByRole("region", { name: "Terminal status" });
  await expect(status).toHaveText("Live");
  await remotePage.goto(remoteURL);
  await expect(click(remotePage, 0)).toBeVisible();
  expect(await executions()).toBe("");

  await next(remotePage).click();
  await expect(click(remotePage, 1)).toBeVisible();
  await expect.poll(executions).toBe("1");
  await page.keyboard.press("ArrowRight");
  await expect(click(remotePage, 2)).toBeVisible();
  await expect.poll(executions).toBe("12");
  // The second command waits for Enter before returning to the prompt and draining the queue.
  await expect(status).toHaveText("Live · busy");
  await page.getByRole("application", { name: "Live terminal" }).click();
  await page.keyboard.press("Enter");
  await expect(status).toHaveText("Live");
  expect(await executions()).toBe("12");
});

test("the remote URL without its token gets a 403 page", async ({ remotePage, remoteServer }) => {
  const { remoteURL } = await remoteServer();
  const tokenless = new URL(remoteURL);
  tokenless.searchParams.delete("token");

  const response = await remotePage.goto(tokenless.href);
  expect(response?.status()).toBe(403);
  await expect(remotePage.getByText("Forbidden", { exact: true })).toBeVisible();
});
