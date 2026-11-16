import { DRAW, DUR, SETTLE, StoryCard, StoryStage, useStage } from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import {
  FAKE_SERVER_LINES,
  QUESTION_TIMEOUT_MIN,
  TOOL_CALL_METHOD,
  TOOL_NAME,
  WAIT_OUTPUT,
  WAIT_OUTPUT_SOURCE,
} from "../data/14-foreman-question";
import { HOLD_QUESTION, RESPOND, TIMEOUT_TEST, WAKE } from "../data/code/14-foreman-question";
import type { Excerpt } from "../data/code/types";
import { CodePane } from "./CodePane";
import { DATA, DIM, WAIT as HELD, OFF, ON, GREEN as PASSED, PINK, PLUMB, type Pt } from "./design";
import { EvidenceTag } from "./EvidenceTag";
import { NamePlate } from "./NamePlate";
import { PacketPath } from "./PacketPath";
import { ThreadRail } from "./ThreadRail";

const COPY = [
  {
    lead: `Codex asks by calling the ${TOOL_NAME} tool.`,
    body: "The daemon stores the request id and sends no response, so the Codex turn stays blocked.",
  },
  {
    lead: "A background foreman wait exits with the question.",
    body: "Claude Code reports the finished background task to Claude, which reads the question from its output.",
  },
  {
    lead: "Claude's answer is returned as the tool result.",
    body: `After ${QUESTION_TIMEOUT_MIN} minutes without an answer, the daemon returns a message telling Codex to continue.`,
  },
  {
    lead: "The timeout test advances a test clock.",
    body: `Effect's TestClock moves time by one second. A ${FAKE_SERVER_LINES}-line script replaces Codex in the tests.`,
  },
];

const CODE: readonly { excerpt: Excerpt; lines: readonly (readonly [number, number])[] }[] = [
  {
    excerpt: HOLD_QUESTION,
    lines: [
      [3, 3],
      [10, 10],
    ],
  },
  { excerpt: WAKE, lines: [[2, 6]] },
  { excerpt: RESPOND, lines: [[2, 5]] },
  {
    excerpt: TIMEOUT_TEST,
    lines: [
      [3, 3],
      [5, 5],
      [10, 10],
    ],
  },
];

const X = { claude: 300, wait: 700, daemon: 1100, codex: 1500 };
const HEAD = { y: 196, w: 280, h: 78 };
const LIFE = { top: HEAD.y + HEAD.h, bottom: 522 };
const ROW = { ask: 322, wake: 370, exit: 418, answer: 466, reply: 508 };
const BAR = 16;
const TERM = { x: 110, y: 556, w: 690, h: 132 };
const CODE_BOX = { x: 840, y: 530, width: 970, height: 420 };
const HEAD_PT = 12;

const heads = [
  { id: "claude", x: X.claude, name: "Claude", sub: "orchestrator", mono: false },
  { id: "wait", x: X.wait, name: "foreman wait", sub: "background task", mono: true },
  { id: "daemon", x: X.daemon, name: "daemon", sub: "foreman", mono: false },
  { id: "codex", x: X.codex, name: "Codex", sub: "the delegate", mono: false },
] as const;

const dimBy = (by: number) => ON - (ON - DIM) * by;

interface Message {
  id: string;
  from: number;
  to: number;
  y: number;
  label: string;
  at: number;
  color: string;
  dashed: boolean;
  p: number;
  opacity: number;
}

const tip = (m: Message) => m.from + (m.to - m.from) * m.p;
const arrow = (m: Message) => {
  const dir = m.to > m.from ? 1 : -1;
  const x = tip(m);
  return `M${x} ${m.y} L${x - dir * HEAD_PT} ${m.y - HEAD_PT / 2} L${x - dir * HEAD_PT} ${m.y + HEAD_PT / 2} Z`;
};
const flight = (m: Message): Pt[] => [
  [m.from, m.y],
  [m.to, m.y],
];
const headInk = (id: string) =>
  id === "claude" ? PINK : id === "daemon" ? HELD : id === "codex" ? DATA : PLUMB;

