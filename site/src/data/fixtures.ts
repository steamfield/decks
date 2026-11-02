// Build-time loaders for the recorded fixtures the landing page quotes. Both are
// generated from real runs (scripts/excerpt-smoke.mjs, scripts/capture-hook.mjs)
// and checked by src/content-drift.test.ts.
import { readFileSync } from "node:fs";
import { join } from "node:path";

export type SmokeStep = { calls: string[]; note: string; output: string };
export type SmokeRun = {
  source: string;
  session: string;
  prompt: string;
  turns: number;
  durationMs: number;
  costUsd: number;
  toolCalls: number;
  steps: SmokeStep[];
};

export type HookDenial = {
  hook: string;
  tool: string;
  file: string;
  line: string;
  decision: string;
  rules: string[];
  reason: string[];
};

// Builds and tests run from site/.
function fixture<T>(name: string): T {
  return JSON.parse(readFileSync(join(process.cwd(), "fixtures", name), "utf8")) as T;
}

export const loadSmokeRun = () => fixture<SmokeRun>("smoke-1.json");
export const loadHookDenial = () => fixture<HookDenial>("hook-denial.json");

/** "87 turns, 8.3 minutes, $3.17": the run's own figures, rounded for reading. */
export function runFigures(run: Pick<SmokeRun, "turns" | "durationMs" | "costUsd">) {
  return {
    turns: run.turns,
    minutes: (run.durationMs / 60_000).toFixed(1),
    cost: `$${run.costUsd.toFixed(2)}`,
  };
}
