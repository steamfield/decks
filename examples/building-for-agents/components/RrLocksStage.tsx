import { useSlide } from "@steamfield/decks";
import { DUR, SETTLE, StoryCard, StoryStage, useStage } from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import {
  AGENT_1_TEST_START,
  AGENT_2_RETRY_END,
  AGENT_2_TEST_START,
  AGENT_2_WAITING_AT,
  AGENT_3_RETRY_START,
  AGENT_4_ARRIVAL,
  AGENT_COUNT,
  type ChipView,
  FLOW_HOSTS,
  FLOW_RUNS,
  HOST_COUNT,
  type HostView,
  PARSERS,
  POLL_MS,
  RESULT_HOT,
  RESULT_LINES,
  RUN,
  type Scene,
  SEGMENTS,
  type Segment,
  STILLS,
  sceneAt,
  WAITING_EVENT,
} from "../data/16-rr-locks";
import { DATA, DIM, GREEN, NEUTRAL, OFF, ON, PINK, PLUMB, QUIET, WAIT } from "./design";
import { EvidenceTag } from "./EvidenceTag";
import { NamePlate } from "./NamePlate";
import styles from "./RrLocksStage.module.css";
import { TermPane } from "./TermPane";
import { ThreadRail } from "./ThreadRail";

const COPY = [
  {
    lead: "Each rr call is a separate process.",
    body: "The only state they share is a lock on each host. rr has no server.",
  },
  {
    lead: "A parallel task locks every host.",
    body: "Its shards are the tasks the config lists under parallel.",
  },
  {
    lead: "Files sync before the tests start.",
    body: "rsync copies the files to each host, then SSH runs that host's subtask.",
  },
  {
    lead: "A run waits when every host is locked.",
    body: "Agents 2 and 3 try the hosts in config order, then wait on the laptop.",
  },
  {
    lead: "A failed retry names the lock holder.",
    body: `It retries every ${POLL_MS / 1000} seconds and prints a waiting event with the command that holds the lock.`,
  },
  {
    lead: "A retry locks the first free host.",
    body: "By default each git worktree syncs to its own directory on the host, so agents' files stay separate.",
  },
  {
    lead: "Agent 4 locks a host without waiting.",
    body: "Its process tries the occupied hosts first, then locks the next host in config order.",
  },
  {
    lead: "The result event gives file and line.",
    body: `rr parses ${PARSERS.slice(0, -1).join(", ")} and ${PARSERS.at(-1)} output and reports each failed test's file, line and message.`,
  },
];

type Rect = { x: number; y: number; w: number; h: number };
type Point = { x: number; y: number };
type Port = Point & { dx: number; dy: number };

const LAPTOP: Rect = { x: 110, y: 226, w: 960, h: 454 };
const ROW = { y: 268, pitch: 102, h: 92 };
const AGENT = { x: 126, w: 316 };
const WAITING: Rect = { x: 456, y: 262, w: 290, h: 410 };
const CHIP = { x: 782, slide: 316, w: 270, h: 64, top: 14 };
const HOST = { x: 1400, y: 258, w: 410, h: 131, pitch: 141, pad: 18 };
const LABEL_Y = 214;
const HEAD_Y = 252;
const TAG_Y = 178;
const STRIP: Rect = { x: 840, y: 686, w: 970, h: 272 };
const STRIP_TYPE = 26;
const MONO_SMALL_ADVANCE = 10.8;
const WIRE = 0.4;
const DOT = 4;
const PID_BASE = 48210;
const PID_STEP = 37;

const row = (i: number) => ROW.y + i * ROW.pitch;
const agentBox = (i: number): Rect => ({ x: AGENT.x, y: row(i), w: AGENT.w, h: ROW.h });
const chipBox = (i: number, slot: number): Rect => ({
  x: CHIP.x - slot * CHIP.slide,
  y: row(i) + CHIP.top,
  w: CHIP.w,
  h: CHIP.h,
});
const hostBox = (i: number): Rect => ({
  x: HOST.x,
  y: HOST.y + i * HOST.pitch,
  w: HOST.w,
  h: HOST.h,
});
const chipPort = (box: Rect): Port => ({ x: box.x + box.w, y: box.y + box.h / 2, dx: 1, dy: 0 });
const hostPort = (i: number): Port => ({
  x: HOST.x,
  y: HOST.y + i * HOST.pitch + HOST.h / 2,
  dx: -1,
  dy: 0,
});

