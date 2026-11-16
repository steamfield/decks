import { DUR, SETTLE, StoryCard, StoryStage, useStage } from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import { useId } from "react";
import {
  CHART_START,
  CHART_WINDOW,
  COMMANDS,
  cpuAt,
  EVENTS,
  FRAME_MESSAGE,
  IDLE,
  RUST_BOXES,
  RUST_LINES,
  RUST_PERCENT,
  SEAM_FILE,
  TRAY_BOX,
  TS_BOXES,
  TS_LINES,
  TS_PERCENT,
} from "../data/17-glass-boundary";
import {
  SUBSCRIBE_LIVE_RUST,
  SUBSCRIBE_LIVE_TS,
  TICK_SCROLL,
} from "../data/code/17-glass-boundary";
import { CodePane } from "./CodePane";
import {
  PINK as ACTOR,
  DATA,
  DIM,
  WAIT as FIGURE,
  OFF,
  ON,
  PLUMB,
  type Pt,
  polyline,
  RUST_INK,
  QUIET as TS_INK,
} from "./design";
import { EvidenceTag } from "./EvidenceTag";
import { NamePlate } from "./NamePlate";
import { PacketPath } from "./PacketPath";
import { ThreadRail } from "./ThreadRail";

const COPY = [
  {
    lead: `StatGlass is ${RUST_PERCENT} percent Rust by lines.`,
    body: "Rust has the samplers, the SQLite store, remote hosts and the menu bar item. The React UI is TypeScript.",
  },
  {
    lead: "tauri-specta generates bindings.ts.",
    body: `It writes ${COMMANDS} commands and ${EVENTS} events from the Rust source. A pre-push hook fails if the file is stale.`,
  },
  {
    lead: "Rust sends samples over a Tauri Channel.",
    body: "Each tick is one message whose values are an array, ordered by a layout sent earlier.",
  },
  {
    lead: "Each tick runs one transform animation.",
    body: "d3 computes the path and React renders it as SVG. The animation slides the redrawn chart one slot.",
  },
  {
    lead: `Idle CPU was ${IDLE.cpuPercent} percent of one core.`,
    body: `Rust draws the menu bar item. Measured once, ${IDLE.state}, on an ${IDLE.machine} in ${IDLE.month}.`,
  },
];

const SEAM_X = 960;
/** Rust runs left from the seam, TypeScript right. */
const BAR = { y: 196, h: 18, rust: 850, labelY: 242, gap: 16 };
const BAR_TS = (BAR.rust * TS_LINES) / RUST_LINES;
const TOP = 276;
const BOTTOM = 690;
const RUST = { x: 110, w: 590, h: 104, gap: 51, text: 24, bus: 660 };
const TS = { x: 1220, w: 590, h: 64, gap: 16, text: 76, bus: 1260 };
const STORE_W = 320;
const TRAY = { x: 450, w: 250 };
const RISER_X = 1180;
const NODE = 6;
/** Advance of one mono character at the box-title size, for placing notes. */
const MONO_ADVANCE = 12.6;
/** Mirror of --sf-faint: the chart's area under its line. */
const FAINT = 0.22;

const rustY = (i: number) => TOP + i * (RUST.h + RUST.gap);
const rustBoxes = RUST_BOXES.map((box, i) => ({
  ...box,
  x: RUST.x,
  y: rustY(i),
  w: box.id === "store" ? STORE_W : RUST.w,
}));
const tray = { ...TRAY_BOX, x: TRAY.x, y: rustY(2), w: TRAY.w };
const tsBoxes = TS_BOXES.map((box, i) => {
  const y = TOP + i * (TS.h + TS.gap);
  return {
    ...box,
    y,
    h: box.id === "widgets" ? BOTTOM - y : TS.h,
    noteX: TS.x + TS.text + box.name.length * MONO_ADVANCE + 20,
  };
});
const widgetBox = tsBoxes[3];
if (!widgetBox) throw new Error("Glass boundary requires its fourth TypeScript box");
const widgetY = widgetBox.y;
const mid = (i: number) => rustY(i) + RUST.h / 2;
const tsMid = (i: number) => TOP + i * (TS.h + TS.gap) + TS.h / 2;

