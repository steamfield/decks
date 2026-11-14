import { useDeck, useSlide } from "@react-decks/runtime";

export default function Above() {
  const { no } = useSlide();
  const { total } = useDeck();
  return (
    <footer className="gallery-progress">
      <span>Motion / field notes</span>
      <output aria-label="Slide number">
        {no} / {total}
      </output>
      <div
        role="progressbar"
        aria-label="Deck progress"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={no}
        style={{ width: `${(100 * no) / total}%` }}
      />
    </footer>
  );
}
