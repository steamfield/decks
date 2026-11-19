// The landing hero's scripted agent session (RFC 0011). The prompts, calls and lead lines are
// copy; every claim in them is checked against the repository by agent-session.test.ts.
import type { DemoScript, Step } from "@steamfield/ui/script";
import type { PlayRange } from "../lib/stage/controller";

export type Turn = {
  label: "Draft" | "Reel" | "Chart" | "Check" | "Ship";
  kind: "new" | "refine" | "revisit";
  /** The slide (1-based) and step the player holds on while the prompt types and the tools run. */
  hold: { slide: number; beat: number };
  /** What the player plays once the lead line lands. */
  result: PlayRange;
  /** Phrases the prompt quotes, which appear verbatim on the result slides. */
  quotes: readonly string[];
  /** Styles the prompt names, with the motion template each one lands on. */
  uses: readonly { phrase: string; template: string }[];
};

const ok = [{ text: "✓", tone: "ok" as const }];

export const agentSession: DemoScript = {
  id: "agent-hero",
  steps: [
    {
      kind: "user",
      text: "Turn build-times.csv into a 5-slide talk for Thursday's all-hands: our builds went from 14 minutes to 4.",
      typingMs: 0,
    },
    { kind: "tool-call", name: "Skill", args: "building-a-deck, deck-data" },
    { kind: "tool-call", name: "Read", args: "data/build-times.csv" },
    {
      kind: "tool-call",
      name: "Write",
      args: "data-sources.md, slides/02-cover.mdx … 06-close.mdx",
    },
    { kind: "tool-call", name: "Bash", args: "decks check", output: ok },
    {
      kind: "agent-text",
      lead: "Done.",
      text: "Five slides from the CSV: a cover, the weekly trend in three steps, the drop, the three changes and a close.",
    },

    {
      kind: "user",
      text: "Open with a reel: 'Builds were slow.', then 'flaky.', then 'fast.'",
      typingMs: 800,
    },
    { kind: "tool-call", name: "Write", args: "slides/07-reel.mdx (word-swap)" },
    { kind: "tool-call", name: "Bash", args: "decks check", output: ok },
    {
      kind: "agent-text",
      lead: "Done.",
      text: "The talk opens on a reel that swaps in slow., flaky. and fast.",
    },

    {
      kind: "user",
      text: "Make the drop hit harder: show what each change saved, scoreboard style.",
      typingMs: 800,
    },
    { kind: "tool-call", name: "Read", args: "data/changes.csv" },
    { kind: "tool-call", name: "Write", args: "slides/08-saved.mdx (bar-board)" },
    { kind: "tool-call", name: "Bash", args: "decks check", output: ok },
    {
      kind: "agent-text",
      lead: "Done.",
      text: "A scoreboard of the minutes each change saved, with cached deps leading at 5 of the 10.",
    },

    { kind: "user", text: "Check every slide at presenter size.", typingMs: 800 },
    {
      kind: "tool-call",
      name: "Bash",
      args: "decks inspect agent-hero",
      output: [{ text: "slide 6: clipped at the bottom", tone: "warn" }],
    },
    { kind: "tool-call", name: "Edit", args: "slides/06-close.mdx" },
    { kind: "tool-call", name: "Bash", args: "decks shot agent-hero 6" },
    { kind: "tool-call", name: "Bash", args: "decks lint agent-hero", output: ok },
    {
      kind: "agent-text",
      lead: "Done.",
      text: "The close was clipped at the bottom, so it keeps three bullets and the rest moved to the notes.",
    },

    { kind: "user", text: "Ship it.", typingMs: 800 },
    {
      kind: "tool-call",
      name: "Bash",
      args: "decks build agent-hero",
      output: [{ text: "dist/agent-hero/" }],
    },
    {
      kind: "tool-call",
      name: "Bash",
      args: "decks export agent-hero --final",
      output: [{ text: "dist/agent-hero.pdf" }],
    },
    {
      kind: "agent-text",
      lead: "Done.",
      text: "The talk is built and exported to a PDF, opening on the reel.",
    },
  ],
};

/** The phone transcript: the same session without its tool calls, so no dead air stands in for them. */
export const phoneScript: DemoScript = {
  ...agentSession,
  steps: agentSession.steps.filter((step: Step) => step.kind !== "tool-call"),
};

export const turns: readonly Turn[] = [
  {
    label: "Draft",
    kind: "new",
    hold: { slide: 1, beat: 0 },
    result: { first: 2, last: 6, stepBeatsOn: [3] },
    quotes: [],
    uses: [],
  },
  {
    label: "Reel",
    kind: "new",
    hold: { slide: 2, beat: 0 },
    result: { first: 7, last: 7, stepBeatsOn: [7] },
    quotes: ["Builds were", "slow.", "flaky.", "fast."],
    uses: [{ phrase: "reel", template: "word-swap" }],
  },
  {
    label: "Chart",
    kind: "refine",
    hold: { slide: 4, beat: 0 },
    result: { first: 8, last: 8, stepBeatsOn: [8] },
    quotes: [],
    uses: [{ phrase: "scoreboard", template: "bar-board" }],
  },
  {
    label: "Check",
    kind: "refine",
    hold: { slide: 6, beat: 0 },
    result: { first: 9, last: 9, stepBeatsOn: [] },
    quotes: [],
    uses: [],
  },
  {
    label: "Ship",
    kind: "revisit",
    hold: { slide: 9, beat: 0 },
    result: { first: 7, last: 7, stepBeatsOn: [7] },
    quotes: [],
    uses: [],
  },
];