/** Sampler, ring, across the seam, into the transport. */
const TO_TRANSPORT: Pt[] = [
  [RUST.bus, mid(0)],
  [RUST.bus, mid(1)],
  [RISER_X, mid(1)],
  [RISER_X, tsMid(0)],
  [TS.bus, tsMid(0)],
];
const TO_WIDGET: Pt[] = [
  [TS.bus, tsMid(0)],
  [TS.bus, tsMid(1)],
  [TS.bus, tsMid(2)],
  [TS.bus, tsMid(3)],
];
/** With no window open the sample gets as far as the seam. */
const TO_SEAM: Pt[] = [
  [RUST.bus, mid(0)],
  [RUST.bus, mid(1)],
  [SEAM_X, mid(1)],
];
const TO_STORE: Pt[] = [
  [RUST.x + STORE_W / 2, rustY(1) + RUST.h],
  [RUST.x + STORE_W / 2, rustY(2)],
];
const TO_TRAY: Pt[] = [
  [RUST.bus, rustY(1) + RUST.h],
  [RUST.bus, rustY(2)],
];
const nodes: Pt[] = [...TO_TRANSPORT.slice(0, 2), ...TO_WIDGET];
const TILE = { x: 785, y: TOP, w: 350, h: 46 };
const MSG = { x: 755, y: 408, w: 410, h: 46 };
const IDLE_CHIP = { x: 740, y: rustY(2), w: 430, h: RUST.h };
const CHART = { x: TS.x + TS.text, y: 582, w: 490, h: 94 };
const SLOT = CHART.w / (CHART_WINDOW - 1);
const CODE_RUST = { x: 840, y: 334, width: 970, height: 378 };
const CODE_TS = { x: 840, y: 722, width: 970, height: 228 };
/** Its longest line is 74 characters. */
const CODE_TICK = { x: 816, y: 734, width: 994, height: 216 };
const REACHED = 0.999;
const n = (value: number) => value.toLocaleString("en-US");

