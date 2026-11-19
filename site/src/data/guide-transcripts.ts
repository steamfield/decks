// Scripted-session transcripts in the package guide. A fence in docs/guide/*.md whose info
// string carries `transcript="<deck>/<turn>"` is a few lines of an agent session, written as
// plain text so it also reads in plain Markdown:
//
//   > the prompt
//   Skill building-a-deck, deck-data      a tool call: its name, then its arguments
//     ✓                                   a tool call's output, indented two spaces
//   Done. What the agent says.            the lead word, then the rest
//
// The site renders it as the landing's terminal (src/lib/transcript-fence.ts). For the hero's
// session (`agent-hero`), src/data/guide-transcripts.test.ts keeps each fence equal to its turn in
// src/data/agent-session.ts.

export type TranscriptRef = { deck: string; turn: string };
export type TranscriptLine =
  | { kind: "prompt"; text: string }
  | { kind: "call"; name: string; args: string }
  | { kind: "output"; text: string }
  | { kind: "reply"; lead: string; text: string };

/** The `transcript="…"` attribute of a fence info string, or null when there is none. */
export function parseTranscript(meta: string | undefined): TranscriptRef | null {
  const value = meta?.match(/(?:^|\s)transcript="([^"]*)"/)?.[1];
  if (value === undefined) return null;
  const match = value.match(/^([\w-]+)\/([\w-]+)$/);
  if (!match?.[1] || !match[2])
    throw new Error(`transcript="${value}": expected transcript="<deck>/<turn>"`);
  return { deck: match[1], turn: match[2] };
}

/** A fence body as typed lines: the first is the prompt and the last is the agent's reply. */
export function parseTranscriptBody(body: string): TranscriptLine[] {
  const lines = body.replace(/\n$/, "").split("\n");
  const first = lines[0] ?? "";
  const last = lines.at(-1) ?? "";
  if (lines.length < 2 || !first.startsWith("> "))
    throw new Error(
      `A transcript fence starts with "> <prompt>" and ends with the agent's reply; got ${JSON.stringify(first)}`,
    );
  const middle = lines.slice(1, -1).map((line): TranscriptLine => {
    if (line.startsWith("  ")) return { kind: "output", text: line.slice(2) };
    const [name = "", ...args] = line.split(" ");
    return { kind: "call", name, args: args.join(" ") };
  });
  const [lead = "", ...rest] = last.split(" ");
  return [
    { kind: "prompt", text: first.slice(2) },
    ...middle,
    { kind: "reply", lead, text: rest.join(" ") },
  ];
}
