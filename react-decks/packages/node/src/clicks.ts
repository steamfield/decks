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

function elementChildren(node: ClickNode | undefined): ClickNode[] {
  return (node?.children ?? [])
    .flatMap((child) =>
      child.type === "paragraph" &&
      child.children?.every(
        (part) =>
          part.type === "mdxJsxTextElement" ||
          (part.type === "text" &&
            typeof part.value === "string" &&
            /^[\t\n\v\f\r ]*$/.test(part.value)),
      )
        ? child.children
        : [child],
    )
    .filter(
      (child) => child.type !== "text" || typeof child.value !== "string" || child.value.trim(),
    );
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

function rejectExpressionSteps(
  node: unknown,
  file: string,
  names: ReadonlyMap<string, string>,
): void {
  if (typeof node !== "object" || node === null) return;
  if (
    "type" in node &&
    node.type === "JSXOpeningElement" &&
    "name" in node &&
    typeof node.name === "object" &&
    node.name !== null &&
    "name" in node.name &&
    typeof node.name.name === "string" &&
    names.has(node.name.name)
  )
    throw new Error(
      `${file}: <${node.name.name}> inside a JavaScript expression cannot be counted; set clicks`,
    );
  for (const child of Object.values(node)) rejectExpressionSteps(child, file, names);
}

/** Syntax errors belong to the slide compiler; mid-edit they retain the last total. */
export function countClicks(
  source: string,
  file: string,
  previous = 0,
  motionNames: ReadonlyMap<string, string> = new Map(),
): number {
  let tree: ReturnType<typeof parser.parse>;
  try {
    tree = parser.parse(source);
  } catch {
    return previous;
  }
  const names = new Map(motionNames);
  for (const node of tree.children) {
    if (node.type !== "mdxjsEsm") continue;
    for (const statement of node.data?.estree?.body ?? []) {
      if (statement.type === "ImportDeclaration") {
        for (const specifier of statement.specifiers) {
          const local = specifier.local.name;
          names.delete(local);
          if (
            statement.source.value !== "@react-decks/motion" ||
            specifier.type !== "ImportSpecifier"
          )
            continue;
          const imported =
            specifier.imported.type === "Identifier"
              ? specifier.imported.name
              : specifier.imported.value;
          if (typeof imported === "string" && stepNames.has(imported)) names.set(local, imported);
        }
        continue;
      }
      const declaration =
        statement.type === "ExportNamedDeclaration" || statement.type === "ExportDefaultDeclaration"
          ? statement.declaration
          : statement;
      if (declaration?.type === "FunctionDeclaration" || declaration?.type === "ClassDeclaration") {
        if (declaration.id) names.delete(declaration.id.name);
      } else if (declaration?.type === "VariableDeclaration") {
        const bindings = declaration.declarations.map(({ id }) => id);
        for (const binding of bindings) {
          if (binding.type === "Identifier") names.delete(binding.name);
          else if (binding.type === "ObjectPattern")
            for (const property of binding.properties)
              bindings.push(property.type === "RestElement" ? property.argument : property.value);
          else if (binding.type === "ArrayPattern")
            for (const element of binding.elements) {
              if (element) bindings.push(element);
            }
          else if (binding.type === "RestElement") bindings.push(binding.argument);
          else if (binding.type === "AssignmentPattern") bindings.push(binding.left);
        }
      }
    }
  }
  // Intrinsic tags and member expressions do not resolve through this component map.
  for (const name of names.keys()) {
    if (/^[a-z]|[.-]/.test(name)) names.delete(name);
  }
  let total = 0;
  const walk = (node: ClickNode): void => {
    rejectExpressionSteps(node.data, file, names);
    rejectExpressionSteps(node.attributes, file, names);
    const element = node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement";
    const motion = typeof node.name === "string" ? names.get(node.name) : undefined;
    if (element && motion) {
      if (node.attributes?.some((attribute) => attribute.type === "mdxJsxExpressionAttribute"))
        throw new Error(`${file}: <${node.name}> spread attributes cannot be counted; set clicks`);
      if (motion === "Steps") {
        const from = integerAttribute(node, "from", file);
        let children = 0;
        const content = elementChildren(node);
        if (content.length === 1 && content[0]?.type === "list") {
          children = content[0].children?.length ?? 0;
        } else if (content.length === 1 && ["ul", "ol"].includes(String(content[0]?.name))) {
          children = elementChildren(content[0]).filter(
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
                `${file}: <Steps> children must be JSX elements or a single markdown list`,
              );
          }
        if (children) total = Math.max(total, from + children - 1);
      } else {
        const at = integerAttribute(node, "at", file);
        const hasUntil = node.attributes?.some(
          (attribute) => attribute.type === "mdxJsxAttribute" && attribute.name === "until",
        );
        const until =
          hasUntil && ["Step", "Stagger", "Highlight", "Draw"].includes(motion)
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
