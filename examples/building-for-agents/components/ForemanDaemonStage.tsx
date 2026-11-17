import {
  clamp01,
  DRAW,
  DUR,
  SETTLE,
  StoryCard,
  StoryStage,
  stagger,
  useStage,
} from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import {
  CODEX_ARGS,
  CODEX_COMMAND,
  CODEX_VERSION,
  IDLE_EXIT_MIN,
  REQUEST_FRAME,
  RESPONSE_FRAME,
  RPC_METHODS,
  SCHEMA_FILES,
  SOCKET_PATH,
  SRC_LINES,
  TARGETS,
  TREE,
} from "../data/13-foreman-daemon";
import { DATA, DIM, WAIT as LOCKED, OFF, ON, PINK, PLUMB, type Pt, polyline } from "./design";
import { EvidenceTag } from "./EvidenceTag";
import { NamePlate } from "./NamePlate";
import { PacketPath } from "./PacketPath";
import { RepoTree } from "./RepoTree";
import { ThreadRail } from "./ThreadRail";

const COPY = [
  {
    lead: "The CLI exits and the daemon keeps running.",
    body: `The daemon supervises every run and exits after ${IDLE_EXIT_MIN} idle minutes.`,
  },
  {
    lead: "The CLI and daemon use a Unix socket.",
    body: "Each message is one line of JSON. The CLI starts the daemon when the socket is missing.",
  },
  {
    lead: "One codex app-server process runs every delegate.",
    body: "The daemon sends it JSON-RPC over stdio and routes replies by thread id.",
  },
  {
    lead: "foreman checks the Codex protocol by hash.",
    body: `The hash covers ${SCHEMA_FILES} schema files from Codex ${CODEX_VERSION}. foreman doctor prints whether it still matches.`,
  },
];

const STEPS = [
  { focus: "commands", lit: ["daemon"] },
  { focus: "daemon", lit: ["schemas"] },
  { focus: "supervisor", lit: ["codex"] },
  { focus: "codex", lit: [] },
] as const;

const MID = 370;
const CLAUDE = { x: 110, y: 300, w: 210, h: 140 };
const CLI = { x: 360, y: 300, w: 170, h: 140 };
const SOCK = { x: 575, y: 320, w: 160, h: 100 };
const DAEMON = { x: 785, y: 280, w: 200, h: 180 };
const SUP = { x: DAEMON.x + 20, y: DAEMON.y + 64, w: DAEMON.w - 40, h: 56 };
const CODEX = { x: 1040, y: 300, w: 250, h: 140 };
const LANE = { x: 1100, y: 488, w: 190, h: 44, gap: 12, bus: 1070 };
const PIN = { x: 930, y: 668, w: 470, h: 44 };
const BIN = { x: 275, y: 590, w: 160, h: 40, gapX: 10, gapY: 10 };
const TREE_BOX = { x: 1340, y: 200, width: 470 };
const SOCK_MID = SOCK.x + SOCK.w / 2;

const laneY = (i: number) => LANE.y + i * (LANE.h + LANE.gap);
const WIRES: Pt[][] = [
  [
    [CLAUDE.x + CLAUDE.w, MID],
    [CLI.x, MID],
  ],
  [
    [CLI.x + CLI.w, MID],
    [SOCK.x, MID],
  ],
  [
    [SOCK.x + SOCK.w, MID],
    [DAEMON.x, MID],
  ],
  [
    [DAEMON.x + DAEMON.w, MID],
    [CODEX.x, MID],
  ],
];
const CALL: Pt[] = [
  [CLAUDE.x + CLAUDE.w, MID],
  [DAEMON.x, MID],
];
const REQUEST: Pt[] = [
  [CLI.x + CLI.w, MID],
  [DAEMON.x, MID],
];
const RESPONSE: Pt[] = [...REQUEST].reverse();
const RPC: Pt[] = [
  [DAEMON.x + DAEMON.w, MID],
  [CODEX.x, MID],
];
const toLane = (i: number): Pt[] => [
  [LANE.bus, CODEX.y + CODEX.h],
  [LANE.bus, laneY(i) + LANE.h / 2],
  [LANE.x, laneY(i) + LANE.h / 2],
];
const lanes = [0, 1, 2].map((i) => ({
  i,
  y: laneY(i),
  path: toLane(i),
  name: `thread ${i + 1}`,
}));
const bins = TARGETS.map((name, i) => ({
  name,
  x: BIN.x + (i % 2) * (BIN.w + BIN.gapX),
  y: BIN.y + Math.floor(i / 2) * (BIN.h + BIN.gapY),
}));
const TO_BINS: Pt[] = [
  [CLI.x + CLI.w / 2, CLI.y + CLI.h],
  [CLI.x + CLI.w / 2, BIN.y],
];

const root = `claude-codex/src · ${SRC_LINES.toLocaleString("en-US")} lines`;
const pinText = `Codex ${CODEX_VERSION} · ${SCHEMA_FILES} schema files, hashed`;

