import {
  CodeInk,
  DRAW,
  DUR,
  ink,
  STAGE,
  StoryCard,
  StoryLink,
  StoryStage,
  UnitGrid,
  type UnitGridHandle,
  useStage,
  useStageMap,
} from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import { useCallback, useState } from "react";
import { DISTINCT_POSITIONS } from "../data/isbe-column-drift";
import {
  DATASET_CARD_BOX,
  DATASET_NAME,
  DATASET_URL,
  datasetMeta,
  FILE_COUNT,
  FILE_SHEETS,
  FILE_YEARS,
  RAW_FIELD_COUNT,
  RAW_LABEL,
  RAW_ROWS,
  RECONCILED_SQL,
  RECONCILED_SQL_URL,
  SQL_LABEL,
} from "../data/isbe-files";

const GRID = {
  origin: { x: 136, y: 272 },
  cols: 15,
  cellWidth: 80,
  cellHeight: 106,
  gapX: 32,
  gapY: 56,
};
const CODE_COL = { x: 872, y: 658, width: 918, height: 292 };
const SQL_COL = { x: CODE_COL.x, y: 277, width: CODE_COL.width, height: 224 };
const CARD_HEIGHT = `calc(${(CODE_COL.height / STAGE.height) * 100} * var(--sh))`;
const SHEET_INK = ink("slate", 2);
const RAW_LABEL_INK = ink("amber", 3);
const yearLabels = [0, Math.floor(FILE_COUNT / 2), FILE_COUNT - 1].map((i) => ({
  year: FILE_YEARS[i],
  x: GRID.origin.x + (i % GRID.cols) * (GRID.cellWidth + GRID.gapX) + GRID.cellWidth / 2,
  y:
    GRID.origin.y +
    Math.floor(i / GRID.cols) * (GRID.cellHeight + GRID.gapY) +
    GRID.cellHeight +
    34,
}));
const COPY = [
  {
    lead: "Twenty-nine files. No headers. No changelog.",
    body: `About ${RAW_FIELD_COUNT.toLocaleString("en-US")} unnamed fields per row, and the salary field alone has sat in ${DISTINCT_POSITIONS} different columns.`,
  },
  {
    lead: "We reconcile it once. One dataset, one query.",
    body: "Every file mapped onto one schema and published as a single dataset.",
  },
];
const pct = (n: number) => `${Math.round(n * 100)}%`;

export function FilesToRowStage() {
  const s = useTween({ reveal: 0, dim: 0, raw: 0, collapse: 0, frame: 0, land: 0, sql: 0 });
  const [arrived, setArrived] = useState(0);
  // UnitGrid publishes landings through its handle; keep the counter in sync after commit.
  const grid = useCallback((handle: UnitGridHandle | null) => {
    if (handle) setArrived(handle.arrived);
  }, []);
  const { toStageCenter, toStageSize } = useStageMap();
  const { clicks, playCount, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { reveal: 1, duration: DUR.scale, ease: DRAW });
      tl.to(s, { dim: 1, duration: DUR.color }, `+=${DUR.card}`);
      tl.to(s, { raw: 1, duration: DUR.grow, ease: DRAW }, "<");
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { raw: 0, duration: DUR.opacity });
      const gatherAt = tl.duration();
      tl.to(s, { frame: 1, duration: DUR.card }, gatherAt);
      tl.to(s, { dim: 0, duration: DUR.color }, gatherAt);
      tl.to(s, { collapse: 1, duration: DUR.gather, ease: "none" }, gatherAt);
      const landAt = gatherAt + DUR.gather;
      tl.to(s, { land: 1, duration: DUR.opacity }, landAt - DUR.opacity);
      tl.to(s, { land: 0, duration: DUR.color }, landAt);
      tl.to(s, { sql: 1, duration: DUR.grow, ease: DRAW }, landAt);
      beat(1);
    },
  });
  const filesIn = s.collapse >= 1 ? FILE_COUNT : Math.min(FILE_COUNT, arrived);
  const labelOpacity =
    Math.min(1, Math.max(0, (s.reveal - 0.7) / 0.3)) * (1 - 0.82 * s.dim) * (1 - s.collapse);

  return (
    <StoryStage
      beats={beats}
      click={clicks}
      stage={
        <g key={playCount}>
          <g style={{ opacity: 1 - 0.82 * s.dim }}>
            <UnitGrid
              ref={grid}
              glyph="sheet"
              seed="isbe-files"
              items={FILE_SHEETS}
              {...GRID}
              color={SHEET_INK}
              glow
              reveal={s.reveal}
              collapse={s.collapse}
              collapseStagger={0.45}
              collapseTo={toStageCenter(DATASET_CARD_BOX)}
              collapseInto={toStageSize(DATASET_CARD_BOX)}
            />
          </g>
          <g style={{ opacity: labelOpacity }}>
            {yearLabels.map((label) => (
              <text
                key={label.year}
                className="od-stage-label"
                x={label.x}
                y={label.y}
                textAnchor="middle"
              >
                {label.year}
              </text>
            ))}
          </g>
        </g>
      }
      overlay={
        <>
          <h2 className="od-story-head is-wide">Twenty-nine files became one dataset.</h2>
          <StoryLink href="https://labs.tryopendata.ai/what-opendata-is-building" />
          <CodeInk
            lines={RAW_ROWS}
            label={RAW_LABEL}
            hue="slate"
            step={2}
            labelColor={RAW_LABEL_INK}
            surface
            {...CODE_COL}
            fontSize={1.05}
            reveal={s.raw}
            seed="isbe-raw-row"
          />
          <a
            className="od-dataset-card vt-seed-square"
            href={DATASET_URL}
            target="_blank"
            rel="noopener"
            style={{
              left: `${DATASET_CARD_BOX.left}%`,
              top: `${DATASET_CARD_BOX.top}%`,
              width: `${DATASET_CARD_BOX.width}%`,
              height: `${DATASET_CARD_BOX.height}%`,
              opacity: s.frame,
              transform: `scale(${0.98 + 0.02 * s.frame})`,
              borderColor: `color-mix(in srgb, var(--od-emerald) ${pct(0.7 * s.land)}, var(--od-border))`,
              pointerEvents: s.frame > 0.5 ? "auto" : "none",
            }}
          >
            <span className="od-dataset-kicker">dataset</span>
            <span className="od-dataset-name">{DATASET_NAME}</span>
            <span className="od-dataset-meta">{datasetMeta(filesIn)}</span>
          </a>
          <CodeInk
            lines={RECONCILED_SQL}
            label={SQL_LABEL}
            hue="emerald"
            step={2}
            {...SQL_COL}
            fontSize={1.05}
            reveal={s.sql}
            lang="sql"
            href={RECONCILED_SQL_URL}
            seed="isbe-sql"
          />
        </>
      }
      card={
        <StoryCard
          className="is-filled"
          anchor="left"
          lead={copy.lead}
          body={copy.body}
          style={{ height: CARD_HEIGHT }}
        />
      }
    />
  );
}
