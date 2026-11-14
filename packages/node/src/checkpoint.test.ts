import { expect, it, vi } from "vitest";
import { serve } from "./deck.test-support";

const clock = vi.hoisted(() => {
  let markStarted: ((ms?: number) => void) | undefined;
  let elapse: (() => void) | undefined;
  const started = new Promise<number | undefined>((resolve) => {
    markStarted = resolve;
  });
  const quietWindow = new Promise<void>((resolve) => {
    elapse = resolve;
  });
  if (!markStarted || !elapse) throw new Error("The test clock did not initialize");
  return { started, quietWindow, markStarted, elapse };
});
vi.mock("node:timers/promises", async (original) => ({
  ...(await original<typeof import("node:timers/promises")>()),
  setTimeout: (ms?: number) => {
    clock.markStarted(ms);
    return clock.quietWindow;
  },
}));

it("does not finish a checkpoint before a coalesced reload reaches the client", async () => {
  const app = await serve();
  const checkpoint = app.checkpoint();
  try {
    // The first sentinel has finished, but the coalescing window has not elapsed.
    expect(await Promise.race([clock.started, checkpoint.then(() => "finished")])).toBe(100);
    app.server.ws.send({ type: "full-reload" });
    clock.elapse();
    await checkpoint;
    expect(app.messages.some((message) => message.includes('"type":"full-reload"'))).toBe(true);
  } finally {
    clock.elapse();
    await checkpoint;
  }
});
