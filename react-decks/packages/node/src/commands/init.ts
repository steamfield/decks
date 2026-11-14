import { defineCommand } from "citty";
import { DeckError } from "../errors";

export const init = defineCommand({
  meta: { name: "decks init", description: "Set up agent guidance for Decks in this project" },
  args: {},
  run() {
    throw new DeckError("decks init is not implemented yet.");
  },
});
