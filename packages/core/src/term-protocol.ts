import type { SyncStamp } from "./sync";

/**
 * The wire contract between a live terminal pane in the browser (kit) and the dev server's
 * terminal plugin (node): event names and message shapes, sent as custom events on Vite's HMR
 * socket. Architecture sections 6.8 and 7.2.
 */

/** One terminal pane on a slide. The server keeps one shell per `id`. */
export interface TermPaneSpec {
  /** Unique across the deck, for example "stacks" or "rr-monitor". */
  id: string;
  rows: number;
  cols: number;
  /**
   * Where the shell starts: "temp" is a fresh temporary directory, and any other value names a
   * directory in `deck.config.ts` `term.dirs`. The browser never sends a path.
   */
  cwd: string;
  /** `commands[n - 1]` is typed and run when the pane's position moves from click n - 1 to n. */
  commands: readonly string[];
}

/** Browser to server. */
export const TERM_ATTACH = "deck-term:attach";
export const TERM_POSITION = "deck-term:position";
export const TERM_INPUT = "deck-term:input";
/** Server to browser. */
export const TERM_READY = "deck-term:ready";
export const TERM_DATA = "deck-term:data";
export const TERM_STATE = "deck-term:state";
export const TERM_GONE = "deck-term:gone";

/** Subscribes a window to a pane's shell, starting it if needed. Never moves the position. */
export interface TermAttach {
  pane: TermPaneSpec;
}
/**
 * Sent by an eligible window when its slide becomes active (`entered`) or its click changes
 * while active. Every audience window sends its own; the server's position makes repeats no-ops.
 */
export interface TermPosition {
  id: string;
  click: number;
  entered: boolean;
  stamp: SyncStamp;
}
/** Keys typed into a focused pane. */
export interface TermInput {
  id: string;
  data: string;
}
/** The reply to an attach: everything the shell has printed so far, up to 200 KB. */
export interface TermReady {
  id: string;
  buffer: string;
}
export interface TermData {
  id: string;
  chunk: string;
  /** Prepared-command echo bypasses output pacing to keep its reading pause. */
  immediate?: boolean;
}
export interface TermState {
  id: string;
  /** The pane's position on the server: the last click a window reported. */
  click: number;
  /** True from a command being sent until the shell prints its prompt marker again. */
  busy: boolean;
  /** The clicks waiting for a prompt, in execution order. */
  queued: readonly number[];
  /** The clicks whose commands have run in this session. */
  ran: readonly number[];
}
/** The shell could not start or has exited; the pane returns to its recording. */
export interface TermGone {
  id: string;
  reason: string;
}
