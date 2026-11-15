/**
 * A stand-in for posthog-js's client, shared by the tests that need the real analytics module
 * to talk to an SDK they control: `analytics.test.ts` (late or failing loads) and the island
 * and page-script tests (which assert the events a click sends).
 */
import type { PostHog } from "posthog-js";
import { vi } from "vitest";

/**
 * An SDK that records `capture` calls and loads on cue: `load` resolves at once, but the SDK's
 * `loaded` callback (which flushes the queue) runs only when the test calls `fireLoaded()`.
 */
export function fakeSdk() {
  const calls: unknown[][] = [];
  let loaded: (() => void) | undefined;
  const instance = {
    capture: (...args: unknown[]) => calls.push(["capture", ...args]),
  } as unknown as PostHog;
  const init = (_key: string, config: { loaded: (p: PostHog) => void }) => {
    loaded = () => config.loaded(instance);
    return instance;
  };
  const load = vi.fn(async () => ({ default: { init } as unknown as PostHog }));
  return { calls, load, fireLoaded: () => loaded?.() };
}

/**
 * Starts the current copy of the real analytics module against a fake SDK, so `track()` calls
 * from code under test end up in `calls` as `["capture", name, props]`. When a test resets
 * modules, import the code under test after this call so both share one analytics instance.
 */
export async function startFakeAnalytics() {
  const sdk = fakeSdk();
  const { initAnalytics } = await import("./analytics");
  await initAnalytics({ key: "phc_test_fake", site: "decks" }, sdk.load);
  sdk.fireLoaded();
  return sdk;
}
