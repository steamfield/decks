import type { TermLine } from "../data/types";
import type { TermPaneSpec } from "../term/protocol";
import { CrtPanel } from "./CrtPanel";
import { TermPane } from "./TermPane";

/** What a pane shows whenever it is not live. */
export type TermRecording =
  | {
      kind: "lines";
      lines: readonly TermLine[];
      /** `shownAt[click]` is how many lines are visible at that click. */
      shownAt: readonly number[];
      /** The evidence tag, for example "Recorded 2026-11-16 · stacks 0.12.0". */
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

/**
 * One terminal pane on a demo slide. It shows `recording` stepped by `click`; when the deck is
 * presented from a dev server started with DECKS_LIVE_TERM=1, the same pane runs `pane` in a
 * real shell instead.
 */
export function LiveTerm({
  pane: _pane,
  click,
  recording,
  x,
  y,
  width,
  height,
  label = "",
  size,
}: {
  pane: TermPaneSpec;
  click: number;
  recording: TermRecording;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  size?: number;
}) {
  const box = { x, y, width, height, label, tag: recording.tag };
  if (recording.kind === "poster") {
    return (
      <CrtPanel {...box} power={click >= recording.from ? 1 : 0}>
        <img src={recording.src} alt={recording.alt} />
      </CrtPanel>
    );
  }
  const shown = recording.shownAt[Math.min(click, recording.shownAt.length - 1)];
  if (shown === undefined) throw new Error(`LiveTerm recording for ${box.label} has no shownAt`);
  return <TermPane {...box} lines={recording.lines} shown={shown} size={size} />;
}
