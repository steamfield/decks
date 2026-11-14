import {
  DRAW,
  DUR,
  InkPing,
  SETTLE,
  StoryCard,
  StoryLink,
  StoryStage,
  UnitGrid,
  type UnitGridItem,
  unitCellCenter,
  useStage,
} from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import { useId, useState } from "react";
import {
  accountabilitySource,
  campusDisplay,
  campusLabels,
  triggeringCampuses,
  waffleCampuses,
  waffleUniverse,
} from "../data/05-two-campuses";
import { CampusHoverCard } from "./CampusHoverCard";
import { DIM, neutral, OFF, ON, risk } from "./design";
import styles from "./TwoCampusesStage.module.css";

const pairIds = new Set<string>(triggeringCampuses.map((campus) => campus.campusNumber));
const campuses = [...waffleCampuses].sort(
  (a, b) => Number(pairIds.has(b.campusNumber)) - Number(pairIds.has(a.campusNumber)),
);
const items: UnitGridItem[] = campuses.map((campus) => ({ id: campus.campusNumber }));
const GRID = {
  origin: { x: 132, y: 310 },
  cols: 17,
  cellWidth: 56,
  cellHeight: 56,
  gapX: 44,
  gapY: 14,
};
const width = GRID.cols * (GRID.cellWidth + GRID.gapX) - GRID.gapX;
const pairWidth = GRID.cellWidth * triggeringCampuses.length + GRID.gapX;
const cell = (i: number) => unitCellCenter(i, GRID);
const chipX = (i: number) => 200 + i * 240;
const COPY = [
  {
    lead: `${waffleUniverse.visible} open campuses have a rating.`,
    body: "The count excludes closed campuses and programs without a letter grade.",
  },
  {
    lead: "The appeals could prevent board replacement.",
    body: "Their final ratings and counted years remain pending.",
  },
  {
    lead: "The elected board could be replaced.",
    body: "Parents at both schools petitioned to close them instead.",
  },
];
const colorBy = (item: UnitGridItem) => (pairIds.has(String(item.id)) ? "transparent" : neutral());
const targetStyle = (i: number) => ({
  left: `${(cell(i).x - GRID.cellWidth / 2) / 19.2}%`,
  top: `${(cell(i).y - GRID.cellHeight / 2) / 10.8}%`,
  width: `${GRID.cellWidth / 19.2}%`,
  height: `${GRID.cellHeight / 10.8}%`,
});

export function TwoCampusesStage() {
  const s = useTween({ reveal: OFF, pair: OFF, ping: OFF, board: OFF, dim: ON });
  const { clicks, copy, beats, isActive } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { reveal: ON, duration: DUR.scale, ease: SETTLE });
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { pair: ON, duration: DUR.color, ease: SETTLE });
      tl.to(s, { ping: ON, duration: DUR.scale, ease: DRAW }, "<");
      beat(1);
      tl.to(s, { board: ON, dim: DIM, duration: DUR.grow, ease: DRAW });
      beat(2);
    },
  });
  const pairColor = `color-mix(in oklab, ${risk()} ${s.pair * 100}%, ${neutral()})`;
  const [selection, setSelection] = useState<{
    hovered: string | null;
    focused: string | null;
    click: number;
    active: boolean;
  }>({ hovered: null, focused: null, click: clicks, active: isActive });
  const changed = selection.click !== clicks || selection.active !== isActive;
  if (changed) setSelection({ hovered: null, focused: null, click: clicks, active: isActive });
  const selectedId = changed ? null : (selection.hovered ?? selection.focused);
  const selected = campuses.find((campus) => campus.campusNumber === selectedId);
  const tooltipId = useId();
  const dismiss = () =>
    setSelection({ hovered: null, focused: null, click: clicks, active: isActive });
  return (
    <StoryStage
      beats={beats}
      click={clicks}
      className={styles.stage}
      stage={
        <>
          <g style={{ opacity: s.dim }}>
            <UnitGrid
              {...GRID}
              items={items}
              glyph="square"
              color={neutral()}
              colorBy={colorBy}
              recolor={ON}
              reveal={s.reveal}
              seed="tx-campus-waffle"
              filterId="none"
            />
          </g>
          {triggeringCampuses.map((campus, i) => (
            <InkPing
              key={campus.campusNumber}
              x={cell(i).x - GRID.cellWidth / 2}
              y={cell(i).y - GRID.cellHeight / 2}
              width={GRID.cellWidth}
              height={GRID.cellHeight}
              hue="amber"
              progress={s.ping}
            />
          ))}
          <g style={{ opacity: s.board }}>
            <path
              d={`M ${GRID.origin.x} 732 v 20 h ${width * s.board} v -20`}
              className={styles.bracket}
            />
            <text
              x={GRID.origin.x + width / 2}
              y="794"
              textAnchor="middle"
              className="od-stage-name"
              style={{ fill: risk() }}
            >
              {campusLabels.board}
            </text>
          </g>
          <g style={{ opacity: s.pair }}>
            {triggeringCampuses.map((campus, i) => (
              <path
                key={campus.campusNumber}
                d={`M ${chipX(i)} 288 L ${cell(i).x} ${GRID.origin.y}`}
                className={styles.bracket}
              />
            ))}
          </g>
        </>
      }
      overlay={
        <>
          <h2 className="od-story-head">
            {campusDisplay.countWord} schools could cost {campusDisplay.city} its elected board.
          </h2>
          <div
            className={`vt-campus-pair ${styles.pair}`}
            style={{ opacity: s.reveal, color: pairColor }}
          >
            <svg viewBox={`0 0 ${pairWidth} ${GRID.cellHeight}`} aria-hidden="true">
              {triggeringCampuses.map((campus, i) => (
                <rect
                  key={campus.campusNumber}
                  x={i * (GRID.cellWidth + GRID.gapX)}
                  width={GRID.cellWidth}
                  height={GRID.cellHeight}
                />
              ))}
            </svg>
          </div>
          {triggeringCampuses.map((campus, i) => (
            <div
              key={campus.campusNumber}
              className={styles.chip}
              style={{ opacity: s.pair, left: `${chipX(i) / 19.2}%` }}
            >
              <div>{campus.name.replace(" Middle School", "")}</div>
              <span className="tx-tag is-pending">{campusDisplay.appeal}</span>
            </div>
          ))}
          <div className={styles.targets}>
            {campuses.map((campus, i) => (
              <button
                key={campus.campusNumber}
                type="button"
                className={styles.target}
                style={targetStyle(i)}
                aria-label={campus.campus}
                aria-describedby={selectedId === campus.campusNumber ? tooltipId : undefined}
                onPointerEnter={() =>
                  setSelection((current) => ({ ...current, hovered: campus.campusNumber }))
                }
                onPointerLeave={() => setSelection((current) => ({ ...current, hovered: null }))}
                onFocus={() =>
                  setSelection((current) => ({ ...current, focused: campus.campusNumber }))
                }
                onBlur={() => setSelection((current) => ({ ...current, focused: null }))}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelection((current) => ({ ...current, focused: campus.campusNumber }));
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.stopPropagation();
                    event.preventDefault();
                    dismiss();
                  }
                  if (["Enter", " "].includes(event.key)) event.stopPropagation();
                }}
              />
            ))}
          </div>
          {selected && <CampusHoverCard id={tooltipId} campus={selected} />}
          <StoryLink href={accountabilitySource} label={campusDisplay.source} />
        </>
      }
      card={
        <div style={{ display: selected ? "none" : undefined }}>
          <StoryCard anchor="left" hue="amber" lead={copy.lead} body={copy.body} />
        </div>
      }
    />
  );
}
