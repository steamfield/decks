// Build-time loader for the recorded runs the landing page quotes. A run comes
// from a real stream-json log (scripts/excerpt-run.mjs); src/content-drift.test.ts
// checks it.
import { readFileSync } from "node:fs";
import { join } from "node:path";

export type RunStep = { calls: string[]; note: string; output: string };
export type AgentRun = {
  source: string;
  session: string;
  prompt: string;
  turns: number;
  durationMs: number;
  costUsd: number;
  toolCalls: number;
  /** Distinct tool calls in `steps`: one Bash call can show as several commands. */
  shownCalls: number;
  steps: RunStep[];
};

// Builds and tests run from site/.
function fixture<T>(name: string): T {
  return JSON.parse(readFileSync(join(process.cwd(), "fixtures", name), "utf8")) as T;
}

export const loadRun = (name: string) => fixture<AgentRun>(name);

/** "87 turns, 8.3 minutes, $3.17": the run's own figures, rounded for reading. */
export function runFigures(run: Pick<AgentRun, "turns" | "durationMs" | "costUsd">) {
  return {
    turns: run.turns,
    minutes: (run.durationMs / 60_000).toFixed(1),
    cost: `$${run.costUsd.toFixed(2)}`,
  };
}
