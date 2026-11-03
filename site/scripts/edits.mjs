// Writes fixtures/examples/<name>.edits.json for each example in
// src/data/examples.json that names its `edits`: either a `from`..`to` pair (the
// commit with the agent's raw output and the commit with the edit) or a list of
// `commits` (the edit commits only, so a plumbing commit between them is left
// out). The fixture holds the diff's size for examples/<name>/ and up to two
// before/after caption lines, picked from single-line replacements of a story
// card's `lead:` (then `body:`) string.
// src/content-drift.test.ts recomputes it from git and fails when it drifts.
//
//   node scripts/edits.mjs
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const site = resolve(import.meta.dirname, "..");
const repo = resolve(site, "..");

function git(args) {
  const result = spawnSync("git", args, { cwd: repo, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")}: ${result.stderr.trim()}`);
  return result.stdout;
}

/** The text of a `lead: '...'` or `body: "..."` line; null for anything else. */
function captionText(line) {
  const match = /^\s*(lead|body):\s*(['"`])(.*)\2,?\s*$/.exec(line);
  if (!match || match[3]?.includes("${")) return null;
  return { field: match[1], text: match[3].replace(/\\(['"`])/g, "$1") };
}

/** A `--numstat` count; git prints `-` for a binary file, which has no lines to count. */
const lines = (count) => (count === "-" ? 0 : Number(count));

/**
 * Diff size and before/after caption pairs for examples/<name>, over `from`..`to`
 * or summed over each of `commits` against its parent. `files` counts each path once.
 */
export function computeEdits(name, edits) {
  const path = `examples/${name}`;
  const ranges = edits.commits ? edits.commits.map((sha) => [`${sha}^`, sha]) : [[edits.from, edits.to]];
  const stat = ranges.flatMap(([from, to]) =>
    git(["diff", "--numstat", from, to, "--", path])
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((row) => row.split("\t")),
  );
  const insertions = stat.reduce((sum, [added]) => sum + lines(added), 0);
  const deletions = stat.reduce((sum, [, removed]) => sum + lines(removed), 0);
  const pairs = [];
  let file = "";
  const hunks = ranges.flatMap(([from, to]) => git(["diff", "-U0", from, to, "--", path]).split("\n"));
  for (let i = 0; i < hunks.length; i++) {
    const line = hunks[i] ?? "";
    if (line.startsWith("+++ b/")) file = line.slice(`+++ b/${path}/`.length);
    if (!line.startsWith("@@")) continue;
    // A replacement hunk: N removed lines, then N added lines, paired in order.
    const removed = [];
    const added = [];
    let j = i + 1;
    while (hunks[j]?.startsWith("-") && !hunks[j]?.startsWith("---")) removed.push(hunks[j++]);
    while (hunks[j]?.startsWith("+") && !hunks[j]?.startsWith("+++")) added.push(hunks[j++]);
    if (removed.length === 0 || removed.length !== added.length) continue;
    removed.forEach((old, k) => {
      const before = captionText(old.slice(1));
      const now = captionText((added[k] ?? "").slice(1));
      if (!before || !now || before.field !== now.field) return;
      pairs.push({ file, field: before.field, before: before.text, after: now.text });
    });
  }
  const rank = (pair) => (pair.field === "lead" ? 0 : 1);
  return {
    ...(edits.commits ? { commits: edits.commits } : { from: edits.from, to: edits.to }),
    files: new Set(stat.map((row) => row.at(-1))).size,
    insertions,
    deletions,
    pairs: pairs
      .sort((a, b) => rank(a) - rank(b))
      .slice(0, 2)
      .map(({ file: where, before, after }) => ({ file: where, before, after })),
  };
}

if (import.meta.main) {
  const { examples } = JSON.parse(readFileSync(join(site, "src/data/examples.json"), "utf8"));
  for (const entry of examples) {
    if (!entry.edits) continue;
    const edits = computeEdits(entry.name, entry.edits);
    const out = join(site, "fixtures/examples", `${entry.name}.edits.json`);
    writeFileSync(out, `${JSON.stringify(edits, null, 2)}\n`);
    console.log(
      `wrote fixtures/examples/${entry.name}.edits.json: +${edits.insertions}/-${edits.deletions} in ${edits.files} files, ${edits.pairs.length} pairs`,
    );
  }
}
