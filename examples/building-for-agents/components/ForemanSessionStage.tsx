import { DUR, ink, SETTLE, StoryCard, StoryStage, useStage } from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import {
  ANSWER,
  ANSWER_DELAY_S,
  BRANCH_PREFIX,
  claudeStatus,
  type Endpoint,
  QUESTION,
  RECORDED,
  SESSION,
  type SessionState,
  STILLS,
  sceneAt,
  short,
  WORKTREE_DIR,
  worktreeOf,
  wrap,
} from "../data/07-foreman-session";
import { CrtFrame } from "./CrtFrame";
import { DIM, OFF, ON, type Pt, polyline } from "./design";
import { NamePlate } from "./NamePlate";
import { PacketPath } from "./PacketPath";
import { ThreadRail } from "./ThreadRail";

const COPY = [
  {
    lead: "Claude writes one contract per task.",
    body: "Each contract is a Markdown file. foreman reads its May change line for the paths the delegate may edit.",
  },
  {
    lead: "foreman creates a worktree and branch per delegate.",
    body: `The worktree is ${WORKTREE_DIR}/<name> and the branch is ${BRANCH_PREFIX}<name>.`,
  },
  {
    lead: `${SESSION.question.run} asked Claude a question.`,
    body: "The daemon leaves the tool call open until Claude answers, and the other two delegates keep running.",
  },
  {
    lead: `Claude answered after ${ANSWER_DELAY_S} seconds.`,
    body: "The answer is returned inside the same Codex turn, so the delegate continues with its context.",
  },
  {
    lead: "Claude reviews each diff and commits it.",
    body: "foreman leaves the work uncommitted. Its digest lists every file changed outside May change.",
  },
];

const CLAUDE = { x: 110, y: 240, w: 410, h: 440 };
const BOARD = { x: 600, y: 240, w: 580, h: 440 };
const AGENT = { x: 1280, y: 196, w: 530, h: 234, gap: 16 };
const CONTRACT = { x: CLAUDE.x + 20, y: CLAUDE.y + 112, w: CLAUDE.w - 40, h: 84, gap: 10 };
const WIRE_Y = 460;
const PORT_Y = [400, 460, 520];
const TURN_X = [1230, 1245, 1215];
const agentY = (i: number) => AGENT.y + i * (AGENT.h + AGENT.gap);

const CLAUDE_TO_BOARD: Pt[] = [
  [CLAUDE.x + CLAUDE.w, WIRE_Y],
  [BOARD.x, WIRE_Y],
];
const boardToAgent = (i: number): Pt[] => {
  const mid = agentY(i) + AGENT.h / 2;
  const portY = PORT_Y[i];
  const turnX = TURN_X[i];
  if (portY === undefined || turnX === undefined)
    throw new Error(`No foreman session wire for delegate ${i}`);
  return [
    [BOARD.x + BOARD.w, portY],
    [turnX, portY],
    [turnX, mid],
    [AGENT.x, mid],
  ];
};
function route(from: Endpoint, to: Endpoint): Pt[] {
  if (from === "claude") return CLAUDE_TO_BOARD;
  if (to === "claude") return [...CLAUDE_TO_BOARD].reverse();
  if (typeof to === "number") return boardToAgent(to);
  if (typeof from === "number") return [...boardToAgent(from)].reverse();
  throw new Error(`No foreman session route from ${from} to ${to}`);
}

const PINK = ink("rose", 2);
const WORK = ink("cyan", 2);
const HELD = ink("amber", 2);
const PASSED = ink("emerald", 2);
const PLUMB = ink("violet", 3);
const NEUTRAL = ink("slate", 2);
const stateInk: Record<SessionState, string> = {
  queued: NEUTRAL,
  starting: WORK,
  running: WORK,
  waiting: HELD,
  done: PASSED,
  archived: NEUTRAL,
};
const contracts = SESSION.delegates.map((d, i) => ({
  file: d.contract,
  line: short(d.mayChange, 32),
  y: CONTRACT.y + i * (CONTRACT.h + CONTRACT.gap),
  sent: d.start,
}));
const QUESTION_LINES = wrap(SESSION.question.text, 46, 4);
const SCREEN_X = BOARD.x + 38;
const rowY = (i: number) => BOARD.y + 108 + i * 40;

