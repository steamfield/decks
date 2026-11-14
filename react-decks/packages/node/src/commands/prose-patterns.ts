import { readFileSync } from "node:fs";

export const patternsFile = new URL(
  `${import.meta.url.endsWith(".ts") ? "../../lint/" : "./lint/"}ai-rhetoric-patterns.tsv`,
  import.meta.url,
);

export function loadPatterns(file: string | URL = patternsFile) {
  const patterns = readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.startsWith("#"))
    .map(
      (
        line,
      ): { id: string; severity: "error" | "warn"; message: string | undefined; re: RegExp } => {
        const [id, severity, ere, message] = line.split("\t");
        if (severity !== "error" && severity !== "warn")
          throw new Error(`${file}: pattern "${id}" has severity "${severity}", not error or warn`);
        if (!ere) throw new Error(`${file}: pattern "${id}" has no regex`);
        return {
          id: id ?? "",
          severity,
          message,
          re: new RegExp(ere.replaceAll("[[:space:]]", "\\s")),
        };
      },
    );
  if (!patterns.some((pattern) => pattern.severity === "error"))
    throw new Error(`${file} has no error-severity patterns (empty or truncated?)`);
  return patterns;
}

export function allowOf(line: string): string[] {
  if (/lint-allow\s*([}*]|-->|$)/.test(line)) return ["*"];
  const match = /lint-allow:\s*/.exec(line);
  return match
    ? line
        .slice(match.index + match[0].length)
        .replace(/\s*(\*\/|-->|}).*/, "")
        .replace(/\s/g, "")
        .split(",")
    : [];
}
