import { clamp01, stagger } from "@steamfield/decks/kit";
import { SECTION_HISTORY } from "../../data/sections";
import { DIM } from "../design";
import styles from "../PixelIcon.module.css";
import { Cells } from "./Cells";

const RING = [
  "...cccc...",
  "..c....c..",
  ".c......c.",
  "c........c",
  "c........c",
  "c........c",
  "c........c",
  ".c......c.",
  "..c....c..",
  "...cccc...",
];
const HANDLE = ["y...", "yy..", ".yy.", "..yy", "...y"];
const BASE = 18;
const LENS_Y = 8;

export function GlassFigure({ t }: { t: number }) {
  const history = clamp01(t / 0.45);
  const scan = clamp01((t - 0.45) / 0.55);
  const lensX = Math.round(-11 + 34 * scan);
  return (
    <g>
      {SECTION_HISTORY.map((height, i) => {
        const x = 2 + i * 2;
        const grown = Math.round(height * stagger(history, i, SECTION_HISTORY.length, 0.05));
        return (
          <g key={x}>
            {Array.from({ length: grown }, (_, j) => {
              const y = BASE - j - 1;
              const ringRow = RING[y - LENS_Y] ?? "";
              const left = ringRow.indexOf("c");
              const right = ringRow.lastIndexOf("c");
              const inside = scan > 0 && left >= 0 && x > lensX + left && x < lensX + right;
              return (
                <rect
                  key={y}
                  x={x}
                  y={y}
                  width="1"
                  height="1"
                  className={
                    inside ? `sf-px-p ${styles["sf-px-p"]}` : `sf-px-c ${styles["sf-px-c"]}`
                  }
                  opacity={inside ? 1 : DIM}
                />
              );
            })}
          </g>
        );
      })}
      <g opacity={scan > 0 ? 1 : 0}>
        <Cells x={lensX} y={LENS_Y} rows={RING} />
        <Cells x={lensX + 8} y={LENS_Y + 9} rows={HANDLE} />
      </g>
    </g>
  );
}
