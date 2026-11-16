/**
 * Slide 17: rr 0.30.0 shell capture, recorded 2026-11-16 in fixtures/17-rr-live.json.
 * Source: sources/17-rr-live.md; shared data-sources.md row supplied in the hand-off.
 * The run omits blank lines and its four leading shard-progress lines, keeping the
 * complete Parallel Execution Summary. No retained line's text is changed.
 * FLAG: author-reported: mbp is the presenter's laptop, as noted in .rr.yaml.
 */
import { type LiveDemo, paneGrid } from "../components/LiveDemoStage";
import type { TermRecording } from "../components/LiveTerm";
import type { TermPaneSpec } from "../term/protocol";
import fixture from "./fixtures/17-rr-live.json";
import type { TermLine } from "./types";

export const PANE: TermPaneSpec = {
  id: "rr",
  rows: paneGrid(1).rows,
  cols: paneGrid(1).cols,
  cwd: "repo",
  commands: fixture.steps.map((step) => step.command),
};

const exchanges = fixture.steps.map((step, index): TermLine[] => [
  ...(index > 0 ? [{ text: "" }] : []),
  { text: step.command, tone: "cmd" },
  ...step.lines
    .filter((line, row) => index === 0 || (row >= 4 && line !== ""))
    .flatMap((text): TermLine[] => {
      const tone = /passed|online/.test(text) ? "ok" : "out";
      return (text.match(new RegExp(`.{1,${PANE.cols}}`, "gu")) ?? [""]).map((row) => ({
        text: row,
        tone,
      }));
    }),
]);

export const RECORDING: TermRecording = {
  kind: "lines",
  lines: exchanges.flat(),
  shownAt: [0, ...exchanges.map((_, index) => exchanges.slice(0, index + 1).flat().length)],
  tag: `Recorded ${fixture.recorded} · ${fixture.tool}`,
};

export const COPY = [
  {
    lead: "These hosts include this laptop.",
  },
  {
    lead: "The snapshot reports each host's lock.",
  },
  {
    lead: "Each shard ran on a named host.",
  },
];

export const DEMO: LiveDemo = {
  headline: "rr runs this task across my machines.",
  product: "rr",
  panes: [{ pane: PANE, recording: RECORDING, label: "" }],
  copy: COPY,
};
