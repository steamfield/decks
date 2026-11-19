import { useDeck, useSlide } from "@steamfield/decks";

/**
 * The deck's own position, on every slide: which slide this is and which click it is on. It is
 * the one thing on screen that says the reel is a slide deck being stepped through.
 */
export default function Above() {
  const { no, clicks, clicksTotal } = useSlide();
  const { total } = useDeck();
  return (
    <output className="reel-position" aria-label="Deck position">
      slide {no} / {total} · click {clicks} / {clicksTotal}
    </output>
  );
}
