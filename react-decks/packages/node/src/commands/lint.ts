import { defineCommand } from "citty";
import { DeckError } from "../errors";

export const lint = defineCommand({
  meta: { name: "decks lint", description: "Lint deck prose for AI rhetoric" },
  args: {
    decks: {
      type: "positional",
      required: false,
      description: "Deck aliases (default: every registered deck)",
    },
    stdin: { type: "boolean", default: false, description: "Lint MDX read from stdin" },
  },
  run() {
    throw new DeckError("decks lint is not implemented yet.");
  },
});

export interface LintResult {
  errors: number;
  warnings: number;
}

export async function lintDecks(
  _decks: { alias: string; dir: string }[],
  _options: { errorsOnly: boolean },
): Promise<LintResult> {
  throw new DeckError("decks lint is not implemented yet.");
}
