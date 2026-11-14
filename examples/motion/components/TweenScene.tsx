import { duration, useTimeline, useTween } from "@steamfield/decks/motion";

export function TweenScene() {
  const value = useTween({ radius: 48 });
  useTimeline(
    (tl, beat) => {
      beat(0);
      tl.to(value, { radius: 180, duration: duration.slow });
      beat(1);
    },
    [value],
  );
  return (
    <svg
      className="scene"
      viewBox="0 0 1500 520"
      role="img"
      aria-label="A circle grows from radius 48 to 180"
    >
      <circle className="orbit" cx="750" cy="260" r="210" />
      <circle cx="750" cy="260" r={value.radius} fill="var(--gallery-accent)" />
      <text x="1080" y="270">
        r = {value.radius.toFixed(1)}
      </text>
    </svg>
  );
}
