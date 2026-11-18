import { defineCommand } from "citty";

export const inspect = defineCommand({
  meta: {
    name: "decks inspect",
    description: "Report content that overflows the canvas or its own box",
  },
  args: { deck: { type: "positional", required: true, description: "Deck alias or directory" } },
  run() {
    throw new Error("decks inspect is not implemented");
  },
});
