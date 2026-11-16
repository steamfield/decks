/**
 * Slide 06: recorded Stacks shell demo, from fixtures/06-stacks-live.json.
 * Captured 2026-11-16 on a 24x92 zsh pseudo-terminal with stacks 0.12.0.
 * Source record: sources/06-stacks-live.md; data-sources.md row supplied in the hand-off.
 * Lines wrap at the demo grid without changing their text. Step 2 drops its ten leading
 * progress lines so the command and complete report fit at presentation size.
 */
import { type LiveDemo, paneGrid } from "../components/LiveDemoStage";
import type { TermRecording } from "../components/LiveTerm";
import type { TermPaneSpec } from "../term/protocol";
import fixture from "./fixtures/06-stacks-live.json";
import type { TermLine } from "./types";

export const PANE: TermPaneSpec = {
  id: "stacks",
  rows: paneGrid(1).rows,
  cols: paneGrid(1).cols,
  cwd: "temp",
  commands: fixture.steps.map((step) => step.command),
};
export const VERIFY_EXIT = fixture.steps[1]?.lines
  .find((line) => line.startsWith("exit="))
  ?.slice(5);

function wrap(text: string): string[] {
  if (text === "") return [text];
  const rows: string[] = [];
  for (let at = 0; at < text.length; at += PANE.cols) rows.push(text.slice(at, at + PANE.cols));
  return rows;
}

function output(text: string): TermLine[] {
  const tone =
    text === "Verify failed." || text === `exit=${VERIFY_EXIT}`
      ? "fail"
      : /"passed":|\bpassed\b/.test(text)
        ? "ok"
        : text.startsWith("> ")
          ? "muted"
          : "out";
  return wrap(text).map((row) => ({ text: row, tone }));
}

const exchanges = fixture.steps.map((step, index): TermLine[] => [
  ...(index > 0 ? [{ text: "" }] : []),
  { text: step.command, tone: "cmd" },
  ...step.lines.filter((line) => index !== 1 || !line.startsWith("> ")).flatMap(output),
]);

export const RECORDING: TermRecording = {
  kind: "lines",
  lines: exchanges.flat(),
  shownAt: [0, ...exchanges.map((_, index) => exchanges.slice(0, index + 1).flat().length)],
  tag: `Recorded ${fixture.recorded} · ${fixture.tool}`,
};

export const COPY = [
  {
    lead: "Watch the exit code.",
  },
  {
    lead: "The scaffold includes the agent's next step.",
  },
  {
    lead: "Fresh scaffolds fail verify.",
  },
  {
    lead: "Scripts can read the same result.",
  },
];

export const DEMO: LiveDemo = {
  headline: "Stacks gives a failed check an exit code.",
  product: "stacks",
  panes: [{ pane: PANE, recording: RECORDING, label: "SHELL" }],
  copy: COPY,
};
