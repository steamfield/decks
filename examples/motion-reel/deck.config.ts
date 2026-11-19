import { defineDeck } from "@steamfield/decks/node";

export default defineDeck({
  title: "Motion reel",
  author: "Steamfield",
  transition: "fade",
  // The reel closes on its own logo card, so the per-slide credit would say it twice.
  credit: false,
});
