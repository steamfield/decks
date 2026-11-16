import { clamp01, stagger } from "@steamfield/decks/kit";
import { SECTION_BARS } from "../../data/sections";
import { Cells } from "./Cells";

const FRAME = [
  "####################",
  "#..................#",
  "#..................#",
  "#..................#",
  "#..................#",
  "#..................#",
  "#..................#",
  "#..................#",
  "#..................#",
  "#..................#",
  "#..................#",
  "#..................#",
  "#..................#",
  "####################",
];
const DOTS = [10, 16, 22];
const RING = [".www.", "w...w", "w...w", "w...w", ".www."];

export function DecksFigure({ t }: { t: number }) {
  const offset = Math.round(5 * clamp01(t / 0.4));
  const back = FRAME.map((row, y) =>
    Array.from(row, (ch, x) =>
      ch === "#" && !(x + offset < 20 && y - offset >= 0) ? "v" : ".",
    ).join(""),
  );
  const chart = clamp01((t - 0.4) / 0.4);
  const beats = clamp01((t - 0.8) / 0.2);
  return (
    <g>
      <Cells x={5 + offset} y={7 - offset} rows={back} />
      <Cells x={5} y={7} rows={FRAME.map((row) => row.replaceAll("#", "c"))} />
      {SECTION_BARS.map((height, i) => {
        const h = Math.round(height * stagger(chart, i, SECTION_BARS.length, 0.2));
        return (
          <Cells
            key={height}
            x={9 + i * 5}
            y={20 - h}
            rows={Array.from({ length: h }, () => "cc")}
          />
        );
      })}
      {DOTS.map((x, i) => (
        <g key={x} opacity={stagger(beats, i, DOTS.length, 0.2)}>
          <Cells x={x} y={23} rows={["p"]} />
          {i === 0 && <Cells x={x - 2} y={21} rows={RING} />}
        </g>
      ))}
    </g>
  );
}
