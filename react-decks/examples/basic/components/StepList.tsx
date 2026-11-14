import { useSlide } from "@steamfield/decks";

const POINTS = ["First point", "Second point", "Third point"];

/** Reveals one list item per click, the way a stage paces itself from `clicks`. */
export function StepList() {
  const { clicks } = useSlide();
  return (
    <ol>
      {POINTS.slice(0, clicks).map((point) => (
        <li key={point}>{point}</li>
      ))}
    </ol>
  );
}
