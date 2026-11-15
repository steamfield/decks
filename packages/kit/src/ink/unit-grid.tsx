import { gsap } from "@react-decks/motion";
import { type Ref, useImperativeHandle, useMemo } from "react";
import type { Point } from "../geometry/brush";
import {
  UNIT_GRID_DEFAULTS,
  type UnitGridItem,
  unitCellCenter,
  unitCellHeight,
} from "../geometry/grid";
import { hash, hashRange, hashSigned } from "../geometry/hash";
import { clamp01 } from "../geometry/scales";
import { SETTLE, TRACE } from "../theme/easings";
import { FILTER_IDS, filterUrl } from "../theme/filters";
import { CANVAS, ink } from "../theme/theme";
import { inkStyle } from "./ink-style";

export interface UnitGridHandle {
  /** Cells that have entered the collapse target box. */
  readonly arrived: number;
}

const settle = gsap.parseEase(SETTLE);
const trace = gsap.parseEase(TRACE);
const q = (n: number, step = 100) => Math.round(n * step) / step;
const p = (x: number, y: number) => `${q(x, 10)} ${q(y, 10)}`;

interface CellMark {
  d: string;
  opacity: number;
}
interface Glyph {
  body: string | null;
  marks: CellMark[];
}

function markerSquare(seed: string, w: number, h: number): Glyph {
  const j = Math.min(w, h) * 0.14;
  const jit = (i: number) => (hash(seed, i) - 0.5) * 2 * j;
  const ring = [
    p(jit(1), jit(2)),
    p(w / 2 + jit(3), jit(4) * 0.6),
    p(w + jit(5), jit(6)),
    p(w + jit(7) * 0.6, h / 2 + jit(8)),
    p(w + jit(9), h + jit(10)),
    p(w / 2 + jit(11), h + jit(12) * 0.6),
    p(jit(13), h + jit(14)),
    p(jit(15) * 0.6, h / 2 + jit(16)),
  ];
  return { body: `M${ring.join("L")}Z`, marks: [] };
}

function pageMarks(w: number, h: number, fold: number): CellMark[] {
  const rule = (y: number) => {
    const x0 = w * 0.16;
    const x1 = w * 0.74;
    const t = Math.max(0.6, h * 0.045);
    return `M${p(x0, y)}L${p(x1, y)}L${p(x1, y + t)}L${p(x0, y + t)}Z`;
  };
  return [
    { d: `M${p(w - fold, 0)}L${p(w - fold, fold)}L${p(w, fold)}Z`, opacity: 0.55 },
    { d: rule(h * 0.56), opacity: 0.42 },
    { d: rule(h * 0.73), opacity: 0.42 },
  ];
}

function sheet(seed: string, w: number, h: number, marker: boolean): Glyph {
  const j = marker ? Math.min(w, h) * 0.07 : 0;
  const jit = (i: number) => (hash(seed, i) - 0.5) * 2 * j;
  const fold = Math.min(w, h) * 0.3;
  return {
    body:
      `M${p(jit(1), jit(2))}L${p(w - fold + jit(3), jit(4))}` +
      `L${p(w + jit(5), fold + jit(6))}L${p(w + jit(7), h + jit(8))}` +
      `L${p(jit(9), h + jit(10))}Z`,
    marks: pageMarks(w, h, fold),
  };
}

