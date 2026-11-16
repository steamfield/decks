import { clamp01, DRAW, DUR, SETTLE, StoryCard, StoryStage, useStage } from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import {
  DENIAL,
  DENIAL_RECORDED,
  DENIAL_RULES,
  DENIAL_SOURCE,
  DENIED,
  SOURCED_FIGURES as FIGURES,
  PATTERN_ROWS,
  PATTERNS,
} from "../data/22-decks";
import type { Excerpt } from "../data/code/types";
import { CodePane } from "./CodePane";
import styles from "./DecksStage.module.css";
import source from "./DecksStage.tsx?raw";
import { WAIT as COUNTED, DATA, DIM, NEUTRAL, OFF, ON, PINK } from "./design";
import { NamePlate } from "./NamePlate";
import { TermPane } from "./TermPane";
import { ThreadRail } from "./ThreadRail";

const COPY = [
  {
    lead: "Each click seeks the timeline to a beat.",
    body: "The slide is a React component with a GSAP timeline. Stepping back plays the same tweens in reverse.",
  },
  {
    lead: `The write hook enforces ${DENIED} lint patterns.`,
    body: `The lint has ${PATTERNS} patterns. A write matching one of the ${DENIED} errors is refused with the pattern's id.`,
  },
  {
    lead: "This deck lists a source for each figure.",
    body: "Each row names the file or command that produces the figure.",
  },
];

const sourceLines = source.split("\n");
const first = sourceLines.findIndex((line) => line.trim() === "// excerpt:start") + 1;
const last = sourceLines.findIndex((line) => line.trim() === "// excerpt:end");
const OWN_SOURCE: Excerpt = {
  repo: "this deck",
  path: "components/DecksStage.tsx",
  start: first + 1,
  end: last,
  commit: "the build you are watching",
  lang: "ts",
  code: sourceLines
    .slice(first, last)
    .map((line) => line.slice(2))
    .join("\n"),
};

const LEFT = { x: 110, y: 196, width: 900, height: 500 };
const RIGHT = { x: 1060, x1: 1810 };
const TRACK = { y: 306, x0: RIGHT.x + 50, x1: RIGHT.x1 - 50, dot: 10, cursor: 20, label: 54 };
const GRID = { y: 470, size: 22, gap: 6 };
const COUNT = { y: 800 };
const stops = COPY.map((_, i) => ({
  n: i,
  x: TRACK.x0 + (i * (TRACK.x1 - TRACK.x0)) / (COPY.length - 1),
}));
const squares = PATTERN_ROWS.map((row, i) => ({ ...row, x: RIGHT.x + i * (GRID.size + GRID.gap) }));
const denied = PATTERN_ROWS.filter((row) => row.denied).map((row) => ({
  id: row.id,
  hit: DENIAL_RULES.includes(row.id),
}));
const idLines = [denied.slice(0, 3), denied.slice(3)];

export function DecksStage() {
  const s = useTween({ at: OFF, count: OFF });
  // excerpt:start
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { at: 1, duration: DUR.card, ease: SETTLE });
      beat(1);
      tl.to(s, { at: 2, duration: DUR.card, ease: SETTLE });
      tl.to(s, { count: FIGURES, duration: DUR.scale, ease: DRAW });
      beat(2);
    },
  });
  // excerpt:end
  const cursorX = TRACK.x0 + (s.at * (TRACK.x1 - TRACK.x0)) / (COPY.length - 1);
  const denial = clamp01(s.at) * (ON - clamp01(s.at - 1) * (ON - DIM));
  const counter = clamp01(s.at - 1);

  return (
    <StoryStage
      beats={beats}
      click={clicks}
      stage={
        <>
          <text className="sf-pixel is-small" x={RIGHT.x} y={226}>
            This slide's timeline
          </text>
          <text className="sf-mono" x={RIGHT.x1} y={230} textAnchor="end" style={{ fill: DATA }}>
            clicks = {clicks}
          </text>
          <line
            x1={TRACK.x0}
            x2={TRACK.x1}
            y1={TRACK.y}
            y2={TRACK.y}
            stroke={NEUTRAL}
            strokeWidth="2"
          />
          <line
            x1={TRACK.x0}
            x2={cursorX}
            y1={TRACK.y}
            y2={TRACK.y}
            stroke={DATA}
            strokeWidth="4"
            strokeLinecap="round"
          />
          {stops.map((stop) => (
            <g key={stop.n}>
              <circle
                cx={stop.x}
                cy={TRACK.y}
                r={TRACK.dot}
                fill={s.at >= stop.n ? DATA : NEUTRAL}
              />
              <text className="sf-mono" x={stop.x} y={TRACK.y + TRACK.label} textAnchor="middle">
                beat({stop.n})
              </text>
            </g>
          ))}
          <circle
            cx={cursorX}
            cy={TRACK.y}
            r={TRACK.cursor}
            fill="none"
            stroke={DATA}
            strokeWidth="3"
          />
          <g style={{ opacity: denial }}>
            <text className="sf-pixel is-small" x={RIGHT.x} y={GRID.y - 22}>
              {PATTERNS} lint patterns · the hook denies {DENIED}
            </text>
            {squares.map((sq) => (
              <rect
                key={sq.id}
                x={sq.x}
                y={GRID.y}
                width={GRID.size}
                height={GRID.size}
                rx="2"
                fill={sq.denied ? PINK : "none"}
                stroke={sq.denied ? PINK : NEUTRAL}
                strokeWidth="2"
              />
            ))}
            {idLines.map((ids, row) => (
              <text
                key={ids.map((rule) => rule.id).join(" ")}
                className="sf-mono is-small"
                x={RIGHT.x}
                y={GRID.y + 66 + row * 32}
              >
                {ids.map((rule, i) => (
                  <tspan key={rule.id} style={{ fill: rule.hit ? PINK : undefined }}>
                    {i ? " · " : ""}
                    {rule.id}
                  </tspan>
                ))}
              </text>
            ))}
          </g>
          <g style={{ opacity: counter }}>
            <text
              className={`dk-count ${styles["dk-count"]}`}
              x={RIGHT.x}
              y={COUNT.y}
              style={{ fill: COUNTED }}
            >
              {Math.round(s.count)}
            </text>
            <text
              className={`dk-count-label ${styles["dk-count-label"]}`}
              x={RIGHT.x}
              y={COUNT.y + 54}
            >
              source rows for this deck's figures and claims
            </text>
            <text className="sf-mono is-small" x={RIGHT.x} y={COUNT.y + 92}>
              data-sources.md and data/sources/*.md, counted at build
            </text>
          </g>
        </>
      }
      overlay={
        <>
          <h2 className="od-story-head">A Decks hook blocks AI-sounding sentences.</h2>
          <NamePlate id="decks" />
          {clicks < 1 ? (
            <CodePane excerpt={OWN_SOURCE} {...LEFT} size={21} />
          ) : (
            <TermPane
              lines={DENIAL}
              {...LEFT}
              size={28}
              tag={`Recorded ${DENIAL_RECORDED} · test input · ${DENIAL_SOURCE}`}
              progress={ON - clamp01(s.at - 1) * (ON - DIM)}
              power={clamp01(s.at)}
            />
          )}
          <ThreadRail current="decks" />
        </>
      }
      card={<StoryCard anchor="left" hue="rose" lead={copy.lead} body={copy.body} />}
    />
  );
}