export function ForemanSessionStage() {
  const s = useTween({ frame: OFF, t: Number(STILLS[0]) });
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { frame: ON, duration: DUR.grow, ease: SETTLE });
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { t: STILLS[1], duration: DUR.gather, ease: "none" });
      beat(1);
      tl.to(s, { t: STILLS[2], duration: DUR.scale, ease: "none" });
      beat(2);
      tl.to(s, { t: STILLS[3], duration: DUR.gather, ease: "none" });
      beat(3);
      tl.to(s, { t: STILLS[4], duration: DUR.bloom, ease: "none" });
      beat(4);
    },
  });

  const scene = sceneAt(SESSION, s.t);
  const status = claudeStatus(SESSION, s.t);
  const reviewing = scene.step >= 6;
  const busy = scene.claudeActive && !status.startsWith("Idle");
  const cards = SESSION.delegates.map((d, i) => {
    const now = scene.delegates[i];
    if (!now) throw new Error(`No foreman session scene for delegate ${d.name}`);
    const latest = now.latest;
    return {
      name: d.name,
      model: d.model,
      worktree: worktreeOf(d.name),
      branch: d.branch,
      y: agentY(i),
      color: stateInk[now.state],
      word: now.state,
      queued: now.state === "queued",
      lit: now.state !== "queued" && now.state !== "archived",
      commands: now.commands,
      counts: `${now.commands} commands · ${now.files} files`,
      latest: !latest
        ? ""
        : latest.kind === "command"
          ? `$ ${short(latest.command, 40)}`
          : `wrote ${short(latest.paths[0]?.split("/").pop() ?? "", 34)}`,
    };
  });
  const packets = scene.packets.map((p) => {
    const ambient = p.label === "events";
    return {
      key: `${p.label}-${p.from}-${p.to}-${ambient ? "a" : p.at}`,
      points: route(p.from, p.to),
      progress: p.progress > 0.98 ? ON : p.progress,
      color: p.attention ? HELD : p.label === "done" ? PASSED : ambient ? WORK : PLUMB,
      radius: ambient ? 5 : 9,
      // The daemon sends Claude nothing: the background wait returns.
      label: ambient ? "" : p.to === "claude" ? `wait returns · ${p.label}` : p.label,
    };
  });
  const asked = s.t > QUESTION;
  const answered = s.t >= ANSWER;
  const questionTag = answered
    ? `${SESSION.question.id} answered after ${ANSWER_DELAY_S} s`
    : `Held · ${SESSION.question.id} · ${SESSION.question.run}`;

  return (
    <StoryStage
      beats={beats}
      click={clicks}
      stage={
        <>
          <g style={{ opacity: s.frame }}>
            <path className="sf-wire" d={polyline(CLAUDE_TO_BOARD)} />
            {cards.map((c, i) => (
              <path
                key={c.name}
                className="sf-wire"
                d={polyline(boardToAgent(i))}
                style={{ opacity: c.queued ? DIM : ON }}
              />
            ))}
            <g style={{ color: PINK }}>
              <rect
                className={`sf-box${busy ? " is-lit" : ""}`}
                x={CLAUDE.x}
                y={CLAUDE.y}
                width={CLAUDE.w}
                height={CLAUDE.h}
              />
              <text className="sf-name" x={CLAUDE.x + 24} y={CLAUDE.y + 48}>
                Claude Code
              </text>
              <text
                className="sf-mono is-small"
                x={CLAUDE.x + 24}
                y={CLAUDE.y + 86}
                style={{ fill: PINK }}
              >
                {status}
              </text>
              {contracts.map((c) => (
                <g key={c.file} style={{ opacity: s.t < c.sent ? ON : DIM }}>
                  <rect
                    className="sf-box is-well"
                    x={CONTRACT.x}
                    y={c.y}
                    width={CONTRACT.w}
                    height={CONTRACT.h}
                  />
                  <text className="sf-mono" x={CONTRACT.x + 16} y={c.y + 34}>
                    {c.file}
                  </text>
                  <text className="sf-mono is-small" x={CONTRACT.x + 16} y={c.y + 64}>
                    {c.line}
                  </text>
                </g>
              ))}
              <text
                className="sf-pixel is-small"
                x={CLAUDE.x + CLAUDE.w / 2}
                y={CLAUDE.y + CLAUDE.h - 18}
                textAnchor="middle"
                style={{ opacity: reviewing ? ON : OFF, fill: PASSED }}
              >
                review · test · commit
              </text>
            </g>
            {cards.map((c) => (
              <g key={c.name} style={{ opacity: c.queued ? DIM : ON, color: c.color }}>
                <rect
                  className={`sf-box${c.lit ? " is-lit" : ""}`}
                  x={AGENT.x}
                  y={c.y}
                  width={AGENT.w}
                  height={AGENT.h}
                />
                <text className="sf-name" x={AGENT.x + 24} y={c.y + 46}>
                  {c.name}
                </text>
                <text
                  className="sf-pixel is-small"
                  x={AGENT.x + AGENT.w - 24}
                  y={c.y + 42}
                  textAnchor="end"
                  style={{ fill: c.color }}
                >
                  {c.word}
                </text>
                <text className="sf-mono" x={AGENT.x + 24} y={c.y + 86}>
                  {c.worktree}
                </text>
                <text className="sf-mono is-small" x={AGENT.x + 24} y={c.y + 116}>
                  branch {c.branch} · {c.model}
                </text>
                <g style={{ opacity: c.queued ? OFF : ON }}>
                  <line
                    x1={AGENT.x + 24}
                    x2={AGENT.x + AGENT.w - 24}
                    y1={c.y + 138}
                    y2={c.y + 138}
                    className="sf-wire"
                  />
                  <text
                    className="sf-mono"
                    x={AGENT.x + 24}
                    y={c.y + 174}
                    style={{ fill: c.color }}
                  >
                    {c.counts}
                  </text>
                  <text className="sf-mono is-small" x={AGENT.x + 24} y={c.y + 208}>
                    {c.latest}
                  </text>
                </g>
              </g>
            ))}
          </g>
          <CrtFrame
            x={BOARD.x}
            y={BOARD.y}
            width={BOARD.w}
            height={BOARD.h}
            tag={`Recorded ${RECORDED} · timeline shortened`}
            progress={s.frame}
          >
            <text className="sf-name" x={SCREEN_X} y={BOARD.y + 58}>
              foreman daemon
            </text>
            {cards.map((r, i) => (
              <g key={r.name}>
                <rect x={SCREEN_X} y={rowY(i) - 15} width="16" height="16" rx="2" fill={r.color} />
                <text className="sf-mono" x={SCREEN_X + 30} y={rowY(i)}>
                  {r.name}
                </text>
                <text className="sf-mono" x={SCREEN_X + 250} y={rowY(i)} style={{ fill: r.color }}>
                  {r.word}
                </text>
                <text
                  className="sf-mono is-small"
                  x={BOARD.x + BOARD.w - 38}
                  y={rowY(i)}
                  textAnchor="end"
                >
                  {r.queued ? "" : `${r.commands} cmds`}
                </text>
              </g>
            ))}
            <g style={{ opacity: asked ? ON : OFF }}>
              <text
                className="sf-pixel is-small"
                x={SCREEN_X}
                y={BOARD.y + 250}
                style={{ fill: answered ? PASSED : HELD }}
              >
                {questionTag}
              </text>
              {QUESTION_LINES.map((line, i) => (
                <text
                  key={line}
                  className="sf-term"
                  x={SCREEN_X}
                  y={BOARD.y + 288 + i * 30}
                  style={{ fill: HELD, fontSize: "27px", opacity: answered ? DIM : ON }}
                >
                  {line}
                </text>
              ))}
            </g>
          </CrtFrame>
          <g style={{ opacity: s.frame }}>
            {packets.map((p) => (
              <PacketPath
                key={p.key}
                points={p.points}
                progress={p.progress}
                color={p.color}
                radius={p.radius}
                label={p.label}
              />
            ))}
          </g>
        </>
      }
      overlay={
        <>
          <h2 className="od-story-head">foreman runs each Codex task in its own worktree.</h2>
          <NamePlate id="foreman" />
          <ThreadRail current="foreman" />
        </>
      }
      card={<StoryCard anchor="left" hue="rose" lead={copy.lead} body={copy.body} />}
    />
  );
}
