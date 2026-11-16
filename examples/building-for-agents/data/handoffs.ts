import type { Handoff } from "../components/HandoffStage";

/**
 * Authored demo handoffs, copied byte for byte from scratchpad/handoff/*.txt
 * in session 2a6690f7-c66a-42b3-8ce1-765d0c11f34e (2026-11-16).
 * The prompts specify three agents; the rr demo's four hosts are author-reported.
 * Source rows to merge: data-sources.md, "Demo handoffs".
 */

export const STACKS_HANDOFF: Handoff = {
  headline:
    "One prompt has Claude Code scaffold a deck with Stacks and write it with Decks while I talk.",
  product: "stacks",
  where: "CLAUDE CODE · VS CODE",
  kind: "prompt",
  text: "/ce:build Timebox: 10 minutes. Don't ask me anything: skip the grill, take your recommended option for every decision, and list them as assumptions. Don't use rr: run checks directly.\n\nMake a pitch deck for Horse Tinder, a dating app for horses, in ~/demo/horse-tinder-deck.\n\n1. Scaffold it with the Stacks CLI: `stacks new decks ~/demo/horse-tinder-deck --sandbox --no-launch`. Read .stacks/BRIEF.md and follow it. You are done when `stacks verify` passes.\n2. Three slides only: a cover, the problem with one animated figure, and the ask.\n3. Use the Decks skills the scaffold installs for every headline, card and speaker note. Label any number you make up as illustrative.\n4. When verify passes, start the dev server and open the deck in my browser.\n",
};

export const FOREMAN_HANDOFF: Handoff = {
  headline: "One prompt has Claude delegate a library to three Codex agents in parallel.",
  product: "foreman",
  where: "CLAUDE CODE · VS CODE",
  kind: "prompt",
  text: "Use the foreman skill. You are the orchestrator: delegate all code to three Codex agents (model gpt-6.1-terra) running in parallel, each in its own worktree. Don't ask me anything, and don't use rr: run tests directly.\n\nIn a new repo at ~/demo/cron-next (git init, bun, vitest), commit this spec as SPEC.md:\n\n  nextRun(expr: string, after: Date): Date\n  Five-field cron (minute hour day-of-month month day-of-week) in UTC.\n  Fields take *, a number, a list (1,15), a range (1-5) and a step (*/15, 10-40/10).\n  Returns the first matching minute strictly after `after`.\n  If both day fields are restricted, a date matching either one matches.\n  Invalid input throws a RangeError that names the field.\n\nThen start three runs at once. None may see another's work:\n- impl: writes src/next-run.ts from the spec.\n- tests-examples: writes example tests from the spec alone, including month ends and leap days.\n- tests-properties: writes property tests with fast-check from the spec alone.\n\nWhen all three hand back, merge them and run the tests. For each failure, decide from the spec whether the code or the test is wrong, and send the fix back to the agent that owns it. Finish with all tests green and a table of what each agent got wrong.\n",
};

export const RR_HANDOFF: Handoff = {
  headline: "One command runs tests on four hosts with rr monitor.",
  product: "rr",
  where: "GHOSTTY",
  kind: "shell",
  text: "cd ~/Projects/stacks && (rr check > /tmp/rr-check.log 2>&1 &) && rr monitor\n",
};

export const STATGLASS_HANDOFF: Handoff = {
  headline: "An agent reads this laptop's load history via StatGlass CLI.",
  product: "statglass",
  where: "CLAUDE CODE · VS CODE",
  kind: "prompt",
  text: "My laptop's fans are loud. Use the statglass CLI to find out what has been loading this machine over the last 30 minutes. Start with `statglass --help`, and ask for JSON where a command offers it.\n\nTell me:\n1. When CPU peaked, and how high.\n2. Which processes were running at the peak.\n3. Whether memory or temperature was under pressure too.\n4. What you would stop first, and why.\n\nRead only: don't kill or change anything. Don't ask me questions.\n",
};
