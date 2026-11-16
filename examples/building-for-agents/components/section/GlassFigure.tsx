import { clamp01 } from "@steamfield/decks/kit";
import { product } from "../../data/products";
import { SECTION_HEAT } from "../../data/sections";
import { DIM } from "../design";
import { Cells } from "./Cells";

/** The mark's four rows of levels, read back from the icon: one letter per two-pixel cell. */
const MARK = [0, 3, 6, 9].map((row) =>
  (product("statglass").icon[row] ?? "").replace(/(.)\1\.?/g, "$1"),
);
/** History, then the mark as its newest four columns. */
const ROWS = SECTION_HEAT.map((older, i) => older + (MARK[i] ?? ""));
const OLDER = SECTION_HEAT[0]?.length ?? 0;
const COLUMNS = ROWS[0]?.length ?? 0;
const SIZE = 3;
const PITCH = 4;
const block = (ch: string) => Array.from({ length: SIZE }, () => ch.repeat(SIZE));

export function GlassFigure({ t }: { t: number }) {
  const fill = clamp01(t / 0.7);
  const settle = clamp01((t - 0.7) / 0.3);
  return (
    <g>
      {Array.from({ length: COLUMNS }, (_, column) => {
        const shown = fill * COLUMNS > column ? 1 : 0;
        const level = column < OLDER ? 1 - settle * (1 - DIM) : 1;
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: the columns are fixed.
          <g key={column} opacity={shown * level}>
            {ROWS.map((row, i) => (
              <Cells
                key={row}
                x={1 + column * PITCH}
                y={5 + i * PITCH}
                rows={block(row[column] ?? ".")}
              />
            ))}
          </g>
        );
      })}
    </g>
  );
}
