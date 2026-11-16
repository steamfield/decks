import { clamp01 } from "@steamfield/decks/kit";
import { Cells } from "./Cells";

/**
 * The Stacks mark at twice the rail icon's resolution: 24 by 28 half-cells, where its 2:1
 * edges land on whole pixels. Geometry is stacks-mark.svg's (see data/products.ts), moved to
 * the origin: a 24 by 12 lid, then three slabs 4 tall and 6 apart, each face falling 1 in 2.
 */
const W = 24;
const H = 28;
const grid = (cell: (x: number, y: number) => string) =>
  Array.from({ length: H }, (_, r) =>
    Array.from({ length: W }, (_, c) => cell(c + 0.5, r + 0.5)).join(""),
  );
const lid = grid((x, y) => (Math.abs(x - 12) / 12 + Math.abs(y - 6) / 6 <= 1 ? "t" : "."));
const slab = (top: number) =>
  grid((x, y) => {
    const edge = top + (x < 12 ? x : W - x) / 2;
    return y >= edge && y < edge + 4 ? (x < 12 ? "l" : "r") : ".";
  });
/** Bottom slab first, lid last: the order they drop in. */
const LAYERS = [slab(18), slab(12), slab(6), lid];
const GATE = ["ccccccc", "c.....c", "c.....c", "c.....c", "c.....c", "c.....c", "ccccccc"];
const TICK = [
  [0, 1],
  [1, 2],
  [2, 1],
  [3, 0],
];

export function StacksFigure({ t }: { t: number }) {
  const wire = Math.round(12 * clamp01((t - 0.6) / 0.22));
  const passed = clamp01((t - 0.82) / 0.18);
  return (
    <g>
      <g transform="scale(0.5)">
        {LAYERS.map((rows, i) => {
          const drop = clamp01((t - i * 0.15) / 0.15);
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: the four layers are fixed.
            <g key={i} opacity={drop > 0 ? 1 : 0}>
              <Cells x={6} y={14 - Math.round((1 - drop) * 18)} rows={rows} />
            </g>
          );
        })}
      </g>
      <Cells x={15} y={17} rows={["c".repeat(wire)]} />
      <g opacity={wire === 12 ? 1 : 0}>
        <Cells x={27} y={14} rows={GATE} />
        <g opacity={passed} fill="var(--od-phosphor)">
          {TICK.map(([x = 0, y = 0]) => (
            <rect key={x} x={29 + x} y={16 + y} width="1" height="1" />
          ))}
        </g>
      </g>
    </g>
  );
}
