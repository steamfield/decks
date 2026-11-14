import { type MdastNode, markdownToMdast } from "satteri";
import type { DocData } from "../content/schema";

/** Preserve the quickstart URL; other guide pages use their filenames. */
export function guideId(file: string): string {
  const name = file.replace(/\.md$/, "");
  if (name === "README") return "overview";
  return name === "getting-started" ? "getting-started/quickstart" : name;
}

/** The package guide has no frontmatter; the site derives its navigation metadata. */
export function guideData(id: string, body: string): DocData {
  const title = /^# (.+)$/m.exec(body)?.[1];
  if (!title) throw new Error(`Guide ${id} needs a level-one title.`);
  const paragraph =
    body
      .replace(/^# .+\r?\n/, "")
      .trim()
      .split(/\r?\n\s*\r?\n/)[0] ?? "";
  const summary = paragraph.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[`*]/g, "");
  return {
    title,
    description: summary.length > 160 ? `${summary.slice(0, 157).trimEnd()}...` : summary,
    group:
      id === "overview" || id === "getting-started/quickstart"
        ? "getting-started"
        : id === "cli" || id === "config"
          ? "reference"
          : "guides",
    order: id === "overview" ? 0 : id === "getting-started/quickstart" ? 1 : 100,
  };
}

/** Guide-relative links need absolute site routes, including from the nested quickstart. */
export function guideLink(href: string): string {
  const match = /^(?:\.\/)?([\w-]+\.md)(#.*)?$/.exec(href);
  return match ? `/docs/${guideId(match[1] ?? "")}/${match[2] ?? ""}` : href;
}

/** Rewrite parsed guide links in exports while leaving code examples intact. */
export function guideMarkdown(source: string): string {
  const edits: { start: number; end: number; text: string }[] = [];
  const visit = (node: MdastNode) => {
    if (node.type === "link" || node.type === "definition") {
      const href = guideLink(node.url);
      const start = node.position?.start.offset;
      const end = node.position?.end.offset;
      if (href !== node.url && start !== undefined && end !== undefined) {
        const afterLabel =
          node.type === "link"
            ? (node.children.at(-1)?.position?.end.offset ?? start + 1)
            : source.indexOf("]:", start) + 2;
        const offset = source.indexOf(node.url, afterLabel);
        if (offset < afterLabel || offset + node.url.length > end)
          throw new Error(`Cannot locate guide link ${node.url}.`);
        edits.push({ start: offset, end: offset + node.url.length, text: href });
      }
    }
    if ("children" in node) for (const child of node.children) visit(child);
  };
  visit(markdownToMdast(source));
  for (const edit of edits.sort((a, b) => b.start - a.start))
    source = source.slice(0, edit.start) + edit.text + source.slice(edit.end);
  return source;
}
