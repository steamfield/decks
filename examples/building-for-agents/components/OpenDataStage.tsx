import {
  DRAW,
  DUR,
  ink,
  OpenChart,
  SETTLE,
  STAGE,
  StoryCard,
  StoryStage,
  scaleChartTheme,
  slideChartAnimation,
  slideChartTheme,
  useFrameScale,
  useStage,
} from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import { type ComponentProps, useMemo } from "react";
import {
  CHART_DATA,
  CHART_MODEL_SAMPLE_ROWS,
  CHART_RESOURCE,
  CHART_SAMPLE_ROWS,
  RECORDED,
  SESSION,
  SHOWN,
  TOOLS_REGISTERED,
} from "../data/15-opendata";
import { TOOL_REGISTRY, WORKFLOW } from "../data/code/15-opendata";
import { CodePane } from "./CodePane";
import { DIM, OFF, ON, type Pt } from "./design";
import { EvidenceTag } from "./EvidenceTag";
import { NamePlate } from "./NamePlate";
import styles from "./OpenDataStage.module.css";
import { PacketPath } from "./PacketPath";
import { TermPane } from "./TermPane";
import { ThreadRail } from "./ThreadRail";

const COPY = [
  {
    lead: "The MCP server is TypeScript.",
    body: `It registers ${TOOLS_REGISTERED} tools and runs on Bun with Hono. The query engine is Python and DuckDB.`,
  },
  {
    lead: "The server\u2019s instructions set the tool order.",
    body: "The order is search, then SQL, then chart. Search results already include column schemas.",
  },
  {
    lead: "Chart rows go to the interface only.",
    body: `The model reads the text. Up to ${CHART_SAMPLE_ROWS} rows are in _meta, which the host shows only to the interface.`,
  },
  {
    lead: "The chart renders inside the chat.",
    body: "The interface is a React app. The host loads it in an iframe from the server's ui:// resource.",
  },
];

const PANE = { x: 110, y: 196, width: 870, height: 754 };
const CHART = { x: 150, y: 566, width: 790, height: 318 };
const CODE = { x: 1040, y: 196, width: 770, height: 494 };
const RESULT = { x: 1040, y: 240, w: 770, h: 206 };
const PART = { y: 300, h: 126 };
const PARTS = [
  { id: "content", x: 1060, w: 190, note: "text" },
  {
    id: "structuredContent",
    x: 1270,
    w: 290,
    note: `spec, ${CHART_MODEL_SAMPLE_ROWS}-row sample`,
  },
  { id: "_meta", x: 1580, w: 210, note: `up to ${CHART_SAMPLE_ROWS} rows` },
] as const;
const READER = { y: 572, h: 108 };
const MODEL = { x: 1060, w: 300 };
const IFRAME = { x: 1470, w: 320 };
const JOIN_Y = 500;

const partFoot = (i: 0 | 1 | 2): Pt => [PARTS[i].x + PARTS[i].w / 2, PART.y + PART.h];
const modelTop: Pt = [MODEL.x + MODEL.w / 2, READER.y];
const iframeTop: Pt = [IFRAME.x + IFRAME.w / 2, READER.y];
const via = (from: Pt, to: Pt): Pt[] => [from, [from[0], JOIN_Y], [to[0], JOIN_Y], to];
const TO_MODEL = via(partFoot(0), modelTop);
const TO_IFRAME = [via(partFoot(1), iframeTop), via(partFoot(2), iframeTop)];

const PINK = ink("rose", 2);
const DATA = ink("cyan", 2);
const NEUTRAL = ink("slate", 2);
const chartBox = {
  left: `${(CHART.x / STAGE.width) * 100}%`,
  top: `${(CHART.y / STAGE.height) * 100}%`,
  width: `${(CHART.width / STAGE.width) * 100}%`,
  height: `${(CHART.height / STAGE.height) * 100}%`,
};

