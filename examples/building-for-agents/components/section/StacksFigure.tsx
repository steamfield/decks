import { clamp01 } from "@steamfield/decks/kit";
import { product } from "../../data/products";
import { Cells } from "./Cells";

const ICON = product("stacks").icon;
const LAYERS = [9, 6, 3, 0].map((row, i) => ({ row, y: 18 - i * 3 }));
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
      {LAYERS.map((layer, i) => {
        const drop = clamp01((t - i * 0.15) / 0.15);
        return (
          <g key={layer.row} opacity={drop > 0 ? 1 : 0}>
            <Cells
              x={3}
              y={layer.y - Math.round((1 - drop) * 9)}
              rows={ICON.slice(layer.row, layer.row + 2)}
            />
          </g>
        );
      })}
      <Cells x={15} y={18} rows={["v".repeat(wire)]} />
      <g opacity={wire === 12 ? 1 : 0}>
        <Cells x={27} y={15} rows={GATE} />
        <g opacity={passed} fill="var(--od-phosphor)">
          {TICK.map(([x = 0, y = 0]) => (
            <rect key={x} x={29 + x} y={17 + y} width="1" height="1" />
          ))}
        </g>
      </g>
    </g>
  );
}
