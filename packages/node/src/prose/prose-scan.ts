import type { PluggableList } from "unified";
import { collectMdxProse } from "./mdx-prose";
import { proseEntries } from "./prose-entries";
import { allowOf, type loadPatterns } from "./prose-patterns";
import { collectTsxProse } from "./tsx-prose";

export interface ProseHit {
  file: string;
  line: number;
  col: number;
  id: string;
  severity: "error" | "warn";
  text: string;
  match: string;
}

export function scanSource(
  file: string,
  source: string,
  patterns: ReturnType<typeof loadPatterns>,
  options: { errorsOnly: boolean; remarkPlugins?: PluggableList },
): ProseHit[] {
  const prose = proseEntries(source);
  if (file.endsWith(".mdx")) collectMdxProse(file, source, prose, options.remarkPlugins);
  else collectTsxProse(file, source, prose);

  const lines = source.split("\n");
  const hits: ProseHit[] = [];
  for (const pattern of patterns) {
    for (const entry of prose.entries) {
      const severity = entry.notes ? "warn" : pattern.severity;
      if (options.errorsOnly && severity === "warn") continue;
      const match = pattern.re.exec(entry.text);
      if (!match) continue;
      const offset = entry.offsets[match.index] ?? 0;
      const before = source.slice(0, offset).split("\n");
      const line = before.length;
      const allow = allowOf(lines[line - 1] ?? "");
      if (allow.includes("*") || allow.includes(pattern.id)) continue;
      hits.push({
        file,
        line,
        col: (before.at(-1)?.length ?? 0) + 1,
        id: pattern.id,
        severity,
        text: entry.text,
        match: match[0],
      });
    }
  }
  return hits;
}

export function formatHit(hit: ProseHit) {
  return `${hit.file}:${hit.line}:${hit.col}  ${hit.severity}  ${hit.id}  ${hit.match}`;
}
