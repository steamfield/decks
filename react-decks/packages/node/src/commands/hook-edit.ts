import { readFileSync } from "node:fs";

interface Edit {
  old_string: string;
  new_string: string;
  replace_all?: boolean;
  after?: string;
  end?: boolean;
}
export interface WriteCall {
  toolName: "Write" | "Edit" | "MultiEdit";
  file: string;
  source?: string;
  content?: string;
  edits: Edit[];
}

export function replay(call: WriteCall, path: string) {
  if (call.toolName === "Write") {
    const src = call.content ?? "";
    return { src, ranges: [[0, src.length]], before: undefined };
  }
  let src = readFileSync(path, "utf8");
  const before = src;
  let ranges: number[][] = [];
  let cursor = 0;
  for (const edit of call.edits) {
    const from = edit.old_string;
    const to = edit.new_string;
    if (call.source && !from) {
      const text = `${src && !src.endsWith("\n") ? "\n" : ""}${to}\n`;
      ranges.push([src.length, src.length + text.length]);
      src += text;
      cursor = src.length;
      continue;
    }
    if (edit.after) {
      const anchor = src.indexOf(edit.after, cursor);
      if (anchor < 0)
        throw new Error(`${path}: cannot find apply_patch anchor ${JSON.stringify(edit.after)}.`);
      cursor = anchor + edit.after.length;
    }
    const first = edit.end ? src.lastIndexOf(from) : src.indexOf(from, call.source ? cursor : 0);
    if (edit.end && !["", "\n", "\r\n"].includes(src.slice(first + from.length)))
      throw new Error(`${path}: cannot replay apply_patch End of File context.`);
    if (!from || first < 0)
      throw new Error(
        `${path}: cannot replay edit: old_string ${JSON.stringify(from)} is not in the file.`,
      );
    const positions: number[] = [];
    for (let at = first; at >= 0; at = src.indexOf(from, at + from.length)) {
      positions.push(at);
      if (!edit.replace_all) break;
    }
    const delta = to.length - from.length;
    const carry = (p: number) => {
      let shift = 0;
      for (const at of positions) {
        if (p >= at + from.length) shift += delta;
        else if (p > at) return at + shift + Math.min(p - at, to.length);
        else break;
      }
      return p + shift;
    };
    ranges = ranges.map((range) => range.map(carry));
    let next = "";
    let last = 0;
    for (const [index, at] of positions.entries()) {
      next += src.slice(last, at) + to;
      last = at + from.length;
      const start = at + index * delta;
      ranges.push([start, start + to.length]);
    }
    src = next + src.slice(last);
    cursor = (positions.at(-1) ?? 0) + (positions.length - 1) * delta + to.length;
  }
  const touched = new Set<number>();
  for (const range of ranges) {
    let start = range[0] ?? 0;
    const end = range[1] ?? start;
    if (start === end) continue;
    if (src[start] === "\n") start++;
    const first = src.slice(0, start).split("\n").length;
    const last = src.slice(0, Math.max(start, end - 1)).split("\n").length;
    for (let line = first; line <= last; line++) touched.add(line);
  }
  return { src, ranges, before, touched };
}

export function patchWrites(patch: string): WriteCall[] {
  if (!patch.startsWith("*** Begin Patch") || !patch.trimEnd().endsWith("*** End Patch"))
    throw new Error("apply_patch command must contain *** Begin Patch and *** End Patch.");
  const calls: WriteCall[] = [];
  let call: WriteCall | undefined;
  let hunk: { old: string[]; next: string[]; after?: string; end?: boolean } | undefined;
  let added: string[] = [];
  const endHunk = () => {
    if (call && hunk && (hunk.old.length || hunk.next.length))
      call.edits.push({
        old_string: hunk.old.join("\n"),
        new_string: hunk.next.join("\n"),
        after: hunk.after,
        end: hunk.end,
      });
    hunk = undefined;
  };
  const endFile = () => {
    endHunk();
    if (call?.toolName === "Write") call.content = `${added.join("\n")}\n`;
    if (call) calls.push(call);
    call = undefined;
    added = [];
  };
  for (const line of patch.split("\n")) {
    const header = /^\*\*\* (Add File|Update File|Delete File|Move to): (.+)$/.exec(line);
    if (header) {
      const kind = header[1];
      const file = header[2]?.trim();
      if (!file) throw new Error("apply_patch file path is empty.");
      if (kind === "Move to") {
        if (call) call.file = file;
        continue;
      }
      endFile();
      if (kind === "Add File") call = { toolName: "Write", file, edits: [] };
      if (kind === "Update File") call = { toolName: "MultiEdit", file, source: file, edits: [] };
      continue;
    }
    if (/^\*\*\* (Begin|End) Patch\b/.test(line)) {
      endFile();
      continue;
    }
    if (!call) continue;
    if (call.toolName === "Write") {
      if (line.startsWith("+")) added.push(line.slice(1));
      continue;
    }
    if (line.startsWith("@@")) {
      endHunk();
      hunk = { old: [], next: [], after: line.slice(2).trim() || undefined };
      continue;
    }
    if (line === "*** End of File") {
      if (hunk) hunk.end = true;
      continue;
    }
    hunk ??= { old: [], next: [] };
    if (line.startsWith("-")) hunk.old.push(line.slice(1));
    else if (line.startsWith("+")) hunk.next.push(line.slice(1));
    else {
      const context = line.startsWith(" ") ? line.slice(1) : line;
      hunk.old.push(context);
      hunk.next.push(context);
    }
  }
  endFile();
  return calls;
}
