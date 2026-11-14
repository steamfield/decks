import { ink } from "@react-decks/kit";

export function InkChip({
  x,
  y,
  text,
  progress,
}: {
  x: number;
  y: number;
  text: string;
  progress: number;
}) {
  return (
    <div
      className="od-inkchip"
      style={{
        left: `calc(${x / 19.2}% + 10px)`,
        top: `${y / 10.8}%`,
        opacity: progress,
        transform: `translateY(-50%) translateY(calc(${1 - progress} * var(--od-chip-rise)))`,
        pointerEvents: "none",
        "--od-chip-ink": ink("cyan", 3),
      }}
    >
      {text}
    </div>
  );
}
