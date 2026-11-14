import { DUR, ink, SETTLE, StoryCard, StoryStage, stagger, useStage } from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import {
  AGENT_LINES,
  AGENT_MARKERS,
  ASK_PERSON,
  CLI,
  EXIT_CODES,
  NEXT_ROWS,
  PERSON_LINES,
  READ_REPORT,
  RECORDED,
  SCRIPT_LINES,
} from "../data/06-stacks-output";
import { DIM, FRAME, OFF, ON } from "./design";
import { NamePlate } from "./NamePlate";
import { TermPane } from "./TermPane";
import { ThreadRail } from "./ThreadRail";

const COPY = [
  {
    lead: "On a terminal, verify prints colour.",
    body: "Stacks uses this format only when stdout is a terminal, no agent is detected and CI is unset.",
  },
  {
    lead: "Run by an agent, verify prints plain text.",
    body: "Stacks finds an agent marker in the environment and prints no colour codes and no live step output.",
  },
  {
    lead: "With --json, stdout is one object.",
    body: "The last line of stderr is an error envelope whose next field says what to do.",
  },
  {
    lead: "Each exit code has one meaning.",
    body: `${READ_REPORT} means read the verify report, and ${ASK_PERSON} means ask a person.`,
  },
];

const GAP = 22;
const PANE = { y: 196, width: (FRAME.right - FRAME.left - 2 * GAP) / 3, height: 470, size: 26 };
const paneX = (i: number) => FRAME.left + i * (PANE.width + GAP);
const SIDE = { x: 842, y: 716, width: FRAME.right - 842 };
const TILE = { cols: 4, gap: 18, height: 108 };
const tileWidth = (SIDE.width - (TILE.cols - 1) * TILE.gap) / TILE.cols;
const ACTION_COLS = 17;

const wrapAction = (text: string) =>
  text.split(" ").reduce<string[]>((rows, word) => {
    const last = rows[rows.length - 1];
    if (last !== undefined && last.length + 1 + word.length <= ACTION_COLS)
      rows[rows.length - 1] = `${last} ${word}`;
    else rows.push(word);
    return rows;
  }, []);

const PINK = ink("rose", 2);
const WAIT = ink("amber", 2);
const NEUTRAL = ink("slate", 2);
const ACTION_INK = ink("slate", 3);
const ACTION_SIZE = 26;

const tiles = EXIT_CODES.map((exit, i) => ({
  ...exit,
  x: SIDE.x + (i % TILE.cols) * (tileWidth + TILE.gap),
  y: SIDE.y + Math.floor(i / TILE.cols) * (TILE.height + TILE.gap),
  rows: wrapAction(exit.action),
  color: exit.code === READ_REPORT ? PINK : exit.code === ASK_PERSON ? WAIT : NEUTRAL,
  lit: exit.code === READ_REPORT || exit.code === ASK_PERSON,
}));
const tag = `Recorded ${RECORDED} · stacks ${CLI}`;

export function StacksOutputStage() {
  const s = useTween({
    frame: OFF,
    person: OFF,
    agent: OFF,
    markers: OFF,
    script: OFF,
    exits: OFF,
  });
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { frame: ON, duration: DUR.card, ease: SETTLE });
      tl.to(s, { person: ON, duration: DUR.grow, ease: SETTLE });
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { agent: ON, duration: DUR.grow, ease: SETTLE });
      tl.to(s, { markers: ON, duration: DUR.card, ease: SETTLE });
      beat(1);
      tl.to(s, { markers: OFF, duration: DUR.opacity, ease: SETTLE });
      tl.to(s, { script: ON, duration: DUR.grow, ease: SETTLE });
      beat(2);
      tl.to(s, { exits: ON, duration: DUR.scale, ease: "none" });
      beat(3);
    },
  });

  const paneLevel = (next: number) => s.frame * (ON - next * (ON - DIM));
  const personLevel = paneLevel(s.agent);
  const agentLevel = paneLevel(s.script);
  const scriptLevel = paneLevel(s.exits);
  const tileProgress = (i: number) => stagger(s.exits, i, tiles.length, 0.1);

  return (
    <StoryStage
      beats={beats}
      click={clicks}
      stage={
        <>
          <g style={{ opacity: s.markers }}>
            <text className="sf-pixel" x={SIDE.x} y={SIDE.y + 24}>
              Agent markers in the environment
            </text>
            <text className="sf-mono" x={SIDE.x} y={SIDE.y + 68}>
              {AGENT_MARKERS.slice(0, 3).join("  ")}
            </text>
            <text className="sf-mono" x={SIDE.x} y={SIDE.y + 102}>
              {AGENT_MARKERS.slice(3).join("  ")}
            </text>
            <text className="sf-mono is-small" x={SIDE.x} y={SIDE.y + 146}>
              src/config.ts · checked in order
            </text>
          </g>
          {tiles.map((tile, i) => (
            <g
              key={tile.code}
              style={{
                opacity: tileProgress(i),
                transform: `translate(0, ${(ON - tileProgress(i)) * 16}px)`,
                color: tile.color,
              }}
            >
              <rect
                className={`sf-box${tile.lit ? " is-lit" : ""}`}
                x={tile.x}
                y={tile.y}
                width={tileWidth}
                height={TILE.height}
              />
              <text
                className="sf-name"
                x={tile.x + 18}
                y={tile.y + 38}
                style={{ fill: tile.lit ? tile.color : undefined }}
              >
                {tile.code}
              </text>
              {tile.rows.map((row, n) => (
                <text
                  key={row}
                  className="sf-term"
                  x={tile.x + 18}
                  y={tile.y + 68 + n * 27}
                  style={{ fontSize: `${ACTION_SIZE}px`, fill: tile.lit ? tile.color : ACTION_INK }}
                >
                  {row}
                </text>
              ))}
            </g>
          ))}
        </>
      }
      overlay={
        <>
          <h2 className="od-story-head">Stacks output differs for people and agents.</h2>
          <NamePlate id="stacks" chipOnly />
          <TermPane
            lines={PERSON_LINES}
            x={paneX(0)}
            y={PANE.y}
            width={PANE.width}
            height={PANE.height}
            size={PANE.size}
            progress={personLevel}
            power={s.person}
            label="Person"
            tag={tag}
          />
          <TermPane
            lines={AGENT_LINES}
            x={paneX(1)}
            y={PANE.y}
            width={PANE.width}
            height={PANE.height}
            size={PANE.size}
            progress={agentLevel}
            power={s.agent}
            label="Agent"
            tag={tag}
          />
          <TermPane
            lines={SCRIPT_LINES}
            highlight={NEXT_ROWS}
            x={paneX(2)}
            y={PANE.y}
            width={PANE.width}
            height={PANE.height}
            size={PANE.size}
            progress={scriptLevel}
            power={s.script}
            label="Script"
            tag={tag}
          />
          <ThreadRail current="stacks" />
        </>
      }
      card={<StoryCard anchor="left" hue="rose" lead={copy.lead} body={copy.body} />}
    />
  );
}
