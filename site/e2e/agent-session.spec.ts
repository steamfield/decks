import { expect, type Page, test } from "@playwright/test";
import { site } from "../src/config";
import { phoneScript, turns } from "../src/data/agent-session";

const labels = site.agentSession.stageLabels;
// The transcripts' names in AgentSession.tsx, which imports CSS and so can't load here.
const LIVE_TRANSCRIPT = "Agent session transcript";
const STILL_TRANSCRIPT = "Agent session transcript, every turn";

// The hero's session against the real built agent-hero deck. One ordered log in the page holds
// what the transcript showed (from its DOM) and where the deck settled (from its postMessages),
// and the assertions read the log after a whole loop, never the clock.

type Deck = { kind: "deck"; slide: number; beat: number; beats: number };
type Entry = { kind: "prompt" | "tool" | "lead" } | Deck;
const isDeck = (entry: Entry): entry is Deck => entry.kind === "deck";

declare global {
  interface Window {
    sessionLog: Entry[];
  }
}

function record() {
  // Init scripts also run inside the deck's frame; the log lives in the landing page.
  if (window !== window.top) return;
  const log: Entry[] = [];
  window.sessionLog = log;
  window.addEventListener("message", (event) => {
    const frame = document.querySelector<HTMLIFrameElement>('iframe[src^="/d/agent-hero/"]');
    if (!frame || event.source !== frame.contentWindow) return;
    const data = event.data as {
      type?: string;
      settled?: boolean;
      slide: number;
      beat: number;
      beats: number;
    };
    if (data?.type === "decks:state" && data.settled)
      log.push({ kind: "deck", slide: data.slide, beat: data.beat, beats: data.beats });
  });
  const kindOf = (node: Element): "prompt" | "tool" | "lead" => {
    if (node.matches('[data-part="message"][data-from="user"]')) return "prompt";
    if (node.matches('[data-part="message"]')) return "lead";
    return "tool";
  };
  const watch = () => {
    const turnsList = document.querySelector(
      '[role="group"][aria-label="Agent session transcript"] [data-part="turns"]',
    );
    if (!turnsList) throw new Error("the hero has no session transcript");
    for (const node of turnsList.children) log.push({ kind: kindOf(node) });
    // The thinking dots come and go between a prompt and its first call; they are not a step.
    const steps = (nodes: NodeList) =>
      [...nodes].filter(
        (node): node is Element =>
          node instanceof Element && !node.matches('[data-part="thinking"]'),
      );
    new MutationObserver((records) => {
      // A replay drops every entry but the first prompt, which stays mounted: turn 1 again.
      if (records.some((change) => steps(change.removedNodes).length > 0))
        log.push({ kind: "prompt" });
      for (const change of records)
        for (const node of steps(change.addedNodes)) log.push({ kind: kindOf(node) });
    }).observe(turnsList, { childList: true });
  };
  document.addEventListener("DOMContentLoaded", watch);
}

const sessionLog = (page: Page) => page.evaluate(() => window.sessionLog);

