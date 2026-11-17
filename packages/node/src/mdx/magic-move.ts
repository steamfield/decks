import { codeToKeyedTokens } from "@shikijs/magic-move/core";
import remarkParse from "remark-parse";
import {
  type BundledLanguage,
  bundledLanguages,
  createCssVariablesTheme,
  getSingletonHighlighter,
  type Highlighter,
  isSpecialLang,
} from "shiki";
import { unified } from "unified";
import { DeckError } from "../dev/errors";
import { parseCodeOptions } from "./code-options";

const parser = unified().use(remarkParse);
type Root = ReturnType<Highlighter["codeToHast"]>;
type Parent = Root | Extract<Root["children"][number], { children: unknown }>;
const isBundledLanguage = (lang: string): lang is BundledLanguage => lang in bundledLanguages;

export function isMagicMove(lang: string | null | undefined, meta: string | null | undefined) {
  return /^(?:md|markdown)$/.test(lang ?? "") && /^magic-move(?:\s|$)/.test(meta ?? "");
}

export function parseMagicMove(value: string, meta: string, file: string, line: number) {
  const fail = (option: string, at = line): never => {
    throw new DeckError(`invalid magic-move ${option}`, file, { line: at, column: 1 });
  };
  const object = (text: string, outer: boolean, at: number) => {
    const result: { at?: number; lines?: boolean } = {};
    if (!text.trim()) return result;
    if (!/^\{[^{}]*\}$/.test(text.trim())) return fail(`options ${text}`, at);
    const entries = text.trim().slice(1, -1).split(",");
    if (!entries.at(-1)?.trim()) entries.pop();
    for (const entry of entries) {
      const match = /^\s*(at|lines)\s*:\s*(\d+|true|false)\s*$/.exec(entry);
      const key = match?.[1];
      const value = match?.[2];
      if (!key || !value || key in result) return fail(`option ${entry}`, at);
      if (key === "lines" && (value === "true" || value === "false"))
        result.lines = value === "true";
      else if (key === "at" && outer && /^\d+$/.test(value) && Number.isSafeInteger(Number(value)))
        result.at = Number(value);
      else return fail(`option ${entry}`, at);
    }
    return result;
  };
  const header = /^magic-move\s*(?:"([^"]*)"|'([^']*)'|\[([^\]]*)\])?\s*(.*)$/.exec(meta);
  if (!header) return fail(`header ${meta}`);
  const options = object(header[4] ?? "", true, line);
  const steps = parser.parse(value).children.flatMap((node) => {
    if (node.type !== "code") return [];
    const at = line + (node.position?.start.line ?? 1);
    // Indented code is prose here; each step must be a fenced block.
    const start = value.slice(node.position?.start.offset ?? 0);
    if (!/^(`{3,}|~{3,})/.test(start)) return [];
    const inner = node.meta ?? "";
    const ranges = /^\s*(\{[^}:]*\})(?:\s|$)/.exec(inner);
    let parsed: ReturnType<typeof parseCodeOptions>;
    try {
      parsed = parseCodeOptions(ranges?.[1] ?? "", node.value.split("\n").length, file);
    } catch (cause) {
      if (cause instanceof DeckError) return fail(`range ${ranges?.[1]}`, at);
      throw cause;
    }
    const stepOptions = object(inner.slice(ranges?.[0].length ?? 0), false, at);
    return [
      {
        code: node.value,
        lang: node.lang ?? "text",
        ranges: parsed.steps ?? [],
        lines: stepOptions.lines ?? options.lines ?? false,
      },
    ];
  });
  if (!steps.length) return fail("fence: expected an inner code fence");
  return { at: options.at ?? 0, title: header[1] ?? header[2] ?? header[3], steps };
}

export async function compileMagicMoves(tree: Root, file: { path: string; value: unknown }) {
  const walk = async (parent: Parent): Promise<void> => {
    for (const [index, node] of parent.children.entries()) {
      if (node.type !== "element") {
        if ("children" in node) await walk(node);
        continue;
      }
      const code = node.tagName === "pre" ? node.children[0] : undefined;
      const classes = code?.type === "element" ? code.properties.className : undefined;
      const meta = code?.type === "element" ? code.data?.meta : undefined;
      if (
        code?.type === "element" &&
        Array.isArray(classes) &&
        classes.some(
          (name) => typeof name === "string" && /^language-(?:md|markdown)$/.test(name),
        ) &&
        typeof meta === "string" &&
        isMagicMove("md", meta)
      ) {
        const line = node.position?.start.line ?? 1;
        const source = String(file.value).slice(node.position?.start.offset ?? 0);
        if (!/^`{4,}/.test(source))
          throw new DeckError("magic-move needs four or more backticks", file.path, {
            line,
            column: 1,
          });
        const parsed = parseMagicMove(
          code.children
            .map((child) => (child.type === "text" ? child.value : ""))
            .join("")
            .replace(/\n$/, ""),
          meta,
          file.path,
          line,
        );
        const theme = createCssVariablesTheme();
        // Use the same singleton and theme as rehypeShiki's ordinary code blocks.
        const highlighter = await getSingletonHighlighter({
          themes: [theme],
          langs: Object.keys(bundledLanguages),
        });
        const steps = parsed.steps.map((step) => {
          const lang =
            isBundledLanguage(step.lang) || isSpecialLang(step.lang) ? step.lang : "text";
          if (lang !== step.lang)
            console.warn(`${file.path}: unknown code language ${step.lang}; using plain text`);
          return codeToKeyedTokens(highlighter, step.code, { lang, theme }, step.lines);
        });
        parent.children[index] = {
          type: "mdxJsxFlowElement",
          name: "MagicMove",
          attributes: Object.entries({
            steps: JSON.stringify(steps),
            at: String(parsed.at),
            ranges: JSON.stringify(parsed.steps.map((step) => step.ranges)),
            ...(parsed.title === undefined ? {} : { title: parsed.title }),
          }).map(([name, value]) => ({ type: "mdxJsxAttribute", name, value })),
          children: [],
        };
      } else await walk(node);
    }
  };
  await walk(tree);
}
