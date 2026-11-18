import { parseLocation } from "@react-decks/core";
import type { Page } from "playwright-core";
import { DeckError } from "./errors";

const limit = 10_000;

export async function installFilmClock(page: Page): Promise<void> {
  await page.clock.install({ time: 0 });
  // Pause at a fixed future point before navigation, as in the motion-clock fixture.
  await page.clock.pauseAt(86_400_000);
  await page.clock.setSystemTime(0);
}

async function animationClock(page: Page, slide: number) {
  return page.evaluateHandle<{
    seek(
      t: number,
      grid: number,
    ): { end: number; probes: string[]; pending: string[]; settled: boolean };
    restart(): void;
  }>(`(() => {
    const starts = new Map();
    const paused = new Map();
    let loading = true;
    let failure;
    window.__deck.preload(${slide}).then(
      () => { loading = false; },
      error => { failure = error; }
    );
    let end = 0;
    let quiet;
    return {
      restart() { end = 0; quiet = undefined; },
      seek(t, grid) {
        if (failure) throw failure;
        for (const a of document.getAnimations()) {
          if (starts.has(a)) continue;
          if (a.playState === "paused") {
            paused.set(a, a.currentTime);
          } else if (a.playState === "running") {
            a.pause();
            starts.set(a, grid - (paused.get(a) ?? 0));
            paused.delete(a);
          }
        }
        const pending = [];
        for (const [a, start] of starts) {
          const duration = a.effect?.getComputedTiming().endTime;
          if (!Number.isFinite(duration)) { a.currentTime = 0; continue; }
          end = Math.max(end, start + duration);
          if (t === grid && t >= start + duration) {
            a.finish();
            starts.delete(a);
          } else {
            a.currentTime = Math.min(duration, Math.max(0, t - start));
            pending.push(a.animationName || a.transitionProperty || a.id || "animation");
          }
        }
        const probes = window.__deck.busy();
        if (loading) probes.push("preloading slides");
        if (t === grid) {
          if (probes.length || pending.length) quiet = undefined;
          else if (!quiet) {
            const ticket = quiet = { done: false };
            window.__deck.settled().then(() => { ticket.done = true; });
          }
        }
        return { end, pending, probes, settled: quiet?.done ?? false };
      }
    };
  })()`);
}

function checkDeadline(position: string, time: number, busy: string[]) {
  // An effect ending on the limit is allowed the two quiet frames that certify it.
  if ((time >= limit && busy.length) || time > limit + 34)
    throw new DeckError(
      `${position} did not settle within 10 s of motion; still busy: ${busy.join(", ") || "settled() has not resolved"}`,
    );
}

export async function captureStep(page: Page, slide: number, click: number, times?: number[]) {
  const position = `slide ${slide} click ${click}`;
  const clock = await animationClock(page, slide);
  const seek = (time: number, grid = time) =>
    clock.evaluate((clock, { time, grid }) => clock.seek(time, grid), { time, grid });
  try {
    let preroll = await page.evaluate<number>("performance.now()");
    const settlePredecessor = async () => {
      for (;;) {
        const state = await seek(preroll);
        if (state.settled) return;
        checkDeadline(position, preroll, [...state.probes, ...state.pending]);
        await page.clock.runFor(1);
        preroll++;
      }
    };
    await settlePredecessor();
    // Suspense can settle on different frames. Advance both pages to the same
    // clock origin so gsap's idle ticker has gone to sleep before the keypress.
    if (preroll < limit) {
      while (preroll < limit) {
        const chunk = Math.min(250, limit - preroll);
        await page.clock.runFor(chunk);
        preroll += chunk;
        await seek(preroll);
      }
      await clock.evaluate((clock) => clock.restart());
      await settlePredecessor();
    }
    await clock.evaluate((clock) => clock.restart());
    await page.evaluate("document.activeElement?.blur?.()");
    const lastSample = times?.at(-1);
    const oldSlide = lastSample ? await page.screenshot() : undefined;
    await page.keyboard.press("ArrowRight");
    const url = new URL(page.url());
    const arrived = parseLocation(url.hash, url.search);
    if (arrived.slide !== slide || arrived.click !== click)
      throw new DeckError(
        `Could not film ${position}: ArrowRight reached slide ${arrived.slide} click ${arrived.click}.`,
      );
    const transition = await page.evaluate<boolean>(
      'document.documentElement.hasAttribute("data-deck-transition")',
    );
    if (transition) {
      // Chromium takes its snapshots independently of the virtual clock.
      await page.waitForFunction(`!document.documentElement.hasAttribute("data-deck-transition") ||
        document.getAnimations().some(a => a.effect?.pseudoElement?.startsWith("::view-transition"))`);
    }

    const frames: Buffer[] = transition && oldSlide ? [oldSlide] : [];
    let span = 0;
    let t = 0;
    let previouslyBusy = false;
    for (let tick = 0; ; tick++) {
      const grid = Math.round((tick * 1000) / 60);
      let sample = times?.[frames.length];
      // A sample between ticks can paint an effect, but cannot move its birth
      // earlier than the tick at which the measurement pass would discover it.
      while (sample !== undefined && sample < grid && sample !== lastSample) {
        await page.clock.runFor(sample - t);
        t = sample;
        await seek(t, grid);
        frames.push(await page.screenshot());
        sample = times?.[frames.length];
      }
      if (grid > t) await page.clock.runFor(grid - t);
      t = grid;
      const state = await seek(t);
      span = Math.max(span, Math.ceil(state.end), previouslyBusy ? t : 0);
      previouslyBusy = state.probes.length > 0;
      while (times?.[frames.length] === t && t !== lastSample) frames.push(await page.screenshot());
      checkDeadline(position, t, [...state.probes, ...state.pending]);
      if (state.settled) break;
    }
    if (lastSample !== undefined && span !== lastSample)
      throw new DeckError(
        `${position} measured ${lastSample} ms in the first pass and ${span} ms in the second pass.`,
      );
    if (times) {
      const last = await page.screenshot();
      while (frames.length < times.length) frames.push(last);
    }
    return { span, frames };
  } finally {
    await clock.dispose();
  }
}
