// The package guide's `transcript="<deck>/<turn>"` fences (src/data/guide-transcripts.ts),
// rendered as the landing's terminal: the prompt, muted tool calls with their output, and the
// agent's reply with its lead word set heavier. Static HTML; the docs ship no islands.
import { defineHastPlugin, type HastPluginEntry } from "satteri";
import type { ShikiTransformer } from "shiki";
import {
  parseTranscript,
  parseTranscriptBody,
  type TranscriptLine,
} from "../data/guide-transcripts";

type HastElement = {
  type: "element";
  tagName: string;
  properties: Record<string, unknown>;
  children: HastNode[];
};
type HastNode = HastElement | { type: "text"; value: string };
const el = (
  tagName: string,
  properties: Record<string, unknown>,
  children: HastNode[] = [],
): HastElement => ({ type: "element", tagName, properties, children });
const text = (value: string): HastNode => ({ type: "text", value });
const isElement = (node: unknown): node is HastElement =>
  typeof node === "object" && node !== null && (node as HastElement).type === "element";

const textOf = (node: HastNode): string =>
  node.type === "text" ? node.value : node.children.map(textOf).join("");

/** A glyph that is drawn but never read or copied, as in the landing's terminal. */
const glyph = (value: string) => el("span", { ariaHidden: "true" }, [text(value)]);

function lineElement(line: TranscriptLine): HastElement {
  switch (line.kind) {
    case "prompt":
      return el("p", { dataLine: "prompt" }, [glyph("❯ "), text(line.text)]);
    case "call":
      return el("p", { dataLine: "call" }, [
        glyph("● "),
        text(line.args ? `${line.name} ${line.args}` : line.name),
      ]);
    case "output":
      return el("p", { dataLine: "output" }, [glyph("  ⎿ "), text(line.text)]);
    case "reply":
      return el("p", { dataLine: "reply" }, [
        el("strong", {}, [text(line.lead)]),
        text(line.text ? ` ${line.text}` : ""),
      ]);
  }
}

/** Marks a fence whose info string carries `transcript="deck/turn"`. */
export const transcriptMeta: ShikiTransformer = {
  name: "deck-transcript-meta",
  pre(node) {
    const ref = parseTranscript(this.options.meta?.__raw);
    if (ref) node.properties["data-transcript"] = `${ref.deck}/${ref.turn}`;
  },
};

/** Replaces a marked, framed fence with the terminal figure; the code frame goes with it. */
export const transcriptFences: HastPluginEntry = () =>
  defineHastPlugin({
    name: "transcript-fences",
    element: {
      filter: ["figure"],
      visit(node, context) {
        const pre = (node.children as unknown[]).find(
          (child): child is HastElement => isElement(child) && child.tagName === "pre",
        );
        const marked = pre?.properties["data-transcript"] ?? pre?.properties.dataTranscript;
        if (!pre || typeof marked !== "string") return;
        const lines = parseTranscriptBody(textOf(pre));
        context.replaceNode(
          node as never,
          el("figure", { className: ["transcript-fence", "not-prose"], dataTranscript: marked }, [
            el("figcaption", {}, [
              el("span", { className: ["terminal-dots"], ariaHidden: "true" }),
              text("Scripted agent session"),
            ]),
            el("div", { dataLines: "" }, lines.map(lineElement)),
          ]) as never,
        );
      },
    },
  });
