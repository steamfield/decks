import { parseSync, Visitor } from "oxc-parser";
import { DeckError } from "../dev/errors";
import { inlineTags, type proseEntries } from "./prose-entries";

export function collectTsxProse(
  file: string,
  source: string,
  entries: ReturnType<typeof proseEntries>,
): void {
  const { add, clear } = entries;

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
        clear();
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
        clear();
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
      clear();
      for (let branch of [node.consequent, node.alternate]) {
        while (branch.type === "ParenthesizedExpression") branch = branch.expression;
        branches.add(branch.start);
      }
    },
    "ConditionalExpression:exit"() {
      clear();
    },
    JSXExpressionContainer(node) {
      if (node.expression.type !== "JSXEmptyExpression") clear();
    },
    "JSXExpressionContainer:exit"(node) {
      if (node.expression.type !== "JSXEmptyExpression") clear();
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
