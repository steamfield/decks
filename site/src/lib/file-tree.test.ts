import { describe, expect, it } from "vitest";
import { treeLines } from "./file-tree";

describe("file tree", () => {
  it("nests paths, directories first, and folds single-child directories", () => {
    const lines = treeLines([
      "AGENTS.md",
      ".claude/agents/deck-author.md",
      ".claude/skills/building-a-deck/SKILL.md",
      ".claude/skills/fact-checking-a-deck/SKILL.md",
      ".claude/settings.json",
      "decks/my-talk/slides.md",
      "decks/my-talk/pages/01-cover.md",
    ]);
    expect(lines.map((line) => `${"  ".repeat(line.depth)}${line.label}`)).toEqual([
      ".claude/",
      "  skills/",
      "    building-a-deck/SKILL.md",
      "    fact-checking-a-deck/SKILL.md",
      "  agents/deck-author.md",
      "  settings.json",
      "decks/my-talk/",
      "  pages/01-cover.md",
      "  slides.md",
      "AGENTS.md",
    ]);
    expect(lines.find((line) => line.label === "settings.json")?.path).toBe(
      ".claude/settings.json",
    );
    expect(lines.find((line) => line.label === "decks/my-talk/")?.path).toBeNull();
  });
});
