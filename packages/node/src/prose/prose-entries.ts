import { proseOffsets } from "./prose-offsets";

export const inlineTags = new Set([
  "a",
  "b",
  "em",
  "i",
  "mark",
  "s",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "u",
]);
interface Entry {
  text: string;
  offsets: number[];
  notes: boolean;
}

export function proseEntries(source: string) {
  const entries: Entry[] = [];
  const prose = new Map<string, Entry>();
  const add = (
    text: string,
    start: number,
    notes: boolean,
    inline = false,
    raw = text,
    quote?: string,
  ) => {
    const positions = proseOffsets(raw, start, quote);
    let index = 0;
    for (const line of text.split("\n")) {
      const offsets = positions.slice(index, index + line.length);
      const key = `${notes}:${source.slice(0, offsets[0] ?? start).split("\n").length}`;
      const previous = inline ? prose.get(key) : undefined;
      if (previous) {
        previous.text += line;
        previous.offsets.push(...offsets);
      } else {
        const entry = { text: line, offsets, notes };
        entries.push(entry);
        if (inline) prose.set(key, entry);
      }
      index += line.length + 1;
    }
  };
  return { entries, add, clear: () => prose.clear() };
}
