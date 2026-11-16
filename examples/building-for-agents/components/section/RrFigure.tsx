import { clamp01 } from "@steamfield/decks/kit";
import { product } from "../../data/products";
import { Cells } from "./Cells";

const MONITOR = product("rr").icon;
const HOST_Y = [3, 11, 19];
const HOST = ["cccccccc", "c......c", "c......c", "c......c", "cccccccc"];
const WIRE = 16;

export function RrFigure({ t }: { t: number }) {
  const draw = clamp01(t / 0.3);
  const packet = clamp01((t - 0.3) / 0.35);
  const fill = clamp01((t - 0.65) / 0.23);
  const passed = clamp01((t - 0.88) / 0.12);
  return (
    <g>
      {HOST_Y.map((y) => {
        const offset = y + 2 - 13;
        const length = WIRE + Math.abs(offset);
        const drawn = Math.round(length * draw);
        const at = Math.round(length * packet);
        return (
          <g key={y}>
            <Cells x={12} y={13} rows={["v".repeat(Math.min(WIRE, drawn))]} />
            {Array.from(
              { length: Math.max(0, drawn - WIRE) },
              (_, i) => 13 + Math.sign(offset) * (i + 1),
            ).map((cy) => (
              <Cells key={cy} x={27} y={cy} rows={["v"]} />
            ))}
            <Cells x={28} y={y} rows={HOST} />
            <g opacity={packet > 0 && packet < 1 ? 1 : 0}>
              <Cells
                x={at < WIRE ? 12 + at : 27}
                y={at < WIRE ? 13 : 13 + Math.sign(offset) * (at - WIRE)}
                rows={["y"]}
              />
            </g>
            <Cells x={29} y={y + 2} rows={["c".repeat(Math.round(6 * fill))]} />
            <rect
              x={29}
              y={y + 2}
              width={Math.round(6 * fill)}
              height="1"
              fill="var(--od-phosphor)"
              opacity={passed}
            />
          </g>
        );
      })}
      <Cells x={1} y={9} rows={MONITOR} />
    </g>
  );
}
