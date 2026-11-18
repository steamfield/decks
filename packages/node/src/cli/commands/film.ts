import { defineCommand } from "citty";

export const film = defineCommand({
  meta: { name: "decks film", description: "Capture the motion of one click as a contact sheet" },
  args: { deck: { type: "positional", required: true, description: "Deck alias or directory" } },
  run() {
    throw new Error("decks film is not implemented");
  },
});
