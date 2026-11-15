import type { Page } from "@playwright/test";
import { settled } from "./deck-driver";

export async function motionClock(page: Page) {
  await page.clock.install({ time: 0 });
  const step = async (ms: number) => {
    for (let remaining = ms; remaining > 0; remaining -= 250)
      await page.clock.runFor(Math.min(250, remaining));
  };
  return {
    // A fixed future point avoids a Date.now()/protocol round-trip racing the running clock.
    pauseAt: async (time = 86_400_000) => page.clock.pauseAt(time),
    step,
    async settle() {
      let done = false;
      let failure: unknown;
      const completion = settled(page).then(
        () => {
          done = true;
        },
        (cause: unknown) => {
          failure = cause;
          done = true;
        },
      );
      for (let elapsed = 0; !done && elapsed < 30_000; elapsed += 250) await step(250);
      if (!done) throw new Error("Deck did not settle after 30000 ms of controlled motion time");
      await completion;
      if (failure) throw failure;
    },
  };
}
