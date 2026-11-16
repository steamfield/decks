import { DRAW, DUR, SETTLE, StoryCard, StoryStage, useStage } from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import {
  AXIS_TICKS,
  BUSIEST,
  cardsAt,
  formatLockDuration,
  formatPercent,
  GRAPH_COLS,
  HISTORY_MINUTES,
  HISTORY_SAMPLES,
  RECORDED,
  RETENTION,
  RETENTION_DAYS,
  resample,
  type Severity,
  severity,
  THRESHOLDS,
} from "../data/16-monitor-to-glass";
import { CrtFrame } from "./CrtFrame";
import { DATA, DIM, NEUTRAL, OFF, ON, PINK, PLUMB, QUIET, WAIT } from "./design";
import { EvidenceTag } from "./EvidenceTag";
import styles from "./MonitorToGlassStage.module.css";
import { NamePlate } from "./NamePlate";
import { ThreadRail } from "./ThreadRail";

const COPY = [
  {
    lead: "rr monitor shows each host in a terminal.",
    body: "Each card has CPU, memory, latency and the command holding the host's lock, read over SSH.",
  },
  {
    lead: `rr monitor keeps ${HISTORY_SAMPLES} samples per metric.`,
    body: `That is ${HISTORY_MINUTES} minutes at one sample a second, held in memory until rr monitor exits.`,
  },
  {
    lead: `StatGlass keeps up to ${RETENTION_DAYS} days.`,
    body: "It is a menu bar app for Apple Silicon Macs that stores each host's history in SQLite.",
  },
];

const TERM = { x: 110, y: 196, w: 1700, h: 404 };
const CARD = { x: 148, y: 224, w: 528, h: 304, gap: 20, pad: 20 };
const LINE = {
  host: 40,
  command: 74,
  rule1: 92,
  cpu: 126,
  plot: 196,
  rule2: 212,
  ram: 246,
  lat: 280,
};
const DOT = { pitch: 7, size: 4.4 };
const MENU = { x: 110, y: 196, w: 1700, h: 38 };
const GLASS = { y: 250, h: 302, pad: 22, name: 44, row: 66, rowPitch: 76, chart: 42, points: 64 };
const AXIS = { x0: 110, x1: 1510, x2: 1810, y: 646, h: 14, label: 632, note: 690 };
const TAG_Y = 562;

const cardX = (i: number) => CARD.x + i * (CARD.w + CARD.gap);

const BRIGHT = "var(--od-text)";
const SEVERITY: Record<Severity, string> = { healthy: DATA, warning: PLUMB, critical: PINK };

const plotWidth = CARD.w - CARD.pad * 2;
const subPitch = plotWidth / (GRAPH_COLS * 2);
const chartWidth = CARD.w - GLASS.pad * 2;

function area(values: readonly number[], x: number, baseline: number) {
  const points = resample(values.length > 1 ? values : [0, 0], GLASS.points);
  const step = chartWidth / (points.length - 1);
  const line = points
    .map(
      (v, i) =>
        `${i === 0 ? "M" : "L"}${(x + i * step).toFixed(1)} ${(baseline - (Math.min(100, v) / 100) * GLASS.chart).toFixed(1)}`,
    )
    .join("");
  return { line, fill: `${line}L${x + chartWidth} ${baseline}L${x} ${baseline}Z` };
}

const span = AXIS.x1 - AXIS.x0;
const lastMinutes = RETENTION.at(-1)?.minutes ?? 1;
const axisX = (minutes: number) =>
  AXIS.x1 - (Math.log(minutes / HISTORY_MINUTES) / Math.log(lastMinutes / HISTORY_MINUTES)) * span;
const ticks = AXIS_TICKS.map((tick) => ({ ...tick, x: axisX(tick.minutes) }));
const TIER_LEVEL = [ON, 0.72, DIM];
const tiers = RETENTION.map((tier, i) => {
  const right = i === 0 ? AXIS.x1 : axisX(RETENTION[i - 1]?.minutes ?? HISTORY_MINUTES);
  const left = axisX(tier.minutes);
  return { ...tier, left, right, mid: (left + right) / 2, level: TIER_LEVEL[i] ?? DIM };
});