/** A prop-driven waffle. The stage owns the reveal, recolor and gather timelines. */
export function UnitGrid({
  items,
  count = 0,
  glyph = UNIT_GRID_DEFAULTS.glyph,
  cols = UNIT_GRID_DEFAULTS.cols,
  cellWidth = UNIT_GRID_DEFAULTS.cellWidth,
  cellHeight,
  gapX = UNIT_GRID_DEFAULTS.gapX,
  gapY = UNIT_GRID_DEFAULTS.gapY,
  origin = UNIT_GRID_DEFAULTS.origin,
  color,
  colorBy,
  seed = "unit-grid",
  reveal = 1,
  stagger = 0.6,
  recolor = 0,
  scatter = 0,
  collapse = 0,
  collapseTo = { x: 960, y: 540 },
  collapseStagger = 0,
  collapseInto,
  glow = false,
  filterId = FILTER_IDS.markerLite,
  ref,
}: {
  items?: UnitGridItem[];
  count?: number;
  glyph?: "square" | "sheet";
  cols?: number;
  cellWidth?: number;
  cellHeight?: number;
  gapX?: number;
  gapY?: number;
  origin?: Point;
  color?: string;
  colorBy?: string | ((item: UnitGridItem, index: number) => string | undefined);
  seed?: string;
  reveal?: number;
  stagger?: number;
  recolor?: number;
  scatter?: number;
  collapse?: number;
  collapseTo?: Point;
  collapseStagger?: number;
  collapseInto?: { width: number; height: number };
  glow?: boolean;
  filterId?: string;
  ref?: Ref<UnitGridHandle>;
}) {
  const marker = inkStyle() === "marker";
  const h = unitCellHeight({ glyph, cellWidth, cellHeight });
  const base = color ?? ink("slate", 2);
  const layout = useMemo(() => {
    const source =
      items ?? Array.from({ length: Math.max(0, count) }, (_, i) => ({ id: `${seed}:${i}` }));
    return source.map((item: UnitGridItem, i) => {
      const id = `${seed}:${item.id}`;
      const shape =
        glyph === "sheet"
          ? sheet(id, cellWidth, h, marker)
          : marker
            ? markerSquare(id, cellWidth, h)
            : { body: null, marks: [] };
      const center = unitCellCenter(i, { origin, cols, cellWidth, cellHeight: h, gapX, gapY });
      return {
        item,
        index: i,
        ...shape,
        cx: center.x,
        cy: center.y,
        order:
          (i + hash(`${seed}:order`, i) * Math.max(1, cols)) /
          Math.max(1, source.length - 1 + Math.max(1, cols)),
        gather: hash(`${seed}:gather`, i),
        jx: hashSigned(`${seed}:jx`, i, 70),
        jy: hashSigned(`${seed}:jy`, i, 70),
        fillOpacity: marker ? q(hashRange(`${seed}:alpha`, i, 0.58, 0.96), 1000) : undefined,
      };
    });
  }, [items, count, seed, glyph, cellWidth, h, marker, origin, cols, gapX, gapY]);
  const spread = clamp01(stagger);
  const ramp = Math.max(0.001, 1 - spread);
  const c = clamp01(collapse);
  const mix = clamp01(recolor);
  const wave = clamp01(collapseStagger);
  const waveRamp = Math.max(0.001, 1 - wave);
  const farMax = layout.reduce(
    (max, cell) => Math.max(max, Math.hypot(cell.cx - collapseTo.x, cell.cy - collapseTo.y)),
    1,
  );
  const mid = layout.reduce(
    (acc, cell) => ({ x: acc.x + cell.cx / layout.length, y: acc.y + cell.cy / layout.length }),
    { x: 0, y: 0 },
  );
  const cells = layout.map((cell) => {
    const shown = q(settle(clamp01((clamp01(reveal) - cell.order * spread) / ramp)), 32);
    let trip = c;
    let size = 1 - c;
    let absorbed = 0;
    let bowX = 0;
    let bowY = 0;
    if (wave > 0) {
      const far = Math.hypot(cell.cx - collapseTo.x, cell.cy - collapseTo.y);
      const lead = clamp01(1 - far / farMax + (cell.gather - 0.5) * 0.3);
      const own = clamp01((c - lead * wave) / waveRamp);
      trip = trace(own);
      size = 1 - (1 - 0.4) * trip * trip;
      const dx = collapseTo.x - cell.cx;
      const dy = collapseTo.y - cell.cy;
      if (collapseInto) {
        const edge = Math.min(
          dx === 0 ? 1 : collapseInto.width / 2 / Math.abs(dx),
          dy === 0 ? 1 : collapseInto.height / 2 / Math.abs(dy),
          1,
        );
        absorbed = clamp01(1 - (1 - trip) / Math.max(0.001, edge));
      } else absorbed = clamp01((own - 0.7) / (1 - 0.7));
      const arc = Math.sin(Math.PI * trip) * 0.22 * (cell.gather < 0.5 ? -1 : 1);
      bowX = -dy * arc;
      bowY = dx * arc;
    }
    const cx =
      cell.cx +
      (collapseTo.x - cell.cx) * trip +
      bowX +
      clamp01(scatter) * ((mid.x - cell.cx) * 0.3 + cell.jx);
    const cy =
      cell.cy +
      (collapseTo.y - cell.cy) * trip +
      bowY +
      clamp01(scatter) * ((mid.y - cell.cy) * 0.3 + cell.jy);
    const targetColor = () => {
      if (typeof colorBy === "function") {
        const target = colorBy(cell.item, cell.index);
        if (target) return target;
      } else if (typeof colorBy === "string") return colorBy;
      return cell.item.hue ? ink(cell.item.hue, cell.item.step ?? 2) : base;
    };
    const fill =
      mix <= 0 ? base : `color-mix(in oklab, ${targetColor()} ${q(mix * 100, 10)}%, ${base})`;
    return {
      ...cell,
      absorbed,
      fill,
      opacity: q(shown * (1 - absorbed), 32),
      transform: `translate(${q(cx, 10)} ${q(cy, 10)}) scale(${q((0.62 + 0.38 * shown) * size, 1000)}) translate(${-cellWidth / 2} ${-h / 2})`,
    };
  });
  const arrived = cells.filter((cell) => cell.absorbed > 0).length;
  useImperativeHandle(ref, () => ({ arrived }), [arrived]);
  const filter = marker
    ? filterId === "none"
      ? undefined
      : filterUrl(filterId)
    : glow
      ? filterUrl(FILTER_IDS.glow)
      : undefined;
  return (
    <g className="od-unit-grid">
      {cells.map((cell) => (
        <g key={cell.item.id} style={{ opacity: cell.opacity }} transform={cell.transform}>
          <g filter={filter}>
            {cell.body === null ? (
              <rect
                className="od-unit-grid-body"
                style={{ fillOpacity: cell.fillOpacity }}
                width={cellWidth}
                height={h}
                rx={Math.min(cellWidth, h) * 0.18}
                fill={cell.fill}
              />
            ) : (
              <path
                className="od-unit-grid-body"
                style={{ fillOpacity: cell.fillOpacity }}
                d={cell.body}
                fill={cell.fill}
              />
            )}
            {cell.marks.map((mark) => (
              <path key={mark.d} style={{ fillOpacity: mark.opacity }} d={mark.d} fill={CANVAS} />
            ))}
          </g>
        </g>
      ))}
    </g>
  );
}