function curve(a: Port, b: Port) {
  const reach = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) * 0.5;
  const c1 = { x: a.x + a.dx * reach, y: a.y + a.dy * reach };
  const c2 = { x: b.x + b.dx * reach, y: b.y + b.dy * reach };
  const at = (u: number): Point => {
    const v = 1 - u;
    return {
      x: v * v * v * a.x + 3 * v * v * u * c1.x + 3 * v * u * u * c2.x + u * u * u * b.x,
      y: v * v * v * a.y + 3 * v * v * u * c1.y + 3 * v * u * u * c2.y + u * u * u * b.y,
    };
  };
  return { d: `M${a.x} ${a.y}C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.x} ${b.y}`, at };
}

const LOCK_SCALE = 1.7;
const shackle = (locked: boolean) => (locked ? "M3 6V4a3 3 0 0 1 6 0v2" : "M3 6V4a3 3 0 0 1 6 0");
const lockAt = (x: number, y: number) => `translate(${x} ${y}) scale(${LOCK_SCALE})`;

const CODE = "var(--od-text-secondary)";

type Tone = { text: string; color: string };

const pill = (at: Point, text: string, color: string) => {
  const w = text.length * MONO_SMALL_ADVANCE + 20;
  return { x: at.x - w / 2, y: at.y - 19, w, h: 30, tx: at.x, ty: at.y + 3, text, color };
};

function hostView(view: HostView, i: number) {
  const holder = view.holder === undefined ? undefined : FLOW_RUNS[view.holder];
  const phase: Tone =
    view.phase === "sync"
      ? { text: "rsync", color: PLUMB }
      : view.phase === "test"
        ? { text: `tests ${Math.round(view.progress * 100)}%`, color: DATA }
        : view.phase === "hold"
          ? { text: "done, lock held", color: QUIET }
          : { text: "idle", color: QUIET };
  return {
    name: FLOW_HOSTS[i],
    box: hostBox(i),
    locked: !!holder,
    who: holder ? `${holder.agent}${view.task ? ` · ${view.task}` : ""}` : "free",
    phase,
    fill:
      view.phase === "sync" || view.phase === "test"
        ? Math.min(1, view.progress)
        : view.phase === "hold"
          ? 1
          : 0,
    fillColor: view.phase === "sync" ? PLUMB : view.phase === "test" ? DATA : NEUTRAL,
  };
}

