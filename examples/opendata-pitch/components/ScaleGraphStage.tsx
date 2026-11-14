import {
  CANVAS,
  clamp01,
  DRAW,
  DUR,
  Graph3D,
  InkCardRect,
  ink,
  lerp,
  StoryCard,
  StoryLayer,
  StoryLink,
  StoryStage,
  TRACE,
  UnitGrid,
  type UnitGridItem,
  useStage,
  useStageMap,
} from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import {
  JULY_EDGES,
  JULY_NODES,
  TOTAL_AGENCIES,
  TOTAL_DATASETS,
  TOTAL_ROWS,
} from "../data/catalog-totals";
import { categoryCounts, graphEdges, graphNodes } from "../data/graph-data";
import { colorForCategory } from "../data/graph-palette";
import { GRAPH_ZOOM } from "../data/graph-view";
import { DATASET_CARD_BOX, DATASET_META, DATASET_NAME } from "../data/isbe-files";
import styles from "./ScaleGraphStage.module.css";

const NODE_COUNT = graphNodes.length;
const EDGE_COUNT = graphEdges.length;
const COLS = 56;
const CELL = 15;
const GAP = 7;
const PITCH = CELL + GAP;
const FIELD_WIDTH = COLS * PITCH - GAP;
const ORIGIN = { x: Math.round((1920 - FIELD_WIDTH) / 2), y: 300 };
const fmt = (n: number) => n.toLocaleString("en-US");
const BASE_INK = ink("slate", 2);
const CELL_FILL = `color-mix(in srgb, ${BASE_INK} 92%, ${CANVAS})`;
const cells = [...graphNodes]
  .sort(
    (a, b) =>
      (categoryCounts[b.category] ?? 0) - (categoryCounts[a.category] ?? 0) ||
      a.category.localeCompare(b.category) ||
      a.id.localeCompare(b.id),
  )
  .map((node) => ({ id: node.id, category: node.category }));
const TOP_FOUR = Object.entries(categoryCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 4)
  .map(([category]) => category);
const CATEGORY_COUNT = Object.keys(categoryCounts).length;
const TOP_FOUR_TOTAL = TOP_FOUR.reduce((n, category) => n + (categoryCounts[category] ?? 0), 0);
const REST_COUNT = CATEGORY_COUNT - TOP_FOUR.length;
const REST_TOTAL = NODE_COUNT - TOP_FOUR_TOTAL;
const LABEL_X = ORIGIN.x + FIELD_WIDTH + 26;
const labelY = (first: number, count: number) =>
  ORIGIN.y + Math.floor((first + count / 2) / COLS) * PITCH + CELL / 2 + 10;
const clusterLabels = [
  ...TOP_FOUR.map((category) => ({
    category,
    text: `${category} ${categoryCounts[category] ?? 0}`,
    color: colorForCategory(category),
    x: LABEL_X,
    y: labelY(
      cells.findIndex((cell) => cell.category === category),
      categoryCounts[category] ?? 0,
    ),
  })),
  {
    category: "rest",
    text: `${REST_COUNT} others ${fmt(REST_TOTAL)}`,
    color: ink("slate", 3),
    x: LABEL_X,
    y: labelY(TOP_FOUR_TOTAL, REST_TOTAL),
  },
];
const BARS = {
  x: 1270,
  width: 300,
  height: 22,
  gap: 14,
  rows: [
    { key: "datasets", y: 400, july: JULY_NODES, now: NODE_COUNT },
    { key: "relationships", y: 560, july: JULY_EDGES, now: EDGE_COUNT },
  ],
};
const BARS_CARD = { x: 1230, y: 340, width: 610, height: 320 };
const NOW_INK = ink("cyan", 3);
const JULY_INK = ink("slate", 2);
const COPY = [
  {
    lead: `${TOTAL_DATASETS} datasets. ${TOTAL_AGENCIES} agencies. ${TOTAL_ROWS} rows.`,
    body: "Every square is one dataset OpenData agents cleaned and published.",
  },
  {
    lead: `${CATEGORY_COUNT} categories, four of them most of the catalog.`,
    body: `Education, government, health and economics are ${fmt(TOP_FOUR_TOTAL)} of the ${fmt(NODE_COUNT)}.`,
  },
  {
    lead: `${NODE_COUNT} datasets. ${fmt(EDGE_COUNT)} relationships.`,
    body: `${NODE_COUNT} of the ${TOTAL_DATASETS} are ready and linked. The graph is how an agent sees the connections.`,
  },
  {
    lead: "Seven weeks, and the graph grew by half.",
    body: `${fmt(JULY_NODES)} datasets and ${fmt(JULY_EDGES)} links in July; ${fmt(NODE_COUNT)} and ${fmt(EDGE_COUNT)} today.`,
  },
];
const pct = (n: number) => `${Math.round(clamp01(n) * 100)}%`;
const colorByCategory = (cell: UnitGridItem) =>
  cell.category === undefined ? undefined : colorForCategory(cell.category);

