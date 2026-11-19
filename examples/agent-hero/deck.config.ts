import { defineDeck } from "@steamfield/decks/node";

export default defineDeck({
  title: "Four-minute builds",
  author: "Platform team",
  // One deck-wide transition that reads as forward: the landing page's agent session jumps
  // between non-adjacent slides (2 to 7, 4 to 8, 9 to 7), and a jump plays this one.
  transition: "push",
  // The team footer in layers/above.tsx takes the credit's place along the bottom edge.
  credit: false,
});
