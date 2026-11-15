import { segmentNotes } from "@react-decks/core";
import rehypeStringify from "rehype-stringify";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { type PluggableList, unified } from "unified";
import { compileError, DeckError } from "../dev/errors";

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
  remarkPlugins: PluggableList = [],
): Promise<{ click: number; html: string }[] | undefined> {
  const notes: NotesNode[] = [];
  let tree: NotesNode;
  try {
    tree = parser().use(remarkPlugins).parse(source);
  } catch (cause) {
    throw compileError(cause, file);
  }
  collectNotes(tree, notes, file);
  if (notes.length > 1)
    throw new DeckError(`more than one <Notes> block. Keep one <Notes> block per slide.`, file);
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
    throw new DeckError(
      `<Notes> inside a JSX expression is not supported. Write it as a separate block.`,
      file,
    );
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
    if (notes.length > 1)
      throw new DeckError(
        `more than one <Notes> block. Keep one <Notes> block per slide.`,
        file.path,
      );
    const remove = (node: NotesNode): void => {
      if (!node.children) return;
      node.children = node.children.filter((child) => !notes.includes(child));
      for (const child of node.children) remove(child);
    };
    remove(tree);
  };
}
