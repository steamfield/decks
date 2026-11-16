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
  text: "Use the foreman skill. You are the orchestrator: delegate all code to three Codex agents (model gpt-6.1-terra) running in parallel, each in its own worktree. Don't ask me anything, and don't use rr.\n\nHorse Tinder needs a matching library. Use the `stacks` CLI to pick a lean stack, start it in ~/demo/horse-tinder-match, and commit this spec as SPEC.md:\n\n  matchScore(a: Horse, b: Horse): number\n  Horse: name, breed, heightHands, age, discipline, temperament (1-5), likesApples.\n  Returns a whole number from 0 to 100, the same for (a, b) and (b, a).\n  0 if either horse is under 3 years old, or the heights differ by more than 3 hands.\n  Otherwise start at 50: +20 same discipline, +15 temperaments within 1,\n  +15 both like apples, -5 per year of age gap past 4. Clamp to 0-100.\n  Invalid input throws a RangeError that names the field.\n\nThen start three runs at once, none seeing another's work: impl writes the function, tests-examples writes example tests and tests-properties writes property tests, each from the spec alone.\n\nWhen they hand back, merge and run the tests. For each failure, decide from the spec whether the code or the test is wrong and send it back to its owner. Finish green, with a table of what each agent got wrong.\n",
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