export function ForemanQuestionStage() {
  const s = useTween({
    frame: OFF,
    code: OFF,
    ask: OFF,
    wake: OFF,
    exit: OFF,
    out: OFF,
    answer: OFF,
    reply: OFF,
    rest: OFF,
  });
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { frame: ON, duration: DUR.grow, ease: SETTLE });
      tl.to(s, { code: ON, duration: DUR.card, ease: SETTLE }, "<");
      tl.to(s, { ask: ON, duration: DUR.scale, ease: DRAW });
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { wake: ON, duration: DUR.grow, ease: DRAW });
      tl.to(s, { out: ON, duration: DUR.card, ease: SETTLE });
      tl.to(s, { exit: ON, duration: DUR.grow, ease: DRAW }, "<");
      beat(1);

      tl.to(s, { answer: ON, duration: DUR.scale, ease: DRAW });
      tl.to(s, { reply: ON, duration: DUR.grow, ease: DRAW });
      beat(2);

      tl.to(s, { rest: ON, duration: DUR.color, ease: SETTLE });
      beat(3);
    },
  });
  const code = CODE[Math.min(Math.max(clicks, 0), CODE.length - 1)];
  if (!code) throw new Error(`No Foreman question code for click ${clicks}`);
  const messages: Message[] = [
    {
      id: "ask",
      from: X.codex,
      to: X.daemon,
      y: ROW.ask,
      label: `${TOOL_CALL_METHOD} ${TOOL_NAME}`,
      at: (X.codex + X.daemon) / 2,
      color: HELD,
      dashed: false,
      p: s.ask,
      opacity: dimBy(s.wake),
    },
    {
      id: "wake",
      from: X.daemon,
      to: X.wait,
      y: ROW.wake,
      label: "wait request returns",
      at: (X.daemon + X.wait) / 2,
      color: PLUMB,
      dashed: false,
      p: s.wake,
      opacity: dimBy(s.answer),
    },
    {
      id: "exit",
      from: X.wait,
      to: X.claude,
      y: ROW.exit,
      label: "process exits",
      at: (X.wait + X.claude) / 2,
      color: DATA,
      dashed: true,
      p: s.exit,
      opacity: dimBy(s.answer),
    },
    {
      id: "answer",
      from: X.claude,
      to: X.daemon,
      y: ROW.answer,
      label: "foreman answer",
      at: (X.claude + X.wait) / 2,
      color: PINK,
      dashed: false,
      p: s.answer,
      opacity: dimBy(s.rest),
    },
    {
      id: "reply",
      from: X.daemon,
      to: X.codex,
      y: ROW.reply,
      label: "response to the stored request id",
      at: (X.daemon + X.codex) / 2,
      color: PASSED,
      dashed: false,
      p: s.reply,
      opacity: dimBy(s.rest),
    },
  ];
  const frame = s.frame * dimBy(s.rest);
  const held = s.ask > 0.5 && s.reply < 0.5;
  const woken = s.exit > 0.5 && s.rest < 0.5;
  const headLit = (id: string) =>
    id === "claude"
      ? woken
      : id === "daemon"
        ? held
        : id === "codex"
          ? s.wake < 0.5 || s.reply > 0.5
          : s.exit < 0.5;

  return (
    <StoryStage
      beats={beats}
      click={clicks}
      stage={
        <>
          <g style={{ opacity: frame }}>
            {heads.map((h) => (
              <g key={h.id} style={{ color: headInk(h.id) }}>
                <line
                  className="sf-wire"
                  x1={h.x}
                  x2={h.x}
                  y1={LIFE.top}
                  y2={h.id === "wait" ? ROW.exit : LIFE.bottom}
                  strokeDasharray="4 8"
                />
                <rect
                  className={`sf-box${headLit(h.id) && s.rest < 0.5 ? " is-lit" : ""}`}
                  x={h.x - HEAD.w / 2}
                  y={HEAD.y}
                  width={HEAD.w}
                  height={HEAD.h}
                />
                <text
                  className={h.mono ? "sf-mono" : "sf-name"}
                  x={h.x - HEAD.w / 2 + 20}
                  y={HEAD.y + 34}
                >
                  {h.name}
                </text>
                <text className="sf-mono is-small" x={h.x - HEAD.w / 2 + 20} y={HEAD.y + 62}>
                  {h.sub}
                </text>
              </g>
            ))}
            <line
              className="sf-wire"
              x1={X.wait}
              x2={X.wait}
              y1={ROW.exit}
              y2={LIFE.bottom}
              strokeDasharray="4 8"
              style={{ opacity: ON - s.exit }}
            />
            <rect
              x={X.wait - BAR / 2}
              y={LIFE.top + 14}
              width={BAR}
              height={ROW.exit - LIFE.top - 14}
              rx="3"
              fill={PLUMB}
            />
            <line
              x1={X.wait - 18}
              x2={X.wait + 18}
              y1={ROW.exit + 2}
              y2={ROW.exit + 2}
              stroke={PLUMB}
              strokeWidth="4"
              strokeLinecap="round"
              style={{ opacity: s.exit }}
            />
            <g style={{ opacity: s.ask }}>
              <rect
                x={X.daemon - BAR / 2}
                y={ROW.ask}
                width={BAR}
                height={ROW.reply - ROW.ask}
                rx="3"
                fill={HELD}
              />
              <g style={{ opacity: dimBy(s.wake) }}>
                <text
                  className="sf-mono is-small"
                  x={X.daemon + 24}
                  y={ROW.ask + 30}
                  style={{ fill: HELD }}
                >
                  id stored, no response
                </text>
              </g>
              <text
                className="sf-mono is-small"
                x={X.codex + 22}
                y={ROW.ask + 96}
                style={{ fill: HELD, opacity: ON - s.reply }}
              >
                turn blocked
              </text>
            </g>
            <text
              className="sf-mono is-small"
              x={X.codex + 22}
              y={ROW.reply + 6}
              style={{ fill: DATA, opacity: s.reply }}
            >
              turn resumes
            </text>
          </g>
          {messages.map((m) => (
            <g key={m.id} style={{ opacity: s.frame * (m.p > OFF ? m.opacity : OFF) }}>
              <line
                x1={m.from}
                x2={tip(m)}
                y1={m.y}
                y2={m.y}
                stroke={m.color}
                strokeWidth="3"
                strokeDasharray={m.dashed ? "10 8" : undefined}
              />
              <path d={arrow(m)} fill={m.color} />
              <text
                className="sf-mono is-small"
                x={m.at}
                y={m.y - 12}
                textAnchor="middle"
                style={{ fill: m.color, opacity: m.p }}
              >
                {m.label}
              </text>
              <PacketPath points={flight(m)} progress={m.p} color={m.color} radius={7} />
            </g>
          ))}
          <g style={{ opacity: s.out * dimBy(s.answer) }}>
            <rect className="sf-box is-well" x={TERM.x} y={TERM.y} width={TERM.w} height={TERM.h} />
            <text className="sf-mono is-small" x={TERM.x + 20} y={TERM.y + 32}>
              foreman wait prints · {WAIT_OUTPUT_SOURCE}
            </text>
            {WAIT_OUTPUT.map((line, i) => (
              <text
                key={line.text}
                className="sf-term"
                x={TERM.x + 20}
                y={TERM.y + 72 + i * 34}
                style={{ fontSize: "27px", fill: line.tone === "warn" ? HELD : undefined }}
              >
                {line.text}
              </text>
            ))}
          </g>
        </>
      }
      overlay={
        <>
          <h2 className="od-story-head">Codex waits until Claude answers its question.</h2>
          <NamePlate id="foreman" chipOnly />
          <EvidenceTag kind="schematic" x={110} y={490} progress={s.frame} />
          <CodePane
            excerpt={code.excerpt}
            focus={code.lines}
            progress={s.code}
            {...CODE_BOX}
            size={22}
          />
          <ThreadRail current="foreman" />
        </>
      }
      card={<StoryCard anchor="left" hue="rose" lead={copy.lead} body={copy.body} />}
    />
  );
}
