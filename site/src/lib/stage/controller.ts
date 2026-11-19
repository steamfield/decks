// Drives one deck iframe for the landing page's scripted session. One command is in flight at
// a time: each resolves when the deck reports its requestId settled, and a newer call
// supersedes it, because the deck never reports a superseded move settled. A paused stage
// holds a play between steps until it resumes.

import { type Command, command, type DeckState, parseDeckMessage } from "../player/protocol";

/**
 * A result range the stage plays forward: it enters `first` with a forward
 * `go`, then steps every beat of the slides in `stepBeatsOn` and moves a whole
 * slide at a time elsewhere, until it reaches the end of `last`.
 */
export type PlayRange = {
  first: number;
  last: number;
  stepBeatsOn: readonly number[];
};

/** How a command ended: settled on a deck state, or superseded by a newer call. */
export type StageResult = { cancelled: true } | { cancelled: false; state: DeckState };

/** Drives one deck iframe; made by `createStageController`. */
export type StageController = {
  ready(): Promise<void>;
  show(slide: number, beat: number): Promise<StageResult>;
  go(
    slide: number,
    beat: number,
    options?: { direction?: "forward" | "backward" },
  ): Promise<StageResult>;
  play(range: PlayRange, options: { dwellMs: number }): Promise<StageResult>;
  /**
   * Holds any play, now or later: its dwell stops counting down and it sends no further step
   * until `resume`. A step already sent still settles. `show`, `go` and `cancel` still work.
   */
  pause(): void;
  /** Lets a held play go on: the dwell it was in runs for the time it had left. */
  resume(): void;
  cancel(): void;
  dispose(): void;
};

/** The site's budget for a deck to answer, as the player's boot timeout. */
export const STAGE_TIMEOUT_MS = 15_000;

const CANCELLED: StageResult = { cancelled: true };

type Pending = {
  id: number;
  name: string;
  message: Command;
  resolve: (result: StageResult) => void;
  reject: (error: Error) => void;
  timer?: ReturnType<typeof setTimeout>;
};

/** A play's wait between steps. `timer` is unset while the stage is paused. */
type Dwell = {
  resolve: (go: boolean) => void;
  remainingMs: number;
  startedAt: number;
  timer?: ReturnType<typeof setTimeout>;
};

const nameOf = (message: Command) =>
  "slide" in message ? `${message.cmd} ${message.slide}.${message.beat}` : message.cmd;

/** Creates the controller for one deck iframe; it listens to the deck until `dispose`. */
export function createStageController(iframe: HTMLIFrameElement): StageController {
  const origin = window.location.origin;
  let isReady = false;
  let disposed = false;
  let paused = false;
  let serial = 0;
  let pending: Pending | null = null;
  let dwell: Dwell | null = null;
  let markReady: () => void = () => {};
  let failReady: (error: Error) => void = () => {};
  const readiness = new Promise<void>((resolve, reject) => {
    markReady = resolve;
    failReady = reject;
  });
  // Nobody has to call ready(); a dispose before the deck answers must not surface unhandled.
  readiness.catch(() => {});

  function post(entry: Pending) {
    iframe.contentWindow?.postMessage(entry.message, origin);
  }

  /** The command's deadline runs from the call, so a deck that never sends ready also fails. */
  function arm(entry: Pending) {
    entry.timer = setTimeout(() => {
      if (pending !== entry) return;
      pending = null;
      entry.reject(
        new Error(`The deck did not settle ${entry.name} within ${STAGE_TIMEOUT_MS / 1000} s`),
      );
    }, STAGE_TIMEOUT_MS);
  }

  function supersede() {
    if (pending) {
      clearTimeout(pending.timer);
      pending.resolve(CANCELLED);
      pending = null;
    }
    if (dwell) {
      clearTimeout(dwell.timer);
      dwell.resolve(false);
      dwell = null;
    }
  }

  /** Sends one command, or holds it until the deck is ready; it supersedes nothing itself. */
  function send(build: (requestId: number) => Command): Promise<StageResult> {
    if (disposed) return Promise.reject(new Error("The stage controller is disposed"));
    const message = build(++serial);
    return new Promise<StageResult>((resolve, reject) => {
      const entry: Pending = { id: serial, name: nameOf(message), message, resolve, reject };
      pending = entry;
      arm(entry);
      if (isReady) post(entry);
    });
  }

  function countDown(entry: Dwell) {
    entry.startedAt = performance.now();
    entry.timer = setTimeout(() => {
      dwell = null;
      entry.resolve(true);
    }, entry.remainingMs);
  }

  /** Resolves true after `ms` of unpaused time, or false when superseded first. */
  function wait(ms: number) {
    return new Promise<boolean>((resolve) => {
      const entry: Dwell = { resolve, remainingMs: ms, startedAt: 0 };
      dwell = entry;
      if (!paused) countDown(entry);
    });
  }

  function onMessage(event: MessageEvent<unknown>) {
    if (event.source !== iframe.contentWindow || event.origin !== origin) return;
    const message = parseDeckMessage(event.data);
    if (!message) return;
    if (message.type === "decks:ready") {
      if (isReady) return;
      isReady = true;
      markReady();
      if (pending) post(pending);
      return;
    }
    if (message.type === "decks:error" && pending) {
      const entry = pending;
      pending = null;
      clearTimeout(entry.timer);
      entry.reject(new Error(`The deck failed ${entry.name}: ${message.message}`));
      return;
    }
    if (message.type !== "decks:state" || !message.settled || !pending) return;
    if (message.requestId !== pending.id) return;
    const entry = pending;
    pending = null;
    clearTimeout(entry.timer);
    const { type: _, ...state } = message;
    entry.resolve({ cancelled: false, state });
  }
  window.addEventListener("message", onMessage);

  const atEndOf = (range: PlayRange, state: DeckState) =>
    state.slide >= range.last &&
    (!range.stepBeatsOn.includes(range.last) || state.beat >= state.beats);

  return {
    ready: () => readiness,
    show(slide, beat) {
      supersede();
      return send((requestId) => command.show(slide, beat, { requestId }));
    },
    go(slide, beat, options = {}) {
      supersede();
      return send((requestId) => command.go(slide, beat, { ...options, requestId }));
    },
    async play(range, { dwellMs }) {
      supersede();
      let result = await send((requestId) =>
        command.go(range.first, 0, { direction: "forward", requestId }),
      );
      while (!result.cancelled && !atEndOf(range, result.state)) {
        const before = result.state;
        if (!(await wait(dwellMs))) return CANCELLED;
        const step = range.stepBeatsOn.includes(before.slide) && before.beat < before.beats;
        result = await send((requestId) =>
          step ? command.next({ requestId }) : command.nextSlide({ requestId }),
        );
        if (
          !result.cancelled &&
          result.state.slide === before.slide &&
          result.state.beat === before.beat
        )
          throw new Error(
            `play stalled at slide ${before.slide} beat ${before.beat} before reaching slide ${range.last}`,
          );
      }
      return result;
    },
    pause() {
      if (paused) return;
      paused = true;
      if (dwell?.timer === undefined) return;
      clearTimeout(dwell.timer);
      dwell.timer = undefined;
      dwell.remainingMs = Math.max(0, dwell.remainingMs - (performance.now() - dwell.startedAt));
    },
    resume() {
      if (!paused) return;
      paused = false;
      if (dwell) countDown(dwell);
    },
    cancel: supersede,
    dispose() {
      if (disposed) return;
      disposed = true;
      window.removeEventListener("message", onMessage);
      supersede();
      if (!isReady)
        failReady(new Error("The stage controller was disposed before the deck was ready"));
    },
  };
}
