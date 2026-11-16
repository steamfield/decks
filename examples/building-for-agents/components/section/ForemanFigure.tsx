import { clamp01 } from "@steamfield/decks/kit";
import { DIM } from "../design";
import { Cells } from "./Cells";

const LANES = [5, 13, 21];
const COLORS = ["v", "c", "p"];
const CHEVRON = ["##...", ".##..", "..##.", "...##", "..##.", ".##..", "##..."];
const BLOCK = ["#####", "#...#", "#...#", "#...#", "#####"];

export function ForemanFigure({ t }: { t: number }) {
  const draw = clamp01(t / 0.25);
  const split = clamp01((t - 0.25) / 0.25);
  const travel = clamp01((t - 0.5) / 0.5);
  return (
    <g>
      {LANES.map((y, i) => {
        const color = COLORS[i] ?? "p";
        const x0 = 2 + i * 3;
        const x = Math.round(x0 + (25 - x0) * travel);
        const cy = Math.round(13 + (y - 13) * split);
        return (
          <g key={y}>
            <g opacity={draw}>
              <Cells x={3} y={y} rows={["v".repeat(Math.round(28 * draw))]} />
              <g opacity={travel === 1 ? 1 : DIM}>
                <Cells x={31} y={y - 2} rows={BLOCK.map((row) => row.replaceAll("#", color))} />
              </g>
            </g>
            <Cells x={x} y={cy - 3} rows={CHEVRON.map((row) => row.replaceAll("#", color))} />
          </g>
        );
      })}
    </g>
  );
}
