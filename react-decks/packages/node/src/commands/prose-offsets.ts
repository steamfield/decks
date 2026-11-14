import { parseSync } from "oxc-parser";
import remarkParse from "remark-parse";
import { unified } from "unified";

const markdown = unified().use(remarkParse);

/** Keep source positions while the parsers decode escapes and character references. */
export function proseOffsets(raw: string, start: number, quote?: string): number[] {
  const offsets: number[] = [];
  const units = quote
    ? /\r\n|\\(?:u\{[\da-f]+\}|u[\da-f]{4}|x[\da-f]{2}|\r\n|[\s\S])|[\s\S]/gi
    : /\r\n|&(?:#\d+|#x[\da-f]+|[a-z][\da-z]*);|\\[!"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~\\]|[\s\S]/gi;
  for (const unit of raw.matchAll(units)) {
    const text = unit[0];
    let decoded = quote && text === "\r\n" ? "\n" : text;
    if (quote && text.startsWith("\\")) {
      const statement = parseSync("literal.ts", `${quote}${text}${quote}`).program.body[0];
      if (statement?.type === "ExpressionStatement") {
        const value = statement.expression;
        if (value.type === "Literal" && typeof value.value === "string") decoded = value.value;
        else if (value.type === "TemplateLiteral") decoded = value.quasis[0]?.value.cooked ?? text;
      }
    } else if (!quote && (text.startsWith("&") || text.startsWith("\\"))) {
      const paragraph = markdown.parse(text).children[0];
      const value = paragraph?.type === "paragraph" ? paragraph.children[0] : undefined;
      if (value?.type === "text") decoded = value.value;
    }
    for (let index = 0; index < decoded.length; index++) offsets.push(start + unit.index);
  }
  return offsets;
}
