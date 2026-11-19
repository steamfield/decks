import { defineDeck } from "@steamfield/decks/node";

// One concept per slide. Each slide is the live demo beside a code fence in docs/guide/*.md
// (`demo="guide-demos/<slide>"`); the site checks that the slide contains the fence's code.
export default defineDeck({
  title: "Guide demos",
  author: "Steamfield",
  transition: "fade",
  credit: false,
});