export function ForemanDaemonStage() {
  const s = useTween({
    frame: OFF,
    call: OFF,
    sock: OFF,
    request: OFF,
    response: OFF,
    codex: OFF,
    rpc: OFF,
    lanes: OFF,
    pin: OFF,
    bins: OFF,
  });
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { frame: ON, duration: DUR.grow, ease: SETTLE });
      tl.to(s, { call: ON, duration: DUR.scale, ease: DRAW });
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { sock: ON, duration: DUR.color, ease: SETTLE });
      tl.to(s, { request: ON, duration: DUR.grow, ease: DRAW });
      tl.to(s, { response: ON, duration: DUR.grow, ease: DRAW });
      beat(1);
      tl.to(s, { codex: ON, duration: DUR.color, ease: SETTLE });
      tl.to(s, { rpc: ON, duration: DUR.draw, ease: DRAW });
      tl.to(s, { lanes: ON, duration: DUR.grow, ease: DRAW });
      beat(2);
      tl.to(s, { pin: ON, duration: DUR.card, ease: SETTLE });
      tl.to(s, { bins: ON, duration: DUR.grow, ease: SETTLE });
      beat(3);
    },
  });

  const step = STEPS[Math.min(Math.max(clicks, 0), STEPS.length - 1)];
  if (!step) throw new Error(`No foreman daemon step for click ${clicks}`);
  const calling = s.call > OFF && s.call < ON;
  const cliOpacity = calling ? ON : DIM + (ON - DIM) * clamp01(s.sock - s.codex + s.pin);
  const daemonHot = s.sock < 0.5;
  const sockHot = s.sock > 0.5 && s.codex < 0.5;
  const codexHot = s.codex > 0.5 && s.pin < 0.5;
  const sockNotes = s.sock * (ON - (ON - DIM) * s.codex);
  const methods = s.codex * (ON - (ON - DIM) * s.pin);
  const laneProgress = (i: number) => stagger(s.lanes, i, lanes.length, 0.2);
  const binProgress = (i: number) => stagger(s.bins, i, bins.length, 0.15);

  return (
    <StoryStage
      beats={beats}
      click={clicks}
      stage={
        <g style={{ opacity: s.frame }}>
          {WIRES.map((w) => (
            <path key={polyline(w)} className="sf-wire" d={polyline(w)} />
          ))}
          <rect className="sf-box" x={CLAUDE.x} y={CLAUDE.y} width={CLAUDE.w} height={CLAUDE.h} />
          <text
            className="sf-name"
            x={CLAUDE.x + CLAUDE.w / 2}
            y={CLAUDE.y + 64}
            textAnchor="middle"
          >
            Claude Code
          </text>
          <text
            className="sf-mono is-small"
            x={CLAUDE.x + CLAUDE.w / 2}
            y={CLAUDE.y + 100}
            textAnchor="middle"
          >
            runs a command
          </text>
          <g style={{ opacity: cliOpacity, color: PINK }}>
            <rect
              className={`sf-box${calling ? " is-lit" : ""}`}
              x={CLI.x}
              y={CLI.y}
              width={CLI.w}
              height={CLI.h}
            />
            <text className="sf-mono" x={CLI.x + CLI.w / 2} y={CLI.y + 64} textAnchor="middle">
              foreman
            </text>
            <text
              className="sf-mono is-small"
              x={CLI.x + CLI.w / 2}
              y={CLI.y + 100}
              textAnchor="middle"
            >
              the CLI
            </text>
          </g>
          <g style={{ color: PLUMB }}>
            <rect
              className={`sf-box is-well${sockHot ? " is-lit" : ""}`}
              x={SOCK.x}
              y={SOCK.y}
              width={SOCK.w}
              height={SOCK.h}
            />
            <text
              className="sf-mono"
              x={SOCK_MID}
              y={SOCK.y + 58}
              textAnchor="middle"
              style={{ fill: sockHot ? PLUMB : undefined }}
            >
              Unix socket
            </text>
          </g>
          <g style={{ opacity: sockNotes }}>
            <text
              className="sf-mono is-small"
              x={SOCK_MID}
              y={SOCK.y + SOCK.h + 66}
              textAnchor="middle"
              style={{ fill: PLUMB }}
            >
              {SOCKET_PATH}
            </text>
            <text
              className="sf-mono is-small"
              x={SOCK_MID}
              y={SOCK.y + SOCK.h + 104}
              textAnchor="middle"
            >
              request {REQUEST_FRAME}
            </text>
            <text
              className="sf-mono is-small"
              x={SOCK_MID}
              y={SOCK.y + SOCK.h + 132}
              textAnchor="middle"
            >
              response {RESPONSE_FRAME}
            </text>
          </g>
          <g style={{ color: PINK }}>
            <rect
              className={`sf-box${daemonHot ? " is-lit" : ""}`}
              x={DAEMON.x}
              y={DAEMON.y}
              width={DAEMON.w}
              height={DAEMON.h}
            />
            <text
              className="sf-name"
              x={DAEMON.x + DAEMON.w / 2}
              y={DAEMON.y + 44}
              textAnchor="middle"
            >
              daemon
            </text>
            <rect className="sf-box is-well" x={SUP.x} y={SUP.y} width={SUP.w} height={SUP.h} />
            <text
              className="sf-mono"
              x={DAEMON.x + DAEMON.w / 2}
              y={SUP.y + 36}
              textAnchor="middle"
            >
              supervisor
            </text>
            <text
              className="sf-mono is-small"
              x={DAEMON.x + DAEMON.w / 2}
              y={DAEMON.y + 156}
              textAnchor="middle"
            >
              keeps running
            </text>
          </g>
          <g style={{ color: DATA }}>
            <rect
              className={`sf-box${codexHot ? " is-lit" : ""}`}
              x={CODEX.x}
              y={CODEX.y}
              width={CODEX.w}
              height={CODEX.h}
            />
            <text
              className="sf-mono"
              x={CODEX.x + CODEX.w / 2}
              y={CODEX.y + 56}
              textAnchor="middle"
            >
              {CODEX_COMMAND}
            </text>
            <text
              className="sf-mono is-small"
              x={CODEX.x + CODEX.w / 2}
              y={CODEX.y + 92}
              textAnchor="middle"
            >
              {CODEX_ARGS}
            </text>
            {lanes.map((lane) => (
              <g key={lane.i} style={{ opacity: DIM + (ON - DIM) * laneProgress(lane.i) }}>
                <path className="sf-wire" d={polyline(lane.path)} />
                <rect
                  className={`sf-box${codexHot && laneProgress(lane.i) > 0.5 ? " is-lit" : ""}`}
                  x={LANE.x}
                  y={lane.y}
                  width={LANE.w}
                  height={LANE.h}
                />
                <text
                  className="sf-mono is-small"
                  x={LANE.x + LANE.w / 2}
                  y={lane.y + 29}
                  textAnchor="middle"
                >
                  {lane.name}
                </text>
              </g>
            ))}
          </g>
          <g style={{ opacity: methods }}>
            {RPC_METHODS.map((m, i) => (
              <text
                key={m}
                className="sf-mono is-small"
                x={CODEX.x + 4}
                y={CODEX.y - 72 + i * 27}
                style={{ fill: DATA }}
              >
                {m}
              </text>
            ))}
          </g>
          <g style={{ opacity: s.pin, color: LOCKED }}>
            <rect className="sf-box is-lit" x={PIN.x} y={PIN.y} width={PIN.w} height={PIN.h} />
            <text
              className="sf-mono is-small"
              x={PIN.x + PIN.w / 2}
              y={PIN.y + 29}
              textAnchor="middle"
              style={{ fill: LOCKED }}
            >
              {pinText}
            </text>
          </g>
          <path
            className="sf-wire"
            d={polyline(TO_BINS)}
            strokeDasharray="4 8"
            style={{ opacity: s.bins }}
          />
          {bins.map((b, i) => (
            <g
              key={b.name}
              style={{
                opacity: binProgress(i),
                transform: `translate(0, ${(ON - binProgress(i)) * -12}px)`,
              }}
            >
              <rect className="sf-box is-well" x={b.x} y={b.y} width={BIN.w} height={BIN.h} />
              <text
                className="sf-mono is-small"
                x={b.x + BIN.w / 2}
                y={b.y + 27}
                textAnchor="middle"
              >
                {b.name}
              </text>
            </g>
          ))}
          <PacketPath points={CALL} progress={s.call} color={PINK} />
          <PacketPath points={REQUEST} progress={s.request} color={PLUMB} label={REQUEST_FRAME} />
          <PacketPath
            points={RESPONSE}
            progress={s.response}
            color={PLUMB}
            label={RESPONSE_FRAME}
          />
          <PacketPath points={RPC} progress={s.rpc} color={DATA} />
          {lanes.map((lane) => (
            <PacketPath
              key={lane.i}
              points={lane.path}
              progress={laneProgress(lane.i)}
              color={DATA}
              radius={7}
            />
          ))}
        </g>
      }
      overlay={
        <>
          <h2 className="od-story-head">foreman is a short-lived CLI and a daemon.</h2>
          <NamePlate id="foreman" chipOnly />
          <EvidenceTag kind="schematic" x={CLAUDE.x} y={206} progress={s.frame} />
          <RepoTree
            nodes={TREE}
            lit={step.lit}
            focus={step.focus}
            reveal={s.frame}
            {...TREE_BOX}
            root={root}
            repoDir="~/Projects/claude-codex/src"
          />
          <ThreadRail current="foreman" />
        </>
      }
      card={<StoryCard anchor="left" hue="rose" lead={copy.lead} body={copy.body} />}
    />
  );
}
