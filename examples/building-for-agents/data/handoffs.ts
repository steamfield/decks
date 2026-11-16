import type { Handoff } from "../components/HandoffStage";

/**
 * Authored demo handoffs, copied byte for byte from scratchpad/handoff/*.txt
 * in session 2a6690f7-c66a-42b3-8ce1-765d0c11f34e (2026-11-16).
 * The prompts specify three agents; the rr demo's four hosts are author-reported.
 * Source rows to merge: data-sources.md, "Demo hand-offs".
 */

export const STACKS_HANDOFF: Handoff = {
  headline: "One prompt scaffolds a deck and writes it.",
  product: "stacks",
  where: "CLAUDE CODE · VS CODE",
  kind: "prompt",
  text: "/ce:build Timebox: 10 minutes. Don't ask me anything: take your recommended option for every decision. Don't use rr.\n\nUse the `stacks` CLI to make an investor pitch deck for Horse Tinder, a dating app for horses, in ~/demo/horse-tinder-deck. Three slides, local only. Push the slide design and animation as far as you can. Open it in my browser when it's done.\n",
};

export const FOREMAN_HANDOFF: Handoff = {
  headline: "One prompt starts three Codex agents in parallel.",
  product: "foreman",
  where: "CLAUDE CODE · VS CODE",
  kind: "prompt",
  text: "Use the foreman skill. You are the orchestrator: delegate all code to three Codex agents (model gpt-6.1-terra) running in parallel, each in its own worktree. Don't ask me anything, and don't use rr: run tests directly.\n\nIn a new repo at ~/demo/cron-next (git init, bun, vitest), commit this spec as SPEC.md:\n\n  nextRun(expr: string, after: Date): Date\n  Five-field cron (minute hour day-of-month month day-of-week) in UTC.\n  Fields take *, a number, a list (1,15), a range (1-5) and a step (*/15, 10-40/10).\n  Returns the first matching minute strictly after `after`.\n  If both day fields are restricted, a date matching either one matches.\n  Invalid input throws a RangeError that names the field.\n\nThen start three runs at once. None may see another's work:\n- impl: writes src/next-run.ts from the spec.\n- tests-examples: writes example tests from the spec alone, including month ends and leap days.\n- tests-properties: writes property tests with fast-check from the spec alone.\n\nWhen all three hand back, merge them and run the tests. For each failure, decide from the spec whether the code or the test is wrong, and send the fix back to the agent that owns it. Finish with all tests green and a table of what each agent got wrong.\n",
};

export const RR_HANDOFF: Handoff = {
  headline: "One command runs a suite across four hosts.",
  product: "rr",
  where: "GHOSTTY",
  kind: "shell",
  text: "cd ~/Projects/stacks && (rr check > /tmp/rr-check.log 2>&1 &) && rr monitor\n",
};

export const STATGLASS_HANDOFF: Handoff = {
  headline: "An agent reads this laptop's load from StatGlass.",
  product: "statglass",
  where: "CLAUDE CODE · VS CODE",
  kind: "prompt",
  text: "My laptop's fans are loud. Use the statglass CLI to find out what has been loading this machine over the last 30 minutes. Start with `statglass --help`, and ask for JSON where a command offers it.\n\nTell me:\n1. When CPU peaked, and how high.\n2. Which processes were running at the peak.\n3. Whether memory or temperature was under pressure too.\n4. What you would stop first, and why.\n\nRead only: don't kill or change anything. Don't ask me questions.\n",
};
