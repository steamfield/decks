import { defineCommand } from "citty";
import { DeckError } from "../errors";

export const check = defineCommand({
  meta: {
    name: "decks check",
    description: "Check the deck registry, configs, slide names and error-level prose",
  },
  args: {},
  run() {
    throw new DeckError("decks check is not implemented yet.");
  },
});