export function GlassBoundaryStage() {
  const id = useId();
  const s = useTween({
    frame: OFF,
    bar: OFF,
    rust: ON,
    ts: ON,
    detail: OFF,
    widgetFocus: OFF,
    seam: OFF,
    code1: OFF,
    toTransport: OFF,
    msg: OFF,
    toWidget: OFF,
    chart: OFF,
    code3: OFF,
    t: CHART_START,
    toSeam: OFF,
    idle: OFF,
  });
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { frame: ON, duration: DUR.morph, ease: SETTLE });
      tl.to(s, { bar: ON, duration: DUR.scale, ease: SETTLE }, `-=${DUR.opacity}`);
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { rust: DIM, ts: OFF, detail: ON, duration: DUR.card, ease: SETTLE });
      tl.to(s, { seam: ON, code1: ON, duration: DUR.morph, ease: SETTLE }, `+=${DUR.eraseHold}`);
      beat(1);

      tl.to(s, { code1: OFF, seam: OFF, rust: ON, ts: ON, duration: DUR.card, ease: SETTLE });
      tl.to(s, { toTransport: ON, duration: DUR.gather, ease: "none" });
      tl.to(s, { msg: ON, duration: DUR.morph, ease: SETTLE }, `+=${DUR.eraseHold}`);
      beat(2);

      tl.to(s, { rust: DIM, msg: DIM, widgetFocus: ON, duration: DUR.card, ease: SETTLE });
      tl.to(s, { toWidget: ON, duration: DUR.gather, ease: "none" });
      tl.to(s, { chart: ON, code3: ON, duration: DUR.morph, ease: SETTLE }, "<");
      tl.to(s, { t: CHART_START + 1, duration: DUR.morph, ease: "none" }, `+=${DUR.eraseHold}`);
      beat(3);

      tl.to(s, { code3: OFF, msg: OFF, ts: DIM, rust: ON, duration: DUR.card, ease: SETTLE });
      tl.to(s, { toSeam: ON, duration: DUR.gather, ease: "none" });
      tl.to(s, { idle: ON, duration: DUR.morph, ease: SETTLE }, `+=${DUR.eraseHold}`);
      beat(4);
    },
  });
  const route = Math.min(s.rust, s.ts) * s.frame;
  const awake = s.idle < 0.5;
  const lit: Record<string, boolean> = {
    collect: s.toTransport > OFF,
    engine: s.toTransport > 0.17,
    transport: s.toTransport > REACHED && awake,
    reducer: s.toWidget > 0.33 && awake,
    stores: s.toWidget > 0.66 && awake,
    widgets: s.toWidget > REACHED && awake,
  };
  const isLit = (boxId: string) => lit[boxId] ?? false;

  const last = Math.floor(s.t) + 1;
  const points: Pt[] = [];
  for (let k = last - CHART_WINDOW - 1; k <= last; k++) {
    points.push([
      CHART.x + CHART.w - (s.t - k) * SLOT,
      CHART.y + CHART.h - (cpuAt(k) / 100) * CHART.h,
    ]);
  }
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  if (!firstPoint || !lastPoint) throw new Error("Glass boundary chart requires sample points");
  const base = CHART.y + CHART.h;
  const line = polyline(points);
  const chart = { line, area: `${line} L${lastPoint[0]} ${base} L${firstPoint[0]} ${base} Z` };

  return (
    <StoryStage
      beats={beats}
      click={clicks}
      stage={
        <>
          <defs>
            <clipPath id={id}>
              <rect x={CHART.x} y={CHART.y - 4} width={CHART.w} height={CHART.h + 4} />
            </clipPath>
          </defs>
          <g style={{ opacity: s.frame * (ON - s.detail * (ON - DIM)) }}>
            <rect
              x={SEAM_X - BAR.rust * s.bar}
              y={BAR.y}
              width={BAR.rust * s.bar}
              height={BAR.h}
              fill={RUST_INK}
            />
            <rect x={SEAM_X} y={BAR.y} width={BAR_TS * s.bar} height={BAR.h} fill={TS_INK} />
            <line
              x1={SEAM_X}
              x2={SEAM_X}
              y1={BAR.y - 6}
              y2={BAR.y + BAR.h + 6}
              stroke={PLUMB}
              strokeWidth="3"
            />
            <g style={{ opacity: s.bar }}>
              <text
                className="sf-mono is-small"
                x={SEAM_X - BAR.gap}
                y={BAR.labelY}
                textAnchor="end"
              >
                <tspan fill={RUST_INK}>Rust</tspan> · {n(RUST_LINES)} lines · {RUST_PERCENT}%
              </text>
              <text className="sf-mono is-small" x={SEAM_X + BAR.gap} y={BAR.labelY}>
                {TS_PERCENT}% · {n(TS_LINES)} lines · <tspan fill={TS_INK}>TypeScript</tspan>
              </text>
            </g>
          </g>
          <g style={{ opacity: route }}>
            <path className="sf-wire" d={polyline(TO_TRANSPORT)} />
            <path className="sf-wire" d={polyline(TO_WIDGET)} />
          </g>
          <g style={{ opacity: s.rust * s.frame }}>
            <path className="sf-wire" d={polyline(TO_STORE)} />
            <path className="sf-wire" d={polyline(TO_TRAY)} />
          </g>
          {/* Packets ride the wires, so they pass under the boxes drawn after them. */}
          <PacketPath points={TO_TRANSPORT} progress={s.toTransport} color={DATA} />
          <PacketPath points={TO_WIDGET} progress={s.toWidget} color={DATA} />
          <PacketPath points={TO_SEAM} progress={s.toSeam} color={DATA} />
          <g style={{ opacity: s.frame }}>
            <line
              x1={SEAM_X}
              x2={SEAM_X}
              y1={TILE.y + TILE.h}
              y2={BOTTOM}
              stroke={PLUMB}
              strokeWidth="2"
              strokeDasharray="6 10"
              style={{ opacity: (ON - s.code1) * (ON - s.idle) }}
            />
            <g style={{ color: PLUMB }}>
              <rect
                className={`sf-box is-well${s.seam > 0.5 ? " is-lit" : ""}`}
                x={TILE.x}
                y={TILE.y}
                width={TILE.w}
                height={TILE.h}
              />
              <text
                className="sf-mono is-small"
                x={SEAM_X}
                y={TILE.y + 30}
                textAnchor="middle"
                style={{ fill: s.seam > 0.5 ? PLUMB : undefined }}
              >
                {SEAM_FILE}
              </text>
            </g>
          </g>
          <g style={{ opacity: s.frame, color: DATA }}>
            {rustBoxes.map((box) => (
              <g
                key={box.id}
                style={{
                  opacity:
                    box.id === "store" ? Math.min(s.rust, ON - s.detail * (ON - DIM)) : s.rust,
                }}
              >
                <rect
                  className={`sf-box${isLit(box.id) ? " is-lit" : ""}`}
                  x={box.x}
                  y={box.y}
                  width={box.w}
                  height={RUST.h}
                />
                <text className="sf-mono" x={box.x + RUST.text} y={box.y + 44}>
                  {box.name}
                </text>
                <text className="sf-mono is-small" x={box.x + RUST.text} y={box.y + 76}>
                  {box.note}
                </text>
              </g>
            ))}
          </g>
          <g
            style={{
              opacity: Math.max(DIM, s.rust - s.detail * (ON - DIM), s.idle) * s.frame,
              color: ACTOR,
            }}
          >
            <rect
              className={`sf-box${s.idle > 0.5 ? " is-lit" : ""}`}
              x={tray.x}
              y={tray.y}
              width={tray.w}
              height={RUST.h}
            />
            <text className="sf-mono" x={tray.x + RUST.text} y={tray.y + 44}>
              {tray.name}
            </text>
            <text className="sf-mono is-small" x={tray.x + RUST.text} y={tray.y + 76}>
              {tray.note}
            </text>
          </g>
          <g style={{ opacity: s.ts * s.frame, color: DATA }}>
            {tsBoxes.map((box) => (
              <g
                key={box.id}
                style={{
                  opacity:
                    box.id === "transport" ? ON : ON - s.detail * (ON - s.widgetFocus) * (ON - DIM),
                }}
              >
                <rect
                  className={`sf-box${isLit(box.id) ? " is-lit" : ""}`}
                  x={TS.x}
                  y={box.y}
                  width={TS.w}
                  height={box.h}
                />
                <text className="sf-mono" x={TS.x + TS.text} y={box.y + 40}>
                  {box.name}
                </text>
                <text className="sf-mono is-small" x={box.noteX} y={box.y + 40}>
                  {box.note}
                </text>
              </g>
            ))}
            <g style={{ opacity: s.chart }} clipPath={`url(#${id})`}>
              <path d={chart.area} fill={DATA} style={{ opacity: FAINT }} />
              <path
                d={chart.line}
                fill="none"
                stroke={DATA}
                strokeWidth="3"
                strokeLinejoin="round"
              />
            </g>
            <line
              x1={CHART.x}
              x2={CHART.x + CHART.w}
              y1={CHART.y + CHART.h}
              y2={CHART.y + CHART.h}
              stroke={TS_INK}
              strokeWidth="2"
              style={{ opacity: s.chart }}
            />
          </g>
          <g style={{ opacity: route }}>
            {nodes.map((p) => (
              <circle
                key={`${p[0]}-${p[1]}`}
                cx={p[0]}
                cy={p[1]}
                r={NODE}
                fill="none"
                stroke={TS_INK}
                strokeWidth="2"
              />
            ))}
          </g>
          <g style={{ opacity: s.msg }}>
            <rect className="sf-box is-well" x={MSG.x} y={MSG.y} width={MSG.w} height={MSG.h} />
            <text
              className="sf-mono is-small"
              x={SEAM_X}
              y={MSG.y + 30}
              textAnchor="middle"
              style={{ fill: DATA }}
            >
              {FRAME_MESSAGE}
            </text>
          </g>
          <g style={{ opacity: s.idle }}>
            <rect
              className="sf-box is-well"
              x={IDLE_CHIP.x}
              y={IDLE_CHIP.y}
              width={IDLE_CHIP.w}
              height={IDLE_CHIP.h}
            />
            <text
              className="sf-name"
              x={IDLE_CHIP.x + 24}
              y={IDLE_CHIP.y + 46}
              style={{ fill: FIGURE }}
            >
              {IDLE.cpuPercent}% of one core
            </text>
            <text className="sf-mono is-small" x={IDLE_CHIP.x + 24} y={IDLE_CHIP.y + 80}>
              {IDLE.state} · one run · {IDLE.date}
            </text>
            <circle
              cx={SEAM_X}
              cy={mid(1)}
              r="9"
              fill={DATA}
              style={{ opacity: s.toSeam > REACHED ? ON : OFF }}
            />
          </g>
        </>
      }
      overlay={
        <>
          <h2 className="od-story-head">Rust collects the data and TypeScript draws it.</h2>
          <NamePlate id="statglass" chipOnly />
          <EvidenceTag kind="schematic" x={TS.x + TS.w} y={224} align="right" progress={s.frame} />
          <EvidenceTag
            kind="illustrative"
            x={TS.x + TS.w - 12}
            y={widgetY + 12}
            align="right"
            progress={s.chart * s.ts}
          />
          <CodePane excerpt={SUBSCRIBE_LIVE_RUST} progress={s.code1} size={21} {...CODE_RUST} />
          <CodePane excerpt={SUBSCRIBE_LIVE_TS} progress={s.code1} size={21} {...CODE_TS} />
          <CodePane excerpt={TICK_SCROLL} progress={s.code3} size={21} {...CODE_TICK} />
          <ThreadRail current="statglass" />
        </>
      }
      card={<StoryCard anchor="left" hue="cyan" lead={copy.lead} body={copy.body} />}
    />
  );
}
