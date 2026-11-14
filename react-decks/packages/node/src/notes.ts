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
  collectNotes(parser.parse(source), notes);
  if (notes.length > 1) throw new Error(`${file}: more than one <Notes> block`);
  const node = notes[0];
  if (!node) return undefined;
  const markdown = source
    .slice(node.position?.start.offset, node.position?.end.offset)
    .replace(/^<Notes\s*>/, "")
    .replace(/<\/Notes>$/, "");
  return Promise.all(
    segmentNotes(markdown).map(async (segment) => ({
      click: segment.click,
      html: String(await renderer.process(segment.markdown)),
    })),
  );
}

function collectNotes(node: NotesNode, notes: NotesNode[]): void {
  if (
    (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") &&
    node.name === "Notes"
  )
    notes.push(node);
  for (const child of node.children ?? []) collectNotes(child, notes);
}

export function removeNotes() {
  return (tree: NotesNode, file: { path: string }) => {
    const notes: NotesNode[] = [];
    collectNotes(tree, notes);
    if (notes.length > 1) throw new Error(`${file.path}: more than one <Notes> block`);
    const remove = (node: NotesNode): void => {
      if (!node.children) return;
      node.children = node.children.filter((child) => !notes.includes(child));
      for (const child of node.children) remove(child);
    };
    remove(tree);
  };
}
