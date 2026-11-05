import {
  type MdastNode,
  type MdxJsxFlowElement,
  type MdxJsxTextElement,
  mdxToMdast,
} from "satteri";

/** Read the same MDX syntax the site builds, excluding code examples and comments. */
export function inspectMdx(source: string) {
  const demos: (MdxJsxFlowElement | MdxJsxTextElement)[] = [];
  const fences: Extract<MdastNode, { type: "code" }>[] = [];
  const visit = (node: MdastNode) => {
    if (
      (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") &&
      node.name === "DeckDemo"
    )
      demos.push(node);
    if (node.type === "code") fences.push(node);
    if ("children" in node) for (const child of node.children) visit(child);
  };
  visit(mdxToMdast(source));
  return { demos, fences };
}

export const deckDemoCount = (source: string) => inspectMdx(source).demos.length;
