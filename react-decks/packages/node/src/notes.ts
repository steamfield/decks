import { segmentNotes } from "@react-decks/core";
import rehypeStringify from "rehype-stringify";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

interface NotesNode {
  type: string;
  name?: unknown;
  children?: NotesNode[];
  data?: unknown;
  attributes?: unknown;
  position?: { start: { offset?: number }; end: { offset?: number } };
}

const parser = unified().use(remarkParse).use(remarkFrontmatter).use(remarkMdx);

const renderer = unified().use(remarkParse).use(remarkRehype).use(rehypeStringify);

/** A slide's notes split at its click markers, each segment rendered to HTML on its own. */
export async function renderNotes(
  source: string,
  file: string,
): Promise<{ click: number; html: string }[] | undefined> {
  const notes: NotesNode[] = [];
  let tree: NotesNode;
  try {
    tree = parser.parse(source);
  } catch (cause) {
    throw new Error(`${file}: ${cause instanceof Error ? cause.message : String(cause)}`, {
      cause,
    });
  }
  collectNotes(tree, notes, file);
  if (notes.length > 1) throw new Error(`${file}: more than one <Notes> block`);
  const node = notes[0];
  if (!node?.children?.length) return undefined;
  const markdown = source.slice(
    node.children[0]?.position?.start.offset,
    node.children.at(-1)?.position?.end.offset,
  );
  return Promise.all(
    segmentNotes(markdown).map(async (segment) => ({
      click: segment.click,
      html: String(await renderer.process(segment.markdown)),
    })),
  );
}

function rejectExpressionNotes(node: unknown, file: string): void {
  if (typeof node !== "object" || node === null) return;
  if (
    "type" in node &&
    node.type === "JSXOpeningElement" &&
    "name" in node &&
    typeof node.name === "object" &&
    node.name !== null &&
    "name" in node.name &&
    node.name.name === "Notes"
  )
    throw new Error(`${file}: <Notes> inside a JSX expression is not supported`);
  for (const child of Object.values(node)) rejectExpressionNotes(child, file);
}

function collectNotes(node: NotesNode, notes: NotesNode[], file: string): void {
  rejectExpressionNotes(node.data, file);
  rejectExpressionNotes(node.attributes, file);
  if (
    (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") &&
    node.name === "Notes"
  )
    notes.push(node);
  for (const child of node.children ?? []) collectNotes(child, notes, file);
}

export function removeNotes() {
  return (tree: NotesNode, file: { path: string }) => {
    const notes: NotesNode[] = [];
    collectNotes(tree, notes, file.path);
    if (notes.length > 1) throw new Error(`${file.path}: more than one <Notes> block`);
    const remove = (node: NotesNode): void => {
      if (!node.children) return;
      node.children = node.children.filter((child) => !notes.includes(child));
      for (const child of node.children) remove(child);
    };
    remove(tree);
  };
}
