export interface NoteSegment {
  /** The click this text belongs to. Text before the first marker belongs to click 0. */
  readonly click: number;
  readonly html: string;
}

export function segmentNotes(html: string): NoteSegment[] {
  const segments: NoteSegment[] = [];
  let click = 0;
  let start = 0;
  for (const marker of html.matchAll(/\[click(?::(\d+))?\]/g)) {
    const increment = marker[1] === undefined ? 1 : Number(marker[1]);
    if (!Number.isInteger(increment) || increment <= 0) continue;
    segments.push({ click, html: html.slice(start, marker.index).trim() });
    click += increment;
    start = marker.index + marker[0].length;
  }
  segments.push({ click, html: html.slice(start).trim() });
  return segments;
}

/** The click of the last marker; 0 when there are none. */
export function noteClickCount(html: string): number {
  let click = 0;
  for (const segment of segmentNotes(html)) click = segment.click;
  return click;
}
