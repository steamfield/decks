import { useDeck, useSlide } from "@react-decks/runtime";

/** Prints what the hooks report, so tests can read deck state off the page. */
export function SlideStatus() {
  const { slide, total } = useDeck();
  const { no, clicks, clicksTotal, isActive } = useSlide();
  return (
    <p>
      Slide {no} of {total}, click {clicks} of {clicksTotal}
      {isActive && slide === no ? ", active" : ""}
    </p>
  );
}
