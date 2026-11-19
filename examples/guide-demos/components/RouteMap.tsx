/** A trail map in its own 1200 by 600 pixel space, for the Camera demo to tour. */
export function RouteMap() {
  return (
    <svg
      width="1200"
      height="600"
      viewBox="0 0 1200 600"
      role="img"
      aria-label="A trail from the trailhead past Ridge camp to the summit"
      style={{ display: "block" }}
    >
      <g fill="none" stroke="var(--od-border)" strokeWidth="2">
        <ellipse cx="960" cy="240" rx="110" ry="60" />
        <ellipse cx="960" cy="240" rx="210" ry="110" />
        <ellipse cx="960" cy="240" rx="320" ry="165" />
        <ellipse cx="960" cy="240" rx="440" ry="225" />
      </g>
      <path
        d="M200 480C320 480 380 400 470 360S560 300 620 300 800 300 860 270 930 245 960 240"
        fill="none"
        stroke="var(--od-cyan)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray="1 18"
      />
      <g fill="var(--od-amber)" stroke="var(--od-canvas)" strokeWidth="4">
        <circle cx="200" cy="480" r="14" />
        <circle cx="620" cy="300" r="14" />
        <circle cx="960" cy="240" r="14" />
      </g>
      <g fill="var(--od-text)" fontSize="30" textAnchor="middle">
        <text x="200" y="535">
          Trailhead
        </text>
        <text x="620" y="355">
          Ridge camp
        </text>
        <text x="960" y="200">
          Summit
        </text>
      </g>
    </svg>
  );
}
