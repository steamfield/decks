import remarkFrontmatter from "remark-frontmatter";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { type PluggableList, unified } from "unified";
import { compileError, DeckError } from "../dev/errors";
import { inlineTags, type proseEntries } from "./prose-entries";

const parser = unified().use(remarkParse).use(remarkFrontmatter).use(remarkMdx);
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

export function collectMdxProse(
  file: string,
  source: string,
  entries: ReturnType<typeof proseEntries>,
  remarkPlugins?: PluggableList,
): void {
  const { add, clear } = entries;

  let tree: ProseNode;
  try {
    tree = parser()
      .use(remarkPlugins ?? [])
      .parse(source);
  } catch (cause) {
    throw compileError(cause, file);
  }
  const walkExpression = (node: unknown, notes: boolean): void => {
    if (!node || typeof node !== "object") return;
    const boundary =
      "type" in node && (node.type === "ConditionalExpression" || node.type === "JSXElement");
    if (boundary) clear();
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
    if (boundary) clear();
  };
  const walk = (node: ProseNode, notes = false): void => {
    if (node.name === "Disclosure") return;
    const boundary =
      node.type === "paragraph" ||
      node.type === "heading" ||
      node.type === "code" ||
      node.type === "inlineCode" ||
      (node.name !== undefined && node.name !== null && !inlineTags.has(node.name));
    if (boundary) clear();
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
    if (boundary) clear();
  };
  walk(tree);
}