export function OpenDataStage() {
  const s = useTween({ frame: OFF, lines: OFF, code: ON, split: OFF, flow: OFF, chart: OFF });
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { frame: ON, duration: DUR.grow, ease: SETTLE });
      tl.to(s, { lines: SHOWN[0], duration: DUR.scale, ease: "none" });
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { lines: SHOWN[1], duration: DUR.scale, ease: "none" });
      beat(1);
      tl.to(s, { lines: SHOWN[2], duration: DUR.card, ease: "none" });
      tl.to(s, { code: OFF, duration: DUR.color, ease: SETTLE }, "<");
      tl.to(s, { split: ON, duration: DUR.card, ease: SETTLE });
      tl.to(s, { flow: ON, duration: DUR.scale, ease: DRAW });
      beat(2);
      tl.to(s, { chart: ON, duration: DUR.card, ease: SETTLE });
      beat(3);
    },
  });
  const excerpt = clicks >= 1 ? WORKFLOW : TOOL_REGISTRY;
  const focus = useMemo<readonly (readonly [number, number])[]>(
    () => (clicks >= 1 ? [[3, 3]] : []),
    [clicks],
  );
  const modelSide = ON - s.chart * (ON - DIM);
  const arrived = s.flow >= ON;
  const scale = useFrameScale();
  const chartSpec = useMemo<ComponentProps<typeof OpenChart>["spec"]>(() => {
    const base = scaleChartTheme(
      {
        ...slideChartTheme,
        fonts: {
          ...slideChartTheme.fonts,
          sizes: { ...slideChartTheme.fonts.sizes, body: 26, small: 24, axisTick: 26 },
        },
        spacing: { ...slideChartTheme.spacing, xAxisHeight: 58 },
      },
      scale,
    );
    return {
      mark: { type: "bar" },
      // Bands draw bottom-up, so the largest change goes last to sit on top.
      data: [...CHART_DATA].reverse(),
      encoding: {
        y: { field: "state", type: "nominal", sort: null, axis: { title: "" } },
        x: {
          field: "change",
          type: "quantitative",
          axis: { title: "Change since 2022 (%)", format: ".0f" },
        },
      },
      theme: { ...base, colors: { ...base.colors, categorical: [DATA] } },
      animation: slideChartAnimation,
      labels: { density: "none" },
    };
  }, [scale]);

  return (
    <StoryStage
      beats={beats}
      click={clicks}
      stage={
        <g style={{ opacity: s.split }}>
          <rect className="sf-box" x={RESULT.x} y={RESULT.y} width={RESULT.w} height={RESULT.h} />
          <text className="sf-mono" x={RESULT.x + 22} y={RESULT.y + 40}>
            result of the openchart tool
          </text>
          {PARTS.map((part, i) => (
            <g key={part.id} style={{ opacity: i === 0 ? modelSide : ON }}>
              <rect
                className="sf-box is-well"
                x={part.x}
                y={PART.y}
                width={part.w}
                height={PART.h}
              />
              <text
                className="sf-mono"
                x={part.x + 16}
                y={PART.y + 42}
                style={{ fill: i === 0 ? NEUTRAL : DATA }}
              >
                {part.id}
              </text>
              <text
                className={`od-part-note ${styles["od-part-note"]}`}
                x={part.x + 16}
                y={PART.y + 92}
              >
                {part.note}
              </text>
            </g>
          ))}
          <g style={{ opacity: modelSide }}>
            <PacketPath points={TO_MODEL} progress={s.flow} color={PINK} wire />
          </g>
          {TO_IFRAME.map((path, i) => (
            <PacketPath key={PARTS[i + 1]?.id} points={path} progress={s.flow} color={DATA} wire />
          ))}
          <g style={{ opacity: modelSide, color: PINK }}>
            <rect
              className={`sf-box${arrived ? " is-lit" : ""}`}
              x={MODEL.x}
              y={READER.y}
              width={MODEL.w}
              height={READER.h}
            />
            <text
              className="sf-name"
              x={MODEL.x + MODEL.w / 2}
              y={READER.y + 50}
              textAnchor="middle"
            >
              model
            </text>
            <text
              className="sf-mono is-small"
              x={MODEL.x + MODEL.w / 2}
              y={READER.y + 84}
              textAnchor="middle"
            >
              reads the text
            </text>
          </g>
          <g style={{ color: DATA }}>
            <rect
              className={`sf-box${arrived ? " is-lit" : ""}`}
              x={IFRAME.x}
              y={READER.y}
              width={IFRAME.w}
              height={READER.h}
            />
            <text
              className="sf-name"
              x={IFRAME.x + IFRAME.w / 2}
              y={READER.y + 50}
              textAnchor="middle"
            >
              iframe
            </text>
            <text
              className="sf-mono is-small"
              x={IFRAME.x + IFRAME.w / 2}
              y={READER.y + 84}
              textAnchor="middle"
            >
              {CHART_RESOURCE}
            </text>
          </g>
        </g>
      }
      overlay={
        <>
          <h2 className="od-story-head">OpenData sends text to the model, rows to the UI.</h2>
          <NamePlate id="opendata" />
          <TermPane
            lines={SESSION}
            shown={s.lines}
            follow={false}
            {...PANE}
            size={28}
            tag={`Recorded ${RECORDED} · steamfield.io's OpenData session`}
            progress={s.frame}
          />
          {s.chart > OFF && (
            <div
              className={`od-chat-chart ${styles["od-chat-chart"]}`}
              style={{ ...chartBox, opacity: s.chart }}
            >
              <OpenChart spec={chartSpec} />
            </div>
          )}
          <CodePane
            excerpt={excerpt}
            focus={focus}
            progress={s.frame * s.code}
            {...CODE}
            size={21}
          />
          <EvidenceTag
            kind="schematic"
            x={RESULT.x + RESULT.w}
            y={RESULT.y - 44}
            align="right"
            progress={s.split}
          />
          <ThreadRail current="opendata" />
        </>
      }
      card={<StoryCard anchor="right" hue="rose" lead={copy.lead} body={copy.body} />}
    />
  );
}
