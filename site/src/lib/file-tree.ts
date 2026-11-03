// Turns a flat list of file paths into the lines of an indented file tree.
// Directories come before files at each level; a directory with a single child
// folds into it ("skills/building-a-deck/SKILL.md" stays one line under skills/).

export type TreeLine = {
  depth: number;
  /** What the line prints: "agents/deck-author.md" or "rules/". */
  label: string;
  /** The file's full path; null on a directory line. */
  path: string | null;
};

type Node = { name: string; children: Map<string, Node>; path: string | null };

const node = (name: string): Node => ({ name, children: new Map(), path: null });

export function treeLines(paths: readonly string[]): TreeLine[] {
  const root = node("");
  for (const path of paths) {
    let at = root;
    for (const part of path.split("/")) {
      const next = at.children.get(part) ?? node(part);
      at.children.set(part, next);
      at = next;
    }
    at.path = path;
  }
  const lines: TreeLine[] = [];
  /** Follows single-child directories down: the node a line prints and its label. */
  const fold = (kid: Node) => {
    let at = kid;
    let label = kid.name;
    while (at.children.size === 1 && at.path === null) {
      const [only] = at.children.values();
      if (!only) break;
      label = `${label}/${only.name}`;
      at = only;
    }
    return { at, label };
  };
  const walk = (parent: Node, depth: number) => {
    // A folded line that ends in a file sorts with the files.
    const kids = [...parent.children.values()].map(fold).sort((a, b) => {
      const dir = Number(b.at.children.size > 0) - Number(a.at.children.size > 0);
      return dir || a.label.localeCompare(b.label);
    });
    for (const { at, label } of kids) {
      if (at.children.size === 0) {
        lines.push({ depth, label, path: at.path });
      } else {
        lines.push({ depth, label: `${label}/`, path: null });
        walk(at, depth + 1);
      }
    }
  };
  walk(root, 0);
  return lines;
}