export function RrLocksStage() {
  const { renderContext } = useSlide();
  const s = useTween({
    frame: OFF,
    t: STILLS[0],
    dim: OFF,
    strip: OFF,
    lines: OFF,
    waiting: OFF,
    a0: ON,
    a1: ON,
    a2: ON,
    a3: ON,
    h0: ON,
    h1: ON,
    h2: ON,
  });
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { frame: ON, duration: DUR.grow, ease: SETTLE });
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { a1: DIM, a2: DIM, a3: DIM, duration: DUR.opacity, ease: SETTLE });
      tl.to(s, { t: STILLS[1], duration: DUR.gather, ease: "none" });
      beat(1);

      tl.to(s, { a0: ON, duration: DUR.opacity, ease: SETTLE });
      tl.to(s, { t: AGENT_1_TEST_START, duration: DUR.scale, ease: "none" });
      tl.to(s, { t: STILLS[2], duration: DUR.grow, ease: "none" });
      beat(2);

      tl.to(s, { a0: DIM, a1: ON, duration: DUR.opacity, ease: SETTLE });
      tl.to(s, { t: AGENT_2_WAITING_AT, duration: DUR.gather + DUR.card, ease: "none" });
      tl.to(s, { a1: DIM, a2: ON, duration: DUR.eraseHold, ease: SETTLE });
      // The fixed arrivals overlap. The second move uses the approved merged-beat exception.
      tl.to(s, { t: STILLS[3], duration: DUR.scale + DUR.opacity, ease: "none" });
      beat(3);

      tl.to(s, { a1: ON, waiting: ON, duration: DUR.opacity, ease: SETTLE });
      tl.to(s, { t: AGENT_2_RETRY_END, duration: DUR.morph, ease: "none" });
      tl.to(s, { t: STILLS[4], duration: DUR.gather, ease: "none" });
      beat(4);

      tl.to(s, { a0: ON, a2: DIM, waiting: OFF, duration: DUR.opacity, ease: SETTLE });
      tl.to(s, { t: AGENT_2_TEST_START, duration: DUR.gather, ease: "none" });
      tl.to(s, { a0: DIM, a1: DIM, a2: ON, h2: DIM, duration: DUR.eraseHold, ease: SETTLE });
      tl.to(s, { t: AGENT_3_RETRY_START, duration: DUR.opacity, ease: "none" });
      tl.to(s, { t: STILLS[5], duration: DUR.scale + DUR.opacity, ease: "none" });
      beat(5);

      tl.to(s, { a2: DIM, a3: ON, h2: ON, duration: DUR.opacity, ease: SETTLE });
      tl.to(s, { t: AGENT_4_ARRIVAL, duration: DUR.grow, ease: "none" });
      tl.to(s, { t: STILLS[6], duration: DUR.trace, ease: "none" });
      beat(6);

      tl.to(s, { dim: ON, a0: ON, a1: ON, a2: ON, duration: DUR.color, ease: SETTLE });
      tl.to(s, { strip: ON, duration: DUR.card, ease: SETTLE }, "<");
      tl.to(s, { lines: RESULT_LINES.length, duration: DUR.gather, ease: "none" });
      beat(7);
    },
  });
  const scene: Scene = sceneAt(SEGMENTS, FLOW_RUNS, HOST_COUNT, s.t);
  const diagram = s.frame * (ON - s.dim * (ON - DIM));
  const agentFocus = [s.a0, s.a1, s.a2, s.a3];
  const hostFocus = [s.h0, s.h1, s.h2];
  const agents = FLOW_RUNS.map((run, i) => {
    const result = scene.results[i];
    const chip = scene.chips[i];
    if (!chip) throw new Error(`No rr chip for agent ${i}`);
    const status: Tone = result
      ? { text: result.ok ? result.text : `✕ ${result.text}`, color: result.ok ? GREEN : PINK }
      : chip.visible
        ? { text: "waiting on rr", color: QUIET }
        : { text: "writing code", color: QUIET };
    return { run, box: agentBox(i), status, lit: result ? (result.ok ? GREEN : PINK) : "" };
  });

  function chipStatus(i: number, chip: ChipView): Tone {
    const run = FLOW_RUNS[i];
    const held = scene.hosts.flatMap((host, h) => (host.holder === i ? [{ host, h }] : []));
    if (chip.state === "done")
      return run?.result.ok ? { text: "exit 0", color: GREEN } : { text: "exit 1", color: PINK };
    if (chip.state === "waiting" && chip.retryIn !== undefined) {
      return { text: `retry in ${(chip.retryIn / 1000).toFixed(1)}s`, color: WAIT };
    }
    const probes = scene.active.filter(
      (a) => a.segment.run === i && a.segment.kind.startsWith("probe"),
    );
    const probe = probes[0];
    if (probes.length > 1) return { text: `locking ${probes.length} hosts`, color: QUIET };
    if (probe) return { text: `trying ${FLOW_HOSTS[probe.segment.host]}`, color: QUIET };
    if (held.length > 1) {
      const syncing = held.some(({ host }) => host.phase === "sync");
      return {
        text: `${held.length} subtasks ${syncing ? "syncing" : "running"}`,
        color: syncing ? PLUMB : DATA,
      };
    }
    const first = held[0];
    if (first) {
      const name = FLOW_HOSTS[first.h];
      return first.host.phase === "sync"
        ? { text: `rsync to ${name}`, color: PLUMB }
        : { text: `running on ${name}`, color: DATA };
    }
    return { text: "collecting results", color: QUIET };
  }

  const chips = scene.chips.flatMap((chip, i) => {
    if (!chip.visible) return [];
    const box = chipBox(i, chip.slot);
    const agent = agentBox(i);
    const waiting = chip.state === "waiting";
    return [
      {
        i,
        box,
        pid: `pid ${PID_BASE + i * PID_STEP}`,
        status: chipStatus(i, chip),
        stroke: waiting ? WAIT : chip.state === "done" ? NEUTRAL : PINK,
        ring: waiting && chip.retryIn !== undefined ? 1 - chip.retryIn / POLL_MS : undefined,
        enter: Math.min(1, (s.t - (FLOW_RUNS[i]?.arrive ?? 0)) / 300),
        call: `M${agent.x + agent.w} ${agent.y + agent.h / 2}H${box.x}`,
      },
    ];
  });
  const hosts = scene.hosts.map(hostView);

  function link(segment: Segment, at: number, label: boolean) {
    const slot = scene.chips[segment.run]?.slot ?? 0;
    const { d, at: point } = curve(chipPort(chipBox(segment.run, slot)), hostPort(segment.host));
    const ok = FLOW_RUNS[segment.run]?.result.ok ?? true;
    const key = `${segment.run}-${segment.host}-${segment.kind}-${segment.start}`;
    if (segment.kind === "probe-ok" || segment.kind === "probe-locked") {
      const head = point(at);
      return {
        key,
        d,
        color: QUIET,
        wire: ON,
        draw: at,
        dots: [],
        head,
        pill:
          label && at > 0.15 ? pill(point(Math.min(at, 0.5) * 0.6), "try lock", QUIET) : undefined,
      };
    }
    if (segment.kind === "result") {
      const dot = point(1 - at);
      const color = ok ? GREEN : PINK;
      return {
        key,
        d,
        color,
        wire: 0.6 * (1 - at),
        draw: 1,
        dots: [{ ...dot, slot: 0 }],
        head: undefined,
        pill: label
          ? pill({ x: dot.x, y: dot.y - 28 }, ok ? "exit 0" : "exit 1", color)
          : undefined,
      };
    }
    const sync = segment.kind === "sync";
    const period = sync ? 700 : 1100;
    const count = sync ? 4 : 3;
    const color = sync ? PLUMB : DATA;
    return {
      key,
      d,
      color,
      wire: WIRE,
      draw: 1,
      dots: Array.from({ length: count }, (_, k) => {
        const u = (s.t / period + k / count) % 1;
        return { ...point(sync ? u : 1 - u), slot: k };
      }),
      head: undefined,
      pill: label ? pill(point(0.5), sync ? "rsync" : "output", color) : undefined,
    };
  }

  const labelled = new Set<string>();
  const links = scene.active.map(({ segment, at }) => {
    const kind = `${segment.run}-${segment.kind.startsWith("probe") ? "probe" : segment.kind}`;
    const label = !labelled.has(kind);
    labelled.add(kind);
    return { ...link(segment, at, label), opacity: agentFocus[segment.run] };
  });
  const tags = scene.tags.map((tag) => {
    const port = hostPort(tag.host);
    const text = tag.ok ? "lock taken" : "locked";
    const at = { x: port.x - (text.length * MONO_SMALL_ADVANCE + 20) / 2 - 14, y: port.y - 30 };
    return {
      key: `${tag.run}-${tag.host}-${tag.ok}`,
      fade: Math.min(1, (tag.ms - tag.age) / 200),
      opacity: agentFocus[tag.run],
      pill: pill(at, text, tag.ok ? GREEN : WAIT),
    };
  });
  const anyone = scene.chips.some(
    (chip) => chip.visible && chip.state === "waiting" && chip.slot > 0.99,
  );
  const waitingNote = { box: chipBox(AGENT_COUNT - 1, 1), opacity: anyone ? s.waiting : OFF };

  return (
    <StoryStage
      beats={beats}
      click={clicks}
      stage={
        <g style={{ opacity: diagram }}>
          <text className={`rr-cap ${styles["rr-cap"]}`} x={LAPTOP.x} y={LABEL_Y}>
            Laptop, one rr process per call
          </text>
          <text className={`rr-cap ${styles["rr-cap"]}`} x={HOST.x} y={HOST.y - 14}>
            Hosts, tried in config order
          </text>
          <text
            className="sf-mono is-small"
            x={(LAPTOP.x + LAPTOP.w + HOST.x) / 2}
            y={HOST.y - 14}
            textAnchor="middle"
          >
            SSH
          </text>
          <rect className="sf-box" x={LAPTOP.x} y={LAPTOP.y} width={LAPTOP.w} height={LAPTOP.h} />
          <text className="sf-mono is-small" x={AGENT.x} y={HEAD_Y}>
            agents
          </text>
          <text
            className="sf-mono is-small"
            x={WAITING.x + WAITING.w / 2}
            y={HEAD_Y}
            textAnchor="middle"
            style={{ fill: WAIT }}
          >
            waiting for a host
          </text>
          <text className="sf-mono is-small" x={CHIP.x + CHIP.w / 2} y={HEAD_Y} textAnchor="middle">
            rr running
          </text>
          <rect
            className={`rr-waiting ${styles["rr-waiting"]}`}
            x={WAITING.x}
            y={WAITING.y}
            width={WAITING.w}
            height={WAITING.h}
            style={{ stroke: WAIT, opacity: DIM }}
          />
          {hosts.map((host, i) => (
            <g
              key={host.name}
              style={{ color: host.locked ? WAIT : NEUTRAL, opacity: hostFocus[i] }}
            >
              <rect
                className={`sf-box is-well${host.locked ? " is-lit" : ""}`}
                x={host.box.x}
                y={host.box.y}
                width={host.box.w}
                height={host.box.h}
              />
              <text className="sf-name" x={host.box.x + HOST.pad} y={host.box.y + 38}>
                {host.name}
              </text>
              <g
                transform={lockAt(host.box.x + host.box.w - HOST.pad - 20, host.box.y + 14)}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              >
                <path d={shackle(host.locked)} />
                <rect
                  x="1"
                  y="6"
                  width="10"
                  height="8"
                  rx="1.5"
                  fill={host.locked ? "currentColor" : "none"}
                />
              </g>
              <text
                className="sf-mono"
                x={host.box.x + HOST.pad}
                y={host.box.y + 68}
                style={{ fill: host.locked ? undefined : QUIET }}
              >
                {host.who}
              </text>
              <text
                className="sf-mono is-small"
                x={host.box.x + HOST.pad}
                y={host.box.y + 97}
                style={{ fill: host.phase.color }}
              >
                {host.phase.text}
              </text>
              <rect
                className={`rr-track ${styles["rr-track"]}`}
                x={host.box.x + HOST.pad}
                y={host.box.y + 109}
                width={host.box.w - HOST.pad * 2}
                height="6"
                rx="2"
                style={{ opacity: DIM }}
              />
              <rect
                x={host.box.x + HOST.pad}
                y={host.box.y + 109}
                width={(host.box.w - HOST.pad * 2) * host.fill}
                height="6"
                rx="2"
                fill={host.fillColor}
              />
            </g>
          ))}
          <g fill="none">
            {links.map((l) => (
              <g key={l.key} style={{ opacity: l.opacity }}>
                <path
                  d={l.d}
                  stroke={l.color}
                  strokeWidth="2.5"
                  path-length="1"
                  strokeDasharray="1 1"
                  strokeDashoffset={1 - l.draw}
                  style={{ opacity: l.wire }}
                />
                {l.dots.map((dot) => (
                  <circle key={dot.slot} cx={dot.x} cy={dot.y} r={DOT} fill={l.color} />
                ))}
                {l.head && (
                  <g
                    transform={lockAt(l.head.x - 10, l.head.y - 13)}
                    stroke={l.color}
                    strokeWidth="1.4"
                  >
                    <path d={shackle(false)} />
                    <rect x="1" y="6" width="10" height="8" rx="1.5" />
                  </g>
                )}
                {l.pill && (
                  <g>
                    <rect
                      className={`rr-pill ${styles["rr-pill"]}`}
                      x={l.pill.x}
                      y={l.pill.y}
                      width={l.pill.w}
                      height={l.pill.h}
                      rx="2"
                    />
                    <text
                      className="sf-mono is-small"
                      x={l.pill.tx}
                      y={l.pill.ty}
                      textAnchor="middle"
                      style={{ fill: l.pill.color }}
                    >
                      {l.pill.text}
                    </text>
                  </g>
                )}
              </g>
            ))}
          </g>
          {agents.map((a, i) => (
            <g key={a.run.agent} style={{ color: a.lit, opacity: agentFocus[i] }}>
              <rect
                className={`sf-box is-well${a.lit ? " is-lit" : ""}`}
                x={a.box.x}
                y={a.box.y}
                width={a.box.w}
                height={a.box.h}
              />
              <text className="sf-name" x={a.box.x + 16} y={a.box.y + 33}>
                {a.run.agent}
              </text>
              <text
                className="sf-mono is-small"
                x={a.box.x + 16}
                y={a.box.y + 58}
                style={{ fill: CODE }}
              >
                {a.run.command}
              </text>
              <text
                className="sf-mono is-small"
                x={a.box.x + 16}
                y={a.box.y + 80}
                style={{ fill: a.status.color }}
              >
                {a.status.text}
              </text>
            </g>
          ))}
          <g
            className={`rr-fade ${renderContext === "slide" ? styles["rr-fade"] : ""}`}
            style={{ opacity: waitingNote.opacity, color: WAIT }}
          >
            <rect
              className="sf-box is-well is-lit"
              x={waitingNote.box.x}
              y={waitingNote.box.y}
              width={waitingNote.box.w}
              height={waitingNote.box.h}
            />
            <text
              className="sf-mono is-small"
              x={waitingNote.box.x + 14}
              y={waitingNote.box.y + 27}
              style={{ fill: WAIT }}
            >
              {WAITING_EVENT.status}
            </text>
            <text
              className="sf-mono is-small"
              x={waitingNote.box.x + 14}
              y={waitingNote.box.y + 51}
              style={{ fill: CODE }}
            >
              {WAITING_EVENT.holder}
            </text>
          </g>
          {chips.map((c) => (
            <g key={c.i} style={{ opacity: c.enter * (agentFocus[c.i] ?? ON), color: c.stroke }}>
              <path
                d={c.call}
                fill="none"
                stroke={PINK}
                strokeWidth="1.5"
                style={{ opacity: DIM }}
              />
              <rect
                className="sf-box is-lit"
                x={c.box.x}
                y={c.box.y}
                width={c.box.w}
                height={c.box.h}
              />
              <text
                className={`sf-mono rr-bold ${styles["rr-bold"]}`}
                x={c.box.x + 14}
                y={c.box.y + 27}
                style={{ fill: PINK }}
              >
                rr
              </text>
              <text className="sf-mono is-small" x={c.box.x + 50} y={c.box.y + 26}>
                {c.pid}
              </text>
              {c.ring !== undefined && (
                <g
                  transform={`translate(${c.box.x + c.box.w - 24} ${c.box.y + 21})`}
                  fill="none"
                  strokeWidth="3"
                >
                  <circle r="10" stroke={NEUTRAL} />
                  <circle
                    r="10"
                    stroke={WAIT}
                    path-length="1"
                    strokeDasharray={`${c.ring} 1`}
                    transform="rotate(-90)"
                  />
                </g>
              )}
              <text
                className="sf-mono is-small"
                x={c.box.x + 14}
                y={c.box.y + 52}
                style={{ fill: c.status.color }}
              >
                {c.status.text}
              </text>
            </g>
          ))}
          {tags.map((tag) => (
            <g key={tag.key} style={{ opacity: tag.fade * (tag.opacity ?? ON) }}>
              <rect
                className={`rr-pill ${styles["rr-pill"]}`}
                x={tag.pill.x}
                y={tag.pill.y}
                width={tag.pill.w}
                height={tag.pill.h}
                rx="2"
              />
              <text
                className="sf-mono is-small"
                x={tag.pill.tx}
                y={tag.pill.ty}
                textAnchor="middle"
                style={{ fill: tag.pill.color }}
              >
                {tag.pill.text}
              </text>
            </g>
          ))}
        </g>
      }
      overlay={
        <>
          <h2 className="od-story-head">rr runs each agent's tests on its own machine.</h2>
          <NamePlate id="rr" />
          <EvidenceTag
            kind="schematic"
            x={HOST.x + HOST.w}
            y={TAG_Y}
            align="right"
            progress={s.frame}
          >
            Schematic · rr's own simulation of its lock rules
          </EvidenceTag>
          <TermPane
            lines={RESULT_LINES}
            shown={s.lines}
            highlight={[RESULT_HOT]}
            x={STRIP.x}
            y={STRIP.y}
            width={STRIP.w}
            height={STRIP.h}
            size={STRIP_TYPE}
            tag={`Recorded ${RUN.recorded} · rr test in OpenData · rr/site/fixtures/run.jsonl`}
            progress={s.strip}
          />
          <ThreadRail current="rr" />
        </>
      }
      card={<StoryCard anchor="left" hue="rose" lead={copy.lead} body={copy.body} />}
    />
  );
}
