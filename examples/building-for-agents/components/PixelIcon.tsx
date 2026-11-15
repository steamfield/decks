import type { SVGProps } from "react";
import { type ProductId, product } from "../data/products";
import styles from "./PixelIcon.module.css";

/** A product's 12×12 icon; the palette classes follow the deck theme. */
export function PixelIcon({
  id,
  ...props
}: Omit<SVGProps<SVGSVGElement>, "id"> & { id: ProductId }) {
  const pixels = product(id).icon.flatMap((row, y) =>
    Array.from(row).flatMap((ch, x) => (ch === "." ? [] : [{ x, y, ch }])),
  );
  return (
    <svg viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true" {...props}>
      {pixels.map((p) => (
        <rect
          key={`${p.x}-${p.y}`}
          className={`sf-px-${p.ch} ${styles[`sf-px-${p.ch}`]}`}
          x={p.x}
          y={p.y}
          width="1"
          height="1"
        />
      ))}
    </svg>
  );
}
