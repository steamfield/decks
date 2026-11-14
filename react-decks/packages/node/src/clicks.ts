import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";

export const stepNames = new Set([
  "Step",
  "Steps",
  "Stagger",
  "TextReveal",
  "Highlight",
  "CountUp",
  "Draw",
]);

const parser = unified().use(remarkParse).use(remarkMdx);
type Element = Extract<
  ReturnType<typeof parser.parse>["children"][number],
  { type: "mdxJsxFlowElement" }
>;

interface ClickNode {
  type: string;
  name?: unknown;
  value?: unknown;
  attributes?: Element["attributes"];
  data?: unknown;
  children?: ClickNode[];
}

function integerAttribute(node: ClickNode, name: string, file: string): number {
  const attribute = node.attributes?.find(
    (attribute) => attribute.type === "mdxJsxAttribute" && attribute.name === name,
  );
  const value = attribute?.type === "mdxJsxAttribute" ? attribute.value : undefined;
  const statement =
    typeof value === "object" && value !== null ? value.data?.estree?.body[0] : undefined;
  const expression = statement?.type === "ExpressionStatement" ? statement.expression : undefined;
  if (
    expression?.type === "Literal" &&
    typeof expression.value === "number" &&
    Number.isInteger(expression.value) &&
    expression.value >= 0
  )
    return expression.value;
  throw new Error(`${file}: <${node.name}> ${name} must be a non-negative integer literal`);
}

function rejectExpressionSteps(node: unknown, file: string): void {
  if (typeof node !== "object" || node === null) return;
  if (
    "type" in node &&
    node.type === "JSXOpeningElement" &&
    "name" in node &&
    typeof node.name === "object" &&
    node.name !== null &&
    "name" in node.name &&
    typeof node.name.name === "string" &&
    stepNames.has(node.name.name)
  )
    throw new Error(
      `${file}: <${node.name.name}> inside a JavaScript expression cannot be counted; set clicks`,
    );
  for (const child of Object.values(node)) rejectExpressionSteps(child, file);
}

/** Syntax errors belong to the slide compiler; mid-edit they retain the last total. */
export function countClicks(source: string, file: string, previous = 0): number {
  let tree: ClickNode;
  try {
    tree = parser.parse(source);
  } catch {
    return previous;
  }
  let total = 0;
  const walk = (node: ClickNode): void => {
    rejectExpressionSteps(node.data, file);
    rejectExpressionSteps(node.attributes, file);
    const element = node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement";
    if (element && typeof node.name === "string" && stepNames.has(node.name)) {
      if (node.attributes?.some((attribute) => attribute.type === "mdxJsxExpressionAttribute"))
        throw new Error(`${file}: <${node.name}> spread attributes cannot be counted; set clicks`);
      if (node.name === "Steps") {
        const from = integerAttribute(node, "from", file);
        let children = 0;
        const content = (node.children ?? []).filter(
          (child) => child.type !== "text" || typeof child.value !== "string" || child.value.trim(),
        );
        if (content.length === 1 && content[0]?.type === "list") {
          children = content[0].children?.length ?? 0;
        } else if (content.length === 1 && ["ul", "ol"].includes(String(content[0]?.name))) {
          children = (content[0]?.children ?? []).filter(
            (child) =>
              (child.type === "mdxJsxFlowElement" || child.type === "mdxJsxTextElement") &&
              child.name === "li",
          ).length;
        } else
          for (const child of content) {
            if (child.type === "mdxJsxFlowElement" || child.type === "mdxJsxTextElement")
              children++;
            else
              throw new Error(
                `${file}: <Steps> children must be JSX elements or a single markdown list; put each child element on its own block, or use a markdown list`,
              );
          }
        if (children) total = Math.max(total, from + children - 1);
      } else {
        const at = integerAttribute(node, "at", file);
        const hasUntil = node.attributes?.some(
          (attribute) => attribute.type === "mdxJsxAttribute" && attribute.name === "until",
        );
        const until =
          hasUntil && ["Step", "Stagger", "Highlight", "Draw"].includes(node.name)
            ? integerAttribute(node, "until", file)
            : undefined;
        if (until !== undefined && until <= at)
          throw new Error(`${file}: <${node.name}> until must be greater than at`);
        total = Math.max(total, until ?? at);
      }
    }
    for (const child of node.children ?? []) walk(child);
  };
  walk(tree);
  return total;
}
