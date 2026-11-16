import { clamp01 } from "@steamfield/decks/kit";
import { product } from "../../data/products";
import { Cells } from "./Cells";

const MARK = product("rr").icon;
/** The mark's dots in the order the spinner's gap travels: down the left column, up the right. */
const DOTS = ["0", "7", "6", "5", "4", "3", "2", "1"];
const only = (ch: string) => MARK.map((row) => row.replace(/[^.]/g, (c) => (c === ch ? c : ".")));
const HOST_Y = [3, 11, 19];
const HOST = ["cccccccc", "c......c", "c......c", "c......c", "cccccccc"];
const WIRE = 13;

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
            <Cells x={15} y={13} rows={["v".repeat(Math.min(WIRE, drawn))]} />
            {Array.from(
              { length: Math.max(0, drawn - WIRE) },
              (_, i) => 13 + Math.sign(offset) * (i + 1),
            ).map((cy) => (
              <Cells key={cy} x={27} y={cy} rows={["v"]} />
            ))}
            <Cells x={28} y={y} rows={HOST} />
            <g opacity={packet > 0 && packet < 1 ? 1 : 0}>
              <Cells
                x={at < WIRE ? 15 + at : 27}
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
      <g transform="translate(-5 2) scale(2)">
        {DOTS.map((ch, i) => (
          <g key={ch} opacity={draw * DOTS.length > i ? 1 : 0}>
            <Cells x={0} y={0} rows={only(ch)} />
          </g>
        ))}
      </g>
    </g>
  );
}
