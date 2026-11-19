// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Line, Step } from "@steamfield/ui/script";
import { describe, expect, it } from "vitest";
import { agentSession, turns } from "./agent-session";
import { parseTranscript, parseTranscriptBody } from "./guide-transcripts";

const TURN_LABELS = { draft: "Draft", reel: "Reel", chart: "Chart", check: "Check" } as const;
const guide = readFileSync(join(process.cwd(), "..", "docs", "guide", "agents.md"), "utf8");

/** The fence format of src/data/guide-transcripts.ts, written from the script's steps. */
function serialize(steps: readonly Step[]): string {
  const lineText = (line: Line) => `  ${typeof line === "string" ? line : line.text}`;
  return steps
    .flatMap((step) => {
      switch (step.kind) {
        case "user":
          return [`> ${step.text}`];
        case "tool-call":
          return [
            step.args ? `${step.name} ${step.args}` : step.name,
            ...(step.output ?? []).map(lineText),
          ];
        case "agent-text":
          return [`${step.lead} ${step.text}`];
        default:
          throw new Error(`agent-session.ts has a "${step.kind}" step a transcript cannot show`);
      }
    })
    .join("\n");
}

/** The script's steps split at each prompt: one array per turn. */
function stepsByTurn(steps: readonly Step[]): Step[][] {
  const grouped: Step[][] = [];
  for (const step of steps) {
    if (step.kind === "user") grouped.push([]);
    grouped.at(-1)?.push(step);
  }
  return grouped;
}

const fences = [
  ...guide.matchAll(/```\w* transcript="agent-hero\/([\w-]+)"\n([\s\S]*?)\n```/g),
].map(([, turn = "", body = ""]) => ({ turn, body }));

describe("the guide's agent-hero transcripts", () => {
  it("cover the four turns the page walks through", () => {
    expect(fences.map((fence) => fence.turn)).toEqual(Object.keys(TURN_LABELS));
  });

  it.each(fences)("$turn matches the hero script's turn", ({ turn, body }) => {
    const index = Object.keys(TURN_LABELS).indexOf(turn);
    expect(turns[index]?.label).toBe(TURN_LABELS[turn as keyof typeof TURN_LABELS]);
    expect(body).toBe(serialize(stepsByTurn(agentSession.steps)[index] ?? []));
  });
});

describe("transcript fences", () => {
  it("names the fence a malformed reference came from", () => {
    expect(() => parseTranscript('text transcript="agent-hero"')).toThrow(
      'transcript="agent-hero": expected transcript="<deck>/<turn>"',
    );
    expect(parseTranscript("text")).toBeNull();
  });

  it("types each line: prompt, call, output, reply", () => {
    expect(
      parseTranscriptBody("> Ship it.\nBash decks build x\n  dist/x/\nDone. Built it.\n"),
    ).toEqual([
      { kind: "prompt", text: "Ship it." },
      { kind: "call", name: "Bash", args: "decks build x" },
      { kind: "output", text: "dist/x/" },
      { kind: "reply", lead: "Done.", text: "Built it." },
    ]);
  });

  it("rejects a body without a prompt line", () => {
    expect(() => parseTranscriptBody("Bash decks check\nDone.")).toThrow(
      'starts with "> <prompt>"',
    );
  });
});
