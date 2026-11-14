import { duration, useTimeline, useTween } from "@steamfield/decks/motion";

export function TimelineScene() {
  const value = useTween({ x: 0, turn: 0, color: 0 });
  useTimeline(
    (tl, beat) => {
      beat(0);
      tl.to(value, { x: 320, duration: duration.slow });
      beat(1);
      tl.to(value, { x: 640, color: 1, duration: duration.slow });
      beat(2);
      tl.to(value, { x: 960, turn: 90, color: 2, duration: duration.slow });
      beat(3);
    },
    [value],
  );
  return (
    <svg
      className="scene"
      viewBox="0 0 1500 520"
      role="img"
      aria-label="Three beats move and recolor two shapes"
    >
      <path className="track" d="M 140 260 H 1360" />
      <g transform={`translate(${140 + value.x} 260)`}>
        <rect
          x="-70"
          y="-70"
          width="140"
          height="140"
          rx="24"
          transform={`rotate(${value.turn})`}
          fill={`color-mix(in srgb, var(--gallery-accent) ${100 - value.color * 40}%, var(--gallery-warm))`}
        />
        <circle cx="120" cy="100" r="30" fill="var(--gallery-ink)" />
      </g>
      <text x="140" y="470">
        START
      </text>
      <text x="460" y="470">
        MOVE
      </text>
      <text x="780" y="470">
        RECOLOR
      </text>
      <text x="1100" y="470">
        TURN
      </text>
    </svg>
  );
}
