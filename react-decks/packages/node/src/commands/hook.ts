import { defineCommand } from "citty";
import { DeckError } from "../errors";

export const hook = defineCommand({
  meta: {
    name: "decks hook",
    description: "Agent hooks: lint (PreToolUse) or prompt (UserPromptSubmit)",
  },
  args: {
    kind: { type: "positional", required: true, description: "lint or prompt" },
  },
  run() {
    throw new DeckError("decks hook is not implemented yet.");
  },
});
