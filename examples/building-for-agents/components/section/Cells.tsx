import styles from "../PixelIcon.module.css";

/** Same palette and one-cell rectangles as PixelIcon; coordinates are whole cells. */
export function Cells({ x, y, rows }: { x: number; y: number; rows: readonly string[] }) {
  const pixels = rows.flatMap((row, y) =>
    Array.from(row).flatMap((ch, x) => (ch === "." ? [] : [{ x, y, ch }])),
  );
  return (
    <g transform={`translate(${x} ${y})`}>
      {pixels.map((p) => (
        <rect
          key={`${p.x}-${p.y}`}
          x={p.x}
          y={p.y}
          width="1"
          height="1"
          className={`sf-px-${p.ch} ${styles[`sf-px-${p.ch}`]}`}
        />
      ))}
    </g>
  );
}
