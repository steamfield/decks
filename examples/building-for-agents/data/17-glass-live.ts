/**
 * Slide 17: statglass 0.10.0 capture, recorded 2026-11-16 in fixtures/17-glass-live.json.
 * Source: sources/17-glass-live.md; shared data-sources.md row supplied in the hand-off.
 * All output is retained, wrapped at the pane's columns without rewriting its text.
 * The capture used 24 rows; playback uses 12 so the live grid fits the slide too.
 * FLAG: author-reported: laptop identity and test activity come from the capture's how field.
 */
import type { LiveDemo } from "../components/LiveDemoStage";
import type { TermRecording } from "../components/LiveTerm";
import type { TermPaneSpec } from "../term/protocol";
import fixture from "./fixtures/17-glass-live.json";
import type { TermLine } from "./types";

export const PANE: TermPaneSpec = {
  id: "glass",
  rows: 12,
  cols: 92,
  cwd: "temp",
  commands: fixture.steps.map((step) => step.command),
};

function output(text: string): TermLine[] {
  if (text === "") return [{ text, tone: "out" }];
  const rows: TermLine[] = [];
  for (let at = 0; at < text.length; at += PANE.cols)
    rows.push({ text: text.slice(at, at + PANE.cols), tone: "out" });
  return rows;
}

const exchanges = fixture.steps.map((step): TermLine[] => [
  { text: step.command, tone: "cmd" },
  ...step.lines.flatMap(output),
]);

export const RECORDING: TermRecording = {
  kind: "lines",
  lines: exchanges.flat(),
  shownAt: [0, ...exchanges.map((_, index) => exchanges.slice(0, index + 1).flat().length)],
  tag: `Recorded ${fixture.recorded} · ${fixture.tool}`,
};

export const COPY = [
  {
    lead: "Ask the app about this laptop.",
    body: "These commands read the history StatGlass keeps on this machine.",
  },
  {
    lead: "The summary includes its measurement coverage.",
    body: "CPU history reports the bucket size alongside the range and average.",
  },
  {
    lead: "Events name the processes running then.",
    body: "Fan ramps and sustained CPU use each carry process names.",
  },
  {
    lead: "A script can read the same summary.",
    body: "JSON includes the peak's bucket size and the fraction measured.",
  },
];

export const DEMO: LiveDemo = {
  headline: "StatGlass reports this laptop's CPU history.",
  product: "statglass",
  panes: [{ pane: PANE, recording: RECORDING, label: "SHELL" }],
  copy: COPY,
};
