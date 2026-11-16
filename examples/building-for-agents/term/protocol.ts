/**
 * The wire contract between a terminal pane in the browser (term/client) and the dev-server
 * terminal plugin (term/server): event names and message shapes, sent as custom events on
 * Vite's HMR socket. No logic and no imports, so both sides and any future home can share it.
 *
 * term/ is written to move into the framework unchanged: term/server imports no browser or
 * React code, term/client imports no node:* module, and nothing under term/ imports from the
 * rest of the deck. term/boundaries.test.ts enforces that.
 */

/** One terminal pane on a demo slide. The server keeps one shell per `id`. */
export interface TermPaneSpec {
  /** Unique across the deck, for example "stacks" or "rr-monitor". */
  id: string;
  rows: number;
  cols: number;
  /**
   * Where the shell starts: "temp" is a fresh temporary directory, and any other value names
   * a directory the server was configured with. The browser never sends a path.
   */
  cwd: string;
  /** `commands[n - 1]` is typed and run when the slide steps forward to click n. */
  commands: readonly string[];
}

/** Browser to server. */
export const TERM_ATTACH = "deck-term:attach";
export const TERM_STEP = "deck-term:step";
export const TERM_INPUT = "deck-term:input";
export const TERM_RESET = "deck-term:reset";
/** Server to browser. */
export const TERM_READY = "deck-term:ready";
export const TERM_DATA = "deck-term:data";
export const TERM_STATE = "deck-term:state";
export const TERM_GONE = "deck-term:gone";

export interface TermAttach {
  pane: TermPaneSpec;
}
/** A forward step of exactly one click, to `click`. */
export interface TermStep {
  id: string;
  click: number;
}
/** Keys typed into a focused pane. */
export interface TermInput {
  id: string;
  data: string;
}
export interface TermReset {
  id: string;
}
/** The reply to an attach: everything the shell has printed so far. */
export interface TermReady {
  id: string;
  buffer: string;
}
export interface TermData {
  id: string;
  chunk: string;
}
export interface TermState {
  id: string;
  /** True from a command being sent until the shell prints its prompt marker again. */
  busy: boolean;
  /** The clicks whose commands have run in this session. */
  ran: readonly number[];
}
/** The shell could not start or has exited; the pane returns to its recording. */
export interface TermGone {
  id: string;
  reason: string;
}
