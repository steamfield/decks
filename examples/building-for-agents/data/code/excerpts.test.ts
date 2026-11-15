/**
 * Drift test for the code on the slides. For every excerpt module in this
 * directory, each shown line (elision lines aside) must appear, in order,
 * within the cited line range of the cited file. A line cut short with a
 * trailing ` …` must be the start of its source line. The source is read from the excerpt's
 * pinned commit with `git show`, so it does not depend on the sibling repo's working tree.
 * The source checks run only with DECKS_SOURCE_REPOS=1 and fail when a repo or commit is missing.
 */
import { describe, expect, it } from "vitest";
import { describeSourceRepos, readAtCommit } from "../source-repos.test-support";
import { cutLine, type Excerpt, isElision } from "./types";

const modules = import.meta.glob<Record<string, unknown>>("./*.ts", { eager: true });

function isExcerpt(value: unknown): value is Excerpt {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    "path" in value &&
    "repo" in value
  );
}

const excerpts = Object.entries(modules)
  .filter(([file]) => !file.endsWith(".test.ts") && !file.endsWith("types.ts"))
  .flatMap(([file, mod]) =>
    Object.entries(mod)
      .filter(([, value]) => isExcerpt(value))
      .map(([name, value]) => ({ id: `${file}#${name}`, excerpt: value as Excerpt })),
  );

describe("excerpt modules", () => {
  it("are found", () => {
    expect(excerpts.length).toBeGreaterThan(0);
  });
});

describeSourceRepos("code excerpts match their sources", () => {
  for (const { id, excerpt } of excerpts) {
    it(`${id} (${excerpt.repo}/${excerpt.path}@${excerpt.commit}:${excerpt.start}-${excerpt.end})`, () => {
      const lines = readAtCommit(excerpt.repo, excerpt.commit, excerpt.path)
        .split("\n")
        .slice(excerpt.start - 1, excerpt.end);
      let cursor = 0;
      for (const shown of excerpt.code.split("\n")) {
        if (isElision(shown) || shown.trim() === "") continue;
        const kept = cutLine(shown);
        const at = lines.findIndex(
          (line, i) =>
            i >= cursor &&
            (kept === null ? line.trim() === shown.trim() : line.trim().startsWith(kept)),
        );
        expect(at, `not found in order: ${shown.trim()}`).toBeGreaterThanOrEqual(0);
        cursor = at + 1;
      }
    });
  }
});