export function ScaleGraphStage() {
  const s = useTween({
    join: 0,
    reveal: 0,
    recolor: 0,
    labels: 0,
    field: 1,
    scatter: 0,
    graph: 0,
    graphDim: 1,
    bars: 0,
  });
  const { clicks, playCount, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { join: 1, duration: DUR.scale, ease: DRAW }, `+=${DUR.opacity}`);
      tl.to(s, { reveal: 1, duration: DUR.bloom, ease: DRAW }, `-=${DUR.card}`);
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { recolor: 1, duration: DUR.color });
      tl.to(s, { labels: 1, duration: DUR.card }, "<");
      beat(1);
      tl.to(s, { labels: 0, duration: DUR.opacity });
      const loosenAt = tl.duration();
      tl.to(s, { scatter: 1, duration: DUR.bloom, ease: TRACE }, loosenAt);
      tl.to(s, { graph: 1, duration: DUR.scale }, loosenAt + DUR.card);
      tl.to(s, { field: 0, duration: DUR.gather }, loosenAt + DUR.grow);
      beat(2);
      tl.to(s, { bars: 1, duration: DUR.grow, ease: DRAW });
      tl.to(s, { graphDim: 0.45, duration: DUR.color }, "<");
      beat(3);
    },
  });
  const { toPctBox } = useStageMap();
  const cellBox = toPctBox(ORIGIN.x, ORIGIN.y, CELL, CELL);

  return (
    <StoryStage
      className={styles.stage}
      beats={beats}
      click={clicks}
      stage={
        <g key={playCount}>
          <g style={{ opacity: s.field }}>
            <UnitGrid
              glyph="square"
              seed="catalog-field"
              items={cells}
              cols={COLS}
              cellWidth={CELL}
              cellHeight={CELL}
              gapX={GAP}
              gapY={GAP}
              origin={ORIGIN}
              color={BASE_INK}
              colorBy={colorByCategory}
              reveal={s.reveal}
              stagger={0.72}
              recolor={s.recolor}
              scatter={s.scatter}
              filterId="none"
            />
            <g style={{ opacity: s.labels }}>
              {clusterLabels.map((label) => (
                <text
                  key={label.category}
                  className="od-stage-label"
                  x={label.x}
                  y={label.y}
                  fill={label.color}
                  textAnchor="start"
                >
                  {label.text}
                </text>
              ))}
            </g>
          </g>
        </g>
      }
      overlay={
        <>
          <div
            className={styles.graph}
            style={{ opacity: s.graph, pointerEvents: s.graph > 0.9 ? "auto" : "none" }}
          >
            {clicks >= 1 && (
              <Graph3D
                nodes={graphNodes}
                edges={graphEdges}
                orbit={clicks >= 2}
                zoom={GRAPH_ZOOM}
                dim={s.graphDim}
              />
            )}
          </div>
          <StoryLayer>
            <g style={{ opacity: Math.min(1, s.bars * 3) }}>
              <InkCardRect
                {...BARS_CARD}
                hue="cyan"
                glowR={0.8}
                glowEdge={0.6}
                stroke="var(--od-border)"
                strokeWidth={1}
              />
              {BARS.rows.map((row) => (
                <g key={row.key}>
                  <text className="od-stage-label" x={BARS.x} y={row.y - 26} textAnchor="start">
                    {row.key}
                  </text>
                  <rect
                    x={BARS.x}
                    y={row.y}
                    width={BARS.width * (row.july / row.now) * s.bars}
                    height={BARS.height}
                    rx={3}
                    fill={JULY_INK}
                  />
                  <text
                    className="od-stage-label is-end"
                    x={BARS.x + BARS.width * (row.july / row.now) * s.bars + 18}
                    y={row.y + BARS.height - 4}
                    textAnchor="start"
                  >
                    {fmt(row.july)} in July
                  </text>
                  <rect
                    x={BARS.x}
                    y={row.y + BARS.height + BARS.gap}
                    width={BARS.width * s.bars}
                    height={BARS.height}
                    rx={3}
                    fill={NOW_INK}
                  />
                  <text
                    className="od-stage-label is-end"
                    x={BARS.x + BARS.width * s.bars + 18}
                    y={row.y + BARS.height * 2 + BARS.gap - 4}
                    textAnchor="start"
                  >
                    {fmt(row.now)} today
                  </text>
                </g>
              ))}
            </g>
          </StoryLayer>
          <StoryLink href="https://tryopendata.ai/graph" opacity={s.graph} />
          <h2 className="od-story-head">Every dataset we clean joins the Dataset Graph.</h2>
          <div
            className="od-dataset-card vt-seed-square"
            style={{
              left: `${lerp(DATASET_CARD_BOX.left, cellBox.left, s.join)}%`,
              top: `${lerp(DATASET_CARD_BOX.top, cellBox.top, s.join)}%`,
              width: `${lerp(DATASET_CARD_BOX.width, cellBox.width, s.join)}%`,
              height: `${lerp(DATASET_CARD_BOX.height, cellBox.height, s.join)}%`,
              borderRadius: `${lerp(12, 3, s.join)}px`,
              padding: `calc(${lerp(1.1, 0, s.join)} * var(--sw)) calc(${lerp(1.5, 0, s.join)} * var(--sw))`,
              gap: `calc(${lerp(0.35, 0, s.join)} * var(--sw))`,
              borderWidth: `${lerp(1, 0, s.join)}px`,
              borderColor: `color-mix(in srgb, var(--od-border) ${pct(1 - s.join)}, transparent)`,
              background: [
                `radial-gradient(ellipse 80% 100% at 0% 0%, color-mix(in srgb, var(--od-emerald) ${pct(0.12 * (1 - s.join))}, transparent) 0%, transparent 60%)`,
                `color-mix(in srgb, ${CELL_FILL} ${pct(s.join)}, var(--od-surface))`,
              ].join(", "),
              opacity: 1 - clamp01((s.reveal - 0.85) / 0.15),
            }}
          >
            <span className="od-dataset-kicker" style={{ opacity: 1 - clamp01(s.join * 2.5) }}>
              dataset
            </span>
            <span className="od-dataset-name" style={{ opacity: 1 - clamp01(s.join * 2.5) }}>
              {DATASET_NAME}
            </span>
            <span className="od-dataset-meta" style={{ opacity: 1 - clamp01(s.join * 2.5) }}>
              {DATASET_META}
            </span>
          </div>
        </>
      }
      card={<StoryCard anchor="left" lead={copy.lead} body={copy.body} />}
    />
  );
}