export function MonitorToGlassStage() {
  const s = useTween({
    shell: OFF,
    frame: OFF,
    buffer: OFF,
    chip: OFF,
    glass: OFF,
    cards: OFF,
    reach: OFF,
  });
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { shell: ON, duration: DUR.grow, ease: SETTLE });
      tl.to(s, { frame: BUSIEST, duration: DUR.scale, ease: "none" }, "<");
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { buffer: ON, duration: DUR.scale, ease: "none" });
      tl.to(s, { chip: ON, duration: DUR.card, ease: SETTLE });
      beat(1);

      tl.to(s, { glass: ON, duration: DUR.color, ease: SETTLE });
      tl.to(s, { cards: ON, duration: DUR.card, ease: SETTLE });
      tl.to(s, { reach: ON, duration: DUR.scale, ease: DRAW });
      beat(2);
    },
  });

  const cards = cardsAt(s.frame);
  const monitor = cards.map((card, i) => {
    const x = cardX(i);
    const f = card.frame;
    const paths = new Map<string, string>();
    card.plot.heights.forEach((height, sub) => {
      if (height === 0) return;
      const color =
        SEVERITY[severity(card.plot.columnMax[Math.floor(sub / 2)] ?? 0, THRESHOLDS.cpu)];
      const px = x + CARD.pad + (sub + 0.5) * subPitch;
      const bottom = CARD.y + LINE.plot;
      paths.set(color, `${paths.get(color) ?? ""}M${px} ${bottom}V${bottom - height * DOT.pitch}`);
    });
    return {
      name: card.name,
      x,
      alias: f.alias,
      running: f.status === "running",
      status:
        f.status === "running" ? ` - running ${formatLockDuration(f.heldMs)}` : ` - ${f.status}`,
      command: f.command,
      cpu: { text: formatPercent(f.cpu).trim(), color: SEVERITY[severity(f.cpu, THRESHOLDS.cpu)] },
      load: `1m:${f.load1.toFixed(1)}`,
      ram: { text: formatPercent(f.ram).trim(), color: SEVERITY[severity(f.ram, THRESHOLDS.ram)] },
      latency: f.latency > 0 ? `${f.latency.toFixed(0)}ms` : "",
      plot: [...paths].map(([color, d]) => ({ color, d })),
    };
  });

  const glass = cards.map((card, i) => {
    const x = cardX(i);
    const rows = [
      { label: "CPU", value: card.frame.cpu, values: card.cpu, color: DATA },
      { label: "Memory", value: card.frame.ram, values: card.ram, color: PLUMB },
      { label: "GPU", value: card.frame.gpu ?? 0, values: card.gpu, color: PINK },
    ].map((row, k) => {
      const top = GLASS.y + GLASS.row + k * GLASS.rowPitch;
      return {
        ...row,
        top,
        text: `${Math.round(row.value)}%`,
        ...area(row.values, x + GLASS.pad, top + 24 + GLASS.chart),
      };
    });
    return {
      name: card.name,
      x,
      holder: card.frame.command ? `rr: ${card.frame.command}` : "",
      rows,
    };
  });

  const local = cards.find((card) => card.frame.latency === 0) ?? cards[0];
  const recent = resample(local?.cpu.slice(-12) ?? [0], 5);
  const menuItem = {
    text: `${Math.round(local?.frame.cpu ?? 0)}%`,
    bars: recent.map((v, slot) => ({ slot, height: Math.max(2, (v / 100) * 18) })),
  };
  const reachX = AXIS.x1 - s.reach * span;
  const tierShown = (tier: { left: number; right: number }) => {
    const from = Math.max(tier.left, reachX);
    return { x: from, width: Math.max(0, tier.right - from) };
  };
  const passed = (x: number) => (reachX <= x + 1 ? ON : OFF);
  const terminal = s.shell * (ON - s.glass);
  const bufferLevel = ON - s.reach * (ON - DIM);

  return (
    <StoryStage
      beats={beats}
      click={clicks}
      stage={
        <>
          <CrtFrame
            x={TERM.x}
            y={TERM.y}
            width={TERM.w}
            height={TERM.h}
            tag={`Recorded ${RECORDED} · rr monitor, during one rr test run · rr/site/fixtures/monitor.jsonl`}
            progress={terminal}
          >
            {monitor.map((m) => (
              <g key={m.name}>
                <rect
                  className={`mg-card ${styles["mg-card"]}`}
                  x={m.x}
                  y={CARD.y}
                  width={CARD.w}
                  height={CARD.h}
                />
                <circle
                  cx={m.x + CARD.pad + 8}
                  cy={CARD.y + LINE.host - 10}
                  r="8"
                  fill={m.running ? WAIT : DATA}
                />
                <text className="sf-term" x={m.x + CARD.pad + 26} y={CARD.y + LINE.host}>
                  <tspan style={{ fill: BRIGHT }}>{m.name}</tspan>
                  <tspan style={{ fill: m.running ? WAIT : QUIET }}>{m.status}</tspan>
                </text>
                <text
                  className="sf-term"
                  x={m.x + CARD.w - CARD.pad}
                  y={CARD.y + LINE.host}
                  textAnchor="end"
                  style={{ fill: QUIET }}
                >
                  {m.alias}
                </text>
                <text
                  className="sf-term"
                  x={m.x + CARD.pad + 26}
                  y={CARD.y + LINE.command}
                  style={{ fill: QUIET }}
                >
                  {"> "}
                  {m.command}
                </text>
                <line
                  className={`mg-rule ${styles["mg-rule"]}`}
                  x1={m.x + CARD.pad}
                  x2={m.x + CARD.w - CARD.pad}
                  y1={CARD.y + LINE.rule1}
                  y2={CARD.y + LINE.rule1}
                />
                <text className="sf-term" x={m.x + CARD.pad} y={CARD.y + LINE.cpu}>
                  CPU
                </text>
                <text
                  className="sf-term"
                  x={m.x + CARD.w - CARD.pad}
                  y={CARD.y + LINE.cpu}
                  textAnchor="end"
                >
                  <tspan style={{ fill: m.cpu.color }}>{m.cpu.text}</tspan>
                  <tspan style={{ fill: QUIET }} dx="14">
                    {m.load}
                  </tspan>
                </text>
                {m.plot.map((p) => (
                  <path
                    key={p.color}
                    d={p.d}
                    fill="none"
                    stroke={p.color}
                    strokeWidth={DOT.size}
                    strokeDasharray={`${DOT.size} ${DOT.pitch - DOT.size}`}
                  />
                ))}
                <line
                  className={`mg-rule ${styles["mg-rule"]}`}
                  x1={m.x + CARD.pad}
                  x2={m.x + CARD.w - CARD.pad}
                  y1={CARD.y + LINE.rule2}
                  y2={CARD.y + LINE.rule2}
                />
                <text className="sf-term" x={m.x + CARD.pad} y={CARD.y + LINE.ram}>
                  RAM
                </text>
                <text
                  className="sf-term"
                  x={m.x + CARD.w - CARD.pad}
                  y={CARD.y + LINE.ram}
                  textAnchor="end"
                  style={{ fill: m.ram.color }}
                >
                  {m.ram.text}
                </text>
                {m.latency && (
                  <g>
                    <text className="sf-term" x={m.x + CARD.pad} y={CARD.y + LINE.lat}>
                      LAT
                    </text>
                    <text
                      className="sf-term"
                      x={m.x + CARD.w - CARD.pad}
                      y={CARD.y + LINE.lat}
                      textAnchor="end"
                      style={{ fill: DATA }}
                    >
                      {m.latency}
                    </text>
                  </g>
                )}
              </g>
            ))}
          </CrtFrame>
          <g style={{ opacity: s.cards, transform: `translate(0, ${(ON - s.cards) * 12}px)` }}>
            <rect className="sf-box is-well" x={MENU.x} y={MENU.y} width={MENU.w} height={MENU.h} />
            <text className="sf-mono is-small" x={MENU.x + 20} y={MENU.y + 25}>
              menu bar
            </text>
            <text
              className="sf-mono is-small"
              x={MENU.x + MENU.w - 132}
              y={MENU.y + 25}
              textAnchor="end"
              style={{ fill: BRIGHT }}
            >
              StatGlass
            </text>
            <g style={{ color: DATA }}>
              <rect
                className="sf-box is-lit"
                x={MENU.x + MENU.w - 120}
                y={MENU.y + 5}
                width="108"
                height={MENU.h - 10}
              />
              {menuItem.bars.map((bar) => (
                <rect
                  key={bar.slot}
                  x={MENU.x + MENU.w - 110 + bar.slot * 7}
                  y={MENU.y + MENU.h - 9 - bar.height}
                  width="5"
                  height={bar.height}
                  fill={DATA}
                />
              ))}
              <text
                className="sf-mono is-small"
                x={MENU.x + MENU.w - 20}
                y={MENU.y + 25}
                textAnchor="end"
                style={{ fill: DATA }}
              >
                {menuItem.text}
              </text>
            </g>
            {glass.map((g) => (
              <g key={g.name}>
                <rect
                  className={`sf-box mg-glass ${styles["mg-glass"]}`}
                  x={g.x}
                  y={GLASS.y}
                  width={CARD.w}
                  height={GLASS.h}
                />
                <text className="sf-name" x={g.x + GLASS.pad} y={GLASS.y + GLASS.name}>
                  {g.name}
                </text>
                <text
                  className="sf-mono is-small"
                  x={g.x + CARD.w - GLASS.pad}
                  y={GLASS.y + GLASS.name - 2}
                  textAnchor="end"
                  style={{ fill: WAIT }}
                >
                  {g.holder}
                </text>
                {g.rows.map((row) => (
                  <g key={row.label}>
                    <text className="sf-mono is-small" x={g.x + GLASS.pad} y={row.top + 16}>
                      {row.label}
                    </text>
                    <text
                      className="sf-mono is-small"
                      x={g.x + CARD.w - GLASS.pad}
                      y={row.top + 16}
                      textAnchor="end"
                      style={{ fill: row.color }}
                    >
                      {row.text}
                    </text>
                    <path
                      className={`mg-area ${styles["mg-area"]}`}
                      d={row.fill}
                      fill={row.color}
                    />
                    <path
                      d={row.line}
                      fill="none"
                      stroke={row.color}
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </g>
                ))}
              </g>
            ))}
          </g>
          <g style={{ opacity: s.buffer > OFF ? ON : OFF }}>
            <g style={{ opacity: bufferLevel }}>
              <text className="sf-mono is-small" x={AXIS.x1} y={AXIS.label}>
                rr monitor
              </text>
              <rect
                className={`mg-track ${styles["mg-track"]}`}
                x={AXIS.x1}
                y={AXIS.y}
                width={AXIS.x2 - AXIS.x1}
                height={AXIS.h}
                rx="2"
              />
              <rect
                x={AXIS.x1}
                y={AXIS.y}
                width={(AXIS.x2 - AXIS.x1) * s.buffer}
                height={AXIS.h}
                rx="2"
                fill={DATA}
              />
              <text className="sf-mono is-small" x={AXIS.x2} y={AXIS.note} textAnchor="end">
                {HISTORY_MINUTES} min, in memory
              </text>
              <text
                className="sf-pixel is-fig"
                x={AXIS.x2}
                y={AXIS.label - 2}
                textAnchor="end"
                style={{ opacity: s.chip }}
              >
                {HISTORY_SAMPLES} samples
              </text>
            </g>
          </g>
          <g style={{ opacity: s.reach > OFF ? ON : OFF }}>
            <rect
              className={`mg-track ${styles["mg-track"]}`}
              x={reachX}
              y={AXIS.y}
              width={Math.max(0, AXIS.x1 - reachX - 4)}
              height={AXIS.h}
              rx="2"
            />
            {tiers.map((tier) => (
              <g key={tier.through}>
                <rect
                  {...tierShown(tier)}
                  y={AXIS.y}
                  height={AXIS.h}
                  fill={DATA}
                  style={{ opacity: tier.level }}
                />
                <text
                  className="sf-mono is-small"
                  x={tier.mid}
                  y={AXIS.note}
                  textAnchor="middle"
                  style={{ opacity: passed(tier.left) }}
                >
                  {tier.bucket}
                </text>
              </g>
            ))}
            {ticks.map((tick, k) => (
              <g key={tick.label} style={{ opacity: passed(tick.x) }}>
                <line
                  x1={tick.x}
                  x2={tick.x}
                  y1={AXIS.y - 6}
                  y2={AXIS.y + AXIS.h + 6}
                  stroke={NEUTRAL}
                  strokeWidth="2"
                />
                <text
                  className="sf-mono is-small"
                  x={tick.x}
                  y={AXIS.label}
                  textAnchor={k === ticks.length - 1 ? "start" : "middle"}
                  style={{ fill: BRIGHT }}
                >
                  {tick.label}
                </text>
              </g>
            ))}
            <text
              className="sf-mono is-small"
              x={AXIS.x1 - 16}
              y={AXIS.note}
              textAnchor="end"
              style={{ opacity: s.reach }}
            >
              log scale
            </text>
          </g>
        </>
      }
      overlay={
        <>
          <h2 className="od-story-head">StatGlass started as the rr monitor command.</h2>
          <NamePlate id="statglass" />
          <EvidenceTag
            kind="illustrative"
            x={TERM.x + TERM.w}
            y={TAG_Y}
            align="right"
            progress={s.cards}
          >
            Illustrative · the recording's readings, drawn as StatGlass cards
          </EvidenceTag>
          <ThreadRail current="statglass" />
        </>
      }
      card={<StoryCard anchor="left" hue="cyan" lead={copy.lead} body={copy.body} />}
    />
  );
}
