import { parseSync, Visitor } from "oxc-parser";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { type PluggableList, unified } from "unified";
import { compileError, DeckError } from "../errors";
import { proseOffsets } from "./prose-offsets";
import { allowOf, type loadPatterns } from "./prose-patterns";

const parser = unified().use(remarkParse).use(remarkFrontmatter).use(remarkMdx);
const inlineTags = new Set([
  "a",
  "b",
  "em",
  "i",
  "mark",
  "s",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "u",
]);
type Element = Extract<
  ReturnType<typeof parser.parse>["children"][number],
  { type: "mdxJsxFlowElement" }
>;
interface ProseNode {
  type: string;
  name?: string | null;
  value?: unknown;
  children?: ProseNode[];
  attributes?: Element["attributes"];
  data?: unknown;
  position?: { start: { offset?: number }; end: { offset?: number } };
}
interface Entry {
  text: string;
  offsets: number[];
  notes: boolean;
}

export interface ProseHit {
  file: string;
  line: number;
  col: number;
  id: string;
  severity: "error" | "warn";
  text: string;
  match: string;
}

export function scanSource(
  file: string,
  source: string,
  patterns: ReturnType<typeof loadPatterns>,
  options: { errorsOnly: boolean; remarkPlugins?: PluggableList },
): ProseHit[] {
  const entries: Entry[] = [];
  const prose = new Map<string, Entry>();
  const add = (
    text: string,
    start: number,
    notes: boolean,
    inline = false,
    raw = text,
    quote?: string,
  ) => {
    const positions = proseOffsets(raw, start, quote);
    let index = 0;
    for (const line of text.split("\n")) {
      const offsets = positions.slice(index, index + line.length);
      const key = `${notes}:${source.slice(0, offsets[0] ?? start).split("\n").length}`;
      const previous = inline ? prose.get(key) : undefined;
      if (previous) {
        previous.text += line;
        previous.offsets.push(...offsets);
      } else {
        const entry = { text: line, offsets, notes };
        entries.push(entry);
        if (inline) prose.set(key, entry);
      }
      index += line.length + 1;
    }
  };
  if (file.endsWith(".mdx")) {
    let tree: ProseNode;
    try {
      tree = parser()
        .use(options.remarkPlugins ?? [])
        .parse(source);
    } catch (cause) {
      throw compileError(cause, file);
    }
    const walkExpression = (node: unknown, notes: boolean): void => {
      if (!node || typeof node !== "object") return;
      const boundary =
        "type" in node && (node.type === "ConditionalExpression" || node.type === "JSXElement");
      if (boundary) prose.clear();
      if (
        "type" in node &&
        node.type === "JSXText" &&
        "value" in node &&
        typeof node.value === "string" &&
        "start" in node &&
        typeof node.start === "number"
      ) {
        const end =
          "end" in node && typeof node.end === "number" ? node.end : node.start + node.value.length;
        add(node.value, node.start, notes, true, source.slice(node.start, end));
      }
      if (
        "type" in node &&
        node.type === "JSXAttribute" &&
        "value" in node &&
        node.value &&
        typeof node.value === "object"
      ) {
        let value = node.value;
        let expression = false;
        if (
          "type" in value &&
          value.type === "JSXExpressionContainer" &&
          "expression" in value &&
          value.expression &&
          typeof value.expression === "object"
        ) {
          expression = true;
          value = value.expression;
        }
        if (
          "type" in value &&
          value.type === "Literal" &&
          "value" in value &&
          typeof value.value === "string" &&
          "start" in value &&
          typeof value.start === "number" &&
          "end" in value &&
          typeof value.end === "number"
        )
          add(
            value.value,
            value.start + 1,
            notes,
            false,
            source.slice(value.start + 1, value.end - 1),
            expression ? source[value.start] : undefined,
          );
      }
      for (const child of Object.values(node)) walkExpression(child, notes);
      if (boundary) prose.clear();
    };
    const walk = (node: ProseNode, notes = false): void => {
      if (node.name === "Disclosure") return;
      const boundary =
        node.type === "paragraph" ||
        node.type === "heading" ||
        node.type === "code" ||
        node.type === "inlineCode" ||
        (node.name !== undefined && node.name !== null && !inlineTags.has(node.name));
      if (boundary) prose.clear();
      const inNotes = notes || node.name === "Notes";
      if (node.type === "text" && typeof node.value === "string")
        add(
          node.value,
          node.position?.start.offset ?? 0,
          inNotes,
          true,
          source.slice(node.position?.start.offset, node.position?.end.offset),
        );
      walkExpression(node.data, inNotes);
      for (const attr of node.attributes ?? []) {
        if (attr.type !== "mdxJsxAttribute") continue;
        if (typeof attr.value === "string") {
          const start = attr.position?.start.offset ?? 0;
          const raw = source.slice(start, attr.position?.end.offset);
          const quote = raw.search(/["']/);
          add(attr.value, start + quote + 1, inNotes, false, raw.slice(quote + 1, -1));
        } else if (attr.value?.type === "mdxJsxAttributeValueExpression") {
          walkExpression(attr.value.data, inNotes);
          const expression = attr.value.data?.estree?.body[0];
          if (
            expression?.type === "ExpressionStatement" &&
            expression.expression.type === "Literal" &&
            typeof expression.expression.value === "string"
          ) {
            const literal = expression.expression;
            if (!("start" in literal) || typeof literal.start !== "number")
              throw new DeckError(
                "Cannot locate a string-literal prop. Check the slide syntax.",
                file,
              );
            if (typeof literal.value === "string") {
              const end =
                "end" in literal && typeof literal.end === "number"
                  ? literal.end
                  : literal.start + literal.value.length + 2;
              add(
                literal.value,
                literal.start + 1,
                inNotes,
                false,
                source.slice(literal.start + 1, end - 1),
                source[literal.start],
              );
            }
          }
        }
      }
      for (const child of node.children ?? []) walk(child, inNotes);
      if (boundary) prose.clear();
    };
    walk(tree);
  } else {
    const parsed = parseSync(file, source);
    const error = parsed.errors[0];
    if (error) {
      const before = source.slice(0, error.labels[0]?.start ?? 0).split("\n");
      throw new DeckError(`${error.message}. Check the component syntax.`, file, {
        line: before.length,
        column: (before.at(-1)?.length ?? 0) + 1,
      });
    }
    let notes = 0;
    let jsxDepth = 0;
    const branches = new Set<number>();
    const copyRanges: { start: number; end: number }[] = [];
    new Visitor({
      VariableDeclarator(node) {
        if (node.id.type !== "Identifier" || node.id.name !== "COPY") return;
        let value = node.init;
        while (
          value?.type === "TSAsExpression" ||
          value?.type === "TSSatisfiesExpression" ||
          value?.type === "ParenthesizedExpression"
        )
          value = value.expression;
        if (value?.type === "ArrayExpression") copyRanges.push(value);
      },
      JSXElement(node) {
        if (
          jsxDepth === 0 ||
          branches.has(node.start) ||
          node.openingElement.name.type !== "JSXIdentifier" ||
          !inlineTags.has(node.openingElement.name.name)
        )
          prose.clear();
        jsxDepth++;
        if (
          node.openingElement.name.type === "JSXIdentifier" &&
          node.openingElement.name.name === "Notes"
        )
          notes++;
      },
      "JSXElement:exit"(node) {
        jsxDepth--;
        if (
          jsxDepth === 0 ||
          branches.has(node.start) ||
          node.openingElement.name.type !== "JSXIdentifier" ||
          !inlineTags.has(node.openingElement.name.name)
        )
          prose.clear();
        if (
          node.openingElement.name.type === "JSXIdentifier" &&
          node.openingElement.name.name === "Notes"
        )
          notes--;
      },
      JSXText(node) {
        add(node.value, node.start, notes > 0, true, source.slice(node.start, node.end));
      },
      ConditionalExpression(node) {
        prose.clear();
        for (let branch of [node.consequent, node.alternate]) {
          while (branch.type === "ParenthesizedExpression") branch = branch.expression;
          branches.add(branch.start);
        }
      },
      "ConditionalExpression:exit"() {
        prose.clear();
      },
      JSXExpressionContainer(node) {
        if (node.expression.type !== "JSXEmptyExpression") prose.clear();
      },
      "JSXExpressionContainer:exit"(node) {
        if (node.expression.type !== "JSXEmptyExpression") prose.clear();
      },
      Property(node) {
        if (!copyRanges.some((range) => node.start >= range.start && node.end <= range.end)) return;
        const key =
          node.key.type === "Identifier"
            ? node.key.name
            : node.key.type === "Literal"
              ? node.key.value
              : undefined;
        if (key !== "lead" && key !== "body") return;
        if (node.value.type === "Literal" && typeof node.value.value === "string")
          add(
            node.value.value,
            node.value.start + 1,
            false,
            false,
            source.slice(node.value.start + 1, node.value.end - 1),
            source[node.value.start],
          );
        else if (node.value.type === "TemplateLiteral")
          for (const quasi of node.value.quasis)
            add(
              quasi.value.cooked ?? quasi.value.raw,
              quasi.start + 1,
              false,
              false,
              quasi.value.raw,
              "`",
            );
      },
    }).visit(parsed.program);
  }
  const lines = source.split("\n");
  const hits: ProseHit[] = [];
  for (const pattern of patterns) {
    for (const entry of entries) {
      const severity = entry.notes ? "warn" : pattern.severity;
      if (options.errorsOnly && severity === "warn") continue;
      const match = pattern.re.exec(entry.text);
      if (!match) continue;
      const offset = entry.offsets[match.index] ?? 0;
      const before = source.slice(0, offset).split("\n");
      const line = before.length;
      const allow = allowOf(lines[line - 1] ?? "");
      if (allow.includes("*") || allow.includes(pattern.id)) continue;
      hits.push({
        file,
        line,
        col: (before.at(-1)?.length ?? 0) + 1,
        id: pattern.id,
        severity,
        text: entry.text,
        match: match[0],
      });
    }
  }
  return hits;
}

export function formatHit(hit: ProseHit) {
  return `${hit.file}:${hit.line}:${hit.col}  ${hit.severity}  ${hit.id}  ${hit.match}`;
}
