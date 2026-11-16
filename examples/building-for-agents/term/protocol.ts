/**
 * The messages a LiveTerm pane and the dev-server terminal plugin exchange over Vite's HMR
 * socket, as custom events. Types and event names only; the rules live in sessions.ts.
 */
import type { TermLine } from "../data/types";

/** One terminal pane on a demo slide. The server keeps one shell per `id`. */
export interface TermPaneSpec {
  /** Unique across the deck, for example "stacks" or "rr-monitor". */
  id: string;
  rows: number;
  cols: number;
  /**
   * Where the shell starts: "temp" is a fresh directory outside the repository, "repo" is the
   * repository root (the rr demo needs its .rr.yaml).
   */
  cwd: "temp" | "repo";
  /** `commands[n - 1]` is typed and run when the slide steps forward to click n. */
  commands: readonly string[];
}

/** What the pane shows whenever it is not live. */
export type TermRecording =
  | {
      kind: "lines";
      lines: readonly TermLine[];
      /** `shownAt[click]` is how many lines are visible at that click. */
      shownAt: readonly number[];
      /** The evidence tag, for example "Recorded 2026-11-16 · stacks 0.7.0". */
      tag: string;
    }
  | {
      kind: "poster";
      /** A still of a full-screen program, served from the deck's public directory. */
      src: string;
      alt: string;
      /** The first click at which the still is visible. */
      from: number;
      tag: string;
    };

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
