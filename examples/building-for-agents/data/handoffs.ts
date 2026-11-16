import type { Handoff } from "../components/HandoffStage";

/**
 * Authored demo handoffs, copied byte for byte from scratchpad/handoff/*.txt
 * in session 2a6690f7-c66a-42b3-8ce1-765d0c11f34e (2026-11-16).
 * The prompts specify three agents and three remote hosts; the hosts are the three
 * remote rows of `rr monitor --once` in this repo (data-sources.md, slide 14).
 * Source rows to merge: data-sources.md, "Demo hand-offs".
 */

export const STACKS_HANDOFF: Handoff = {
  headline: "One prompt scaffolds a deck and writes it.",
  product: "stacks",
  where: "CLAUDE CODE · VS CODE",
  kind: "prompt",
  text: "/ce:build Timebox: 10 minutes. Don't ask me anything: take your recommended option for every decision.\n\nUse the `stacks` CLI to make an investor pitch deck for Horse Tinder, a dating app for horses, in ~/demo/horse-tinder-deck. Three slides, local only. Push the slide design and animation as far as you can. Open it in my browser when it's done.\n",
};

export const FOREMAN_HANDOFF: Handoff = {
  headline: "One prompt has three Codex agents build an app in parallel.",
  product: "foreman",
  where: "CLAUDE CODE · VS CODE",
  kind: "prompt",
  dense: true,
  text: "/ce:build Timebox: 15 minutes. Don't ask me anything: take your recommended option for every decision.\n\nBuild Horse Tinder, a dating app for horses, in ~/demo/horse-tinder: a full-stack web app with an Effect backend and a React frontend. Use the `stacks` CLI to pick the stack. Use the foreman skill: you orchestrate, and three Codex agents (model gpt-6.1-sol) build it in parallel, each in its own worktree.\n\nFirst load the ce:planning-products and ce:design skills and write a short RFC that all three build from: the REST endpoints, the shared types and the look. Then give each agent one small job in files only it owns.\n\nThe MVP is one screen: swipe through horse profiles, like or pass, and see your matches.\n- api: profiles, swipes and matches, held in memory.\n- web: the swipe deck and the matches list.\n- data: twelve realistic horse profiles, each with a real, freely licensed photo of a horse saved in the repo.\n\nMake it look like a real product. Open it in my browser when it's done.\n",
};

export const RR_HANDOFF: Handoff = {
  headline: "One prompt shards the app's tests across three hosts.",
  product: "rr",
  where: "CLAUDE CODE · SAME SESSION AS THE BUILD",
  kind: "prompt",
  text: "Put this repo on rr now, even if the agents are still building. Don't ask me anything.\n\n1. Use the rr:rr skill to set up rr for this repo: one parallel task that splits the tests into three shards, one on each of my three remote hosts.\n2. Add a Claude Code hook that rewrites every test command to run through rr, and tell the agents still working to run their tests through rr too.\n3. Once the API exists, add integration tests for it, following the ce:writing-tests skill, until each shard takes a few seconds to run.\n4. If the Horse Tinder MVP build has completed, start two Sonnet subagents, each in its own worktree, each adding one small feature with TDD, so their test runs go through rr.\n5. Run the sharded task. Then give me the command, so I can run it again with `rr monitor` open.\n",
};

export const STATGLASS_HANDOFF: Handoff = {
  headline: "An agent reads this laptop's load from StatGlass.",
  product: "statglass",
  where: "CLAUDE CODE · VS CODE",
  kind: "prompt",
  text: "My laptop's fans are loud. Use the statglass CLI to find out what has been loading this machine over the last 30 minutes.\n\nTell me:\n1. When CPU peaked, and how high.\n2. Which processes were running at the peak.\n3. Whether memory or temperature was under pressure too.\n4. What you would stop first, and why.\n\nRead only: don't kill or change anything. Don't ask me questions.\n",
};
