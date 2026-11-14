export interface NoteSegment {
  /** The click this text belongs to. Text before the first marker belongs to click 0. */
  readonly click: number;
  /** Markdown source of the segment, trimmed. */
  readonly markdown: string;
}

/** Splits a slide's notes, as markdown source, at its click markers. */
export function segmentNotes(markdown: string): NoteSegment[] {
  const segments: NoteSegment[] = [];
  let click = 0;
  let start = 0;
  for (const marker of markdown.matchAll(/^[ \t]*\[click(?::(\d+))?\][ \t]*/gm)) {
    const increment = marker[1] === undefined ? 1 : Number(marker[1]);
    if (!Number.isInteger(increment) || increment <= 0) continue;
    segments.push({ click, markdown: markdown.slice(start, marker.index).trim() });
    click += increment;
    start = marker.index + marker[0].length;
  }
  segments.push({ click, markdown: markdown.slice(start).trim() });
  return segments;
}

/** The click of the last marker; 0 when there are none. */
export function noteClickCount(markdown: string): number {
  return segmentNotes(markdown).at(-1)?.click ?? 0;
}
