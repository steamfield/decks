import { duration, ease, SplitText, stagger, useTimeline } from "@steamfield/decks/motion";
import { useRef } from "react";
import "./KineticType.css";

export function KineticType() {
  const heading = useRef<HTMLHeadingElement>(null);
  useTimeline((tl, beat) => {
    beat(0);
    if (!heading.current) return;
    const split = SplitText.create(heading.current, { type: "words", mask: "words", tag: "span" });
    tl.fromTo(
      split.words,
      { yPercent: 110 },
      {
        yPercent: 0,
        duration: duration.base,
        ease: ease.enter,
        stagger,
      },
    );
    beat(1);
    tl.to(split.words.slice(-1), {
      "--emphasis": "100%",
      duration: duration.base,
      ease: ease.enter,
    });
    beat(2);
    return () => split.revert();
  });
  return (
    <h2 className="kinetic-type" ref={heading}>
      Give the last word weight.
    </h2>
  );
}