test("every turn holds its slide while the agent works and plays the result after the lead", async ({
  page,
}) => {
  // One loop is about 75 s of transcript and deck, plus the 4 s hold and the deck's boot.
  test.setTimeout(240_000);
  await page.addInitScript(record);
  await page.goto("/");
  // Done when the transcript has started turn 1 a second time and the deck holds slide 1 again.
  await page.waitForFunction(
    () => {
      const log = window.sessionLog;
      const prompts = log.flatMap((entry, i) => (entry.kind === "prompt" ? [i] : []));
      const loop = prompts[5];
      return loop !== undefined && log.slice(loop).some((e) => e.kind === "deck" && e.slide === 1);
    },
    undefined,
    { timeout: 200_000, polling: 250 },
  );
  const log = await sessionLog(page);
  const prompts = log.flatMap((entry, i) => (entry.kind === "prompt" ? [i] : []));
  for (const [k, turn] of turns.entries()) {
    const start = prompts[k] ?? -1;
    const next = prompts[k + 1] ?? -1;
    const span = log.slice(start, next);
    const lead = span.findIndex((entry) => entry.kind === "lead");
    expect(lead, `turn ${k + 1} has a lead line`).toBeGreaterThan(0);
    const working = span.slice(0, lead);
    // From the prompt through the last tool call, the deck only ever settles on the hold.
    const held = working.filter((e) => e.kind === "deck");
    for (const state of held)
      expect(state, `turn ${k + 1} holds while the agent works`).toMatchObject(turn.hold);
    // And the hold is on screen by the last tool call: the latest state before it is the hold.
    // A slow device may reach turn 1's lead before the deck has booted; the start poster, which
    // is turn 1's hold, stands in until then.
    const before = log
      .slice(0, start + lead)
      .filter((e) => e.kind === "deck")
      .at(-1);
    if (before || k > 0)
      expect(before, `turn ${k + 1} shows its hold before the lead`).toMatchObject(turn.hold);
    // The result plays after the lead and has ended before the next prompt.
    const played = span.slice(lead).filter(isDeck);
    expect(played[0], `turn ${k + 1} starts its result`).toMatchObject({
      slide: turn.result.first,
    });
    const end = played.at(-1);
    if (!end) throw new Error(`turn ${k + 1} played nothing`);
    expect(end.slide, `turn ${k + 1} ends its result`).toBe(turn.result.last);
    if (turn.result.stepBeatsOn.includes(turn.result.last)) expect(end.beat).toBe(end.beats);
  }
  // The loop returns to turn 1's hold.
  const again = log.slice(prompts[5]).find((e) => e.kind === "deck");
  expect(again).toMatchObject(turns[0]?.hold ?? {});
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the hero shows every prompt and lead beside the drafted cover", async ({ page }) => {
    await page.goto("/");
    const transcript = page.getByRole("group", { name: STILL_TRANSCRIPT, exact: true });
    for (const step of phoneScript.steps)
      if (step.kind === "user") await expect(transcript.getByText(step.text)).toBeVisible();
    await expect(transcript.getByText("Done.")).toHaveCount(5);
    const cover = page.getByRole("img", { name: labels[1] });
    await expect(cover).toBeVisible();
    await expect(cover).toHaveAttribute("src", /agent-hero-cover-1280\.webp$/);
    // The playing session's window and its stage stay hidden.
    await expect(page.getByRole("group", { name: LIVE_TRANSCRIPT, exact: true })).toHaveCount(0);
    await expect(page.getByRole("img", { name: labels[0] })).toHaveCount(0);
    await expect(page.getByRole("link", { name: site.agentSession.openDeck })).toHaveAttribute(
      "href",
      `/d/agent-hero/#/${turns.at(-1)?.result.first}`,
    );
  });
});

test("reduced motion shows the whole transcript and the finished deck, and drives no deck", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(record);
  const posters: string[] = [];
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (path.startsWith("/posters/agent-hero")) posters.push(path);
  });
  await page.goto("/");
  await page.waitForLoadState("load");
  await expect(
    page.getByRole("group", { name: STILL_TRANSCRIPT, exact: true }).getByText("Ship it."),
  ).toBeVisible();
  const finished = page.getByRole("img", { name: labels.at(-1) });
  await expect(finished).toBeVisible();
  await expect(page.getByRole("img", { name: labels[0] })).toHaveCount(0);
  const poster = finished.locator("img");
  await expect
    .poll(() => poster.evaluate((img: HTMLImageElement) => img.currentSrc))
    .toMatch(/\/posters\/agent-hero-finished-\d+\.(avif|webp)$/);
  // The island hydrates only when motion is allowed: no controls, and no deck frame, so no
  // command can reach a deck; the log saw no deck either.
  await expect(page.getByRole("button", { name: "Pause" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Replay" })).toHaveCount(0);
  await expect(page.locator("iframe")).toHaveCount(0);
  expect((await sessionLog(page)).filter((entry) => entry.kind === "deck")).toEqual([]);
  // Only the finished poster loads: the start poster is a source the picture passes over.
  expect(posters.every((path) => /^\/posters\/agent-hero-finished-\d+\./.test(path))).toBe(true);
  expect(posters).toHaveLength(1);
});

test("hydration keeps the server's poster image, so the stage never repaints it", async ({
  page,
}) => {
  // A deck that never answers keeps the poster up for as long as the test looks.
  await page.route("**/d/agent-hero/**", (route) => route.abort());
  await page.addInitScript(() => {
    if (window !== window.top) return;
    // Tags the poster the parser inserts, before any script has run.
    new MutationObserver((_, observer) => {
      const img = document.querySelector('[role="img"][aria-labelledby] picture > img');
      if (!img) return;
      img.setAttribute("data-from-server", "");
      observer.disconnect();
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto("/");
  // Hydrated: the controls exist only on the client.
  await expect(page.getByRole("button", { name: "Replay" })).toBeVisible();
  const stage = page.getByRole("img", { name: labels[0] });
  await expect(stage).toBeVisible();
  await expect(stage.locator("img")).toHaveAttribute("data-from-server", "");
});
