import {
  clamp01,
  DRAW,
  DUR,
  FILTER_IDS,
  filterUrl,
  type GrowHandle,
  InkCardRect,
  InkNumber,
  ink,
  SETTLE,
  STROKE,
  StoryCard,
  StoryStage,
  stagger,
  useStage,
} from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import { useRef } from "react";
import { BOXES, CEILING, GAUGES } from "../data/infra";
import styles from "./BootstrapStage.module.css";

const CARD = { x: 110, w: 800, h: 172, top: 250, gap: 26 };
const boxes = BOXES.map((box, i) => ({
  ...box,
  y: CARD.top + i * (CARD.h + CARD.gap),
  hue: i === 0 ? ("cyan" as const) : ("violet" as const),
}));
const GAUGE = { x: 1080, w: 780, top: 300, pitch: 96, h: 14 };
const gauges = GAUGES.map((g, i) => ({ ...g, y: GAUGE.top + i * GAUGE.pitch }));
const firstBox = BOXES[0];
const lastGauge = gauges[gauges.length - 1];
if (!firstBox || !lastGauge) throw new Error("BootstrapStage requires machines and gauges");
const gaugeTagY = lastGauge.y + GAUGE.h + 36;
const FIGURE_RULE = { x1: 1080, x2: 1860, y: 740 };
const RULE_INK = ink("slate", 1);
const TRACK_INK = ink("slate", 1);
const DISK_WALL = ink("amber", 3);
const DISK_CLEAR = ink("cyan", 3);
const cpuLoad = GAUGES.find((g) => g.id === "cpu")?.text ?? "";
const diskText = GAUGES.find((g) => g.id === "disk")?.text ?? "";
const COPY = [
  {
    lead: "Production is two Mac Minis on a desk.",
    body: `One serves, one processes. We own the hardware, pay no cloud bill, and have ${firstBox.ramGb} GB of RAM on each.`,
  },
  {
    lead: "Disk runs out long before CPU or RAM.",
    body: `${diskText} used at idle, CPU load ${cpuLoad}. Crawler agents are blocked on storage.`,
  },
  {
    lead: `${CEILING.reqPerSec.toLocaleString("en-US")} QPS before latency moves.`,
    body: `Zero failures to ${CEILING.zeroFailReqPerSec.toLocaleString("en-US")} req/s. The wall was the proxy's memory cap, not the hardware.`,
  },
  {
    lead: "The first cloud spend is storage.",
    body: "Same containers, same YAML, more disk. That unblocks the request loop and the crawler agents.",
  },
];

export function BootstrapStage() {
  const s = useTween({ cards: 0, gauges: 0, wall: 0, rule: 0, clear: 0 });
  const apiFigure = useRef<GrowHandle>(null);
  const datasetFigure = useRef<GrowHandle>(null);
  const { clicks, playCount, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { cards: 1, duration: DUR.scale, ease: SETTLE });
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { gauges: 1, duration: DUR.scale, ease: DRAW }, `+=${DUR.opacity}`);
      tl.to(s, { wall: 1, duration: DUR.color, ease: SETTLE }, `-=${DUR.opacity}`);
      beat(1);
      tl.to(s, { rule: 1, duration: DUR.grow, ease: SETTLE }, `+=${DUR.opacity}`);
      apiFigure.current?.addGrow(tl, tl.duration() - DUR.card);
      datasetFigure.current?.addGrow(tl, `-=${DUR.card}`);
      beat(2);
      tl.to(s, { clear: 1, duration: DUR.scale, ease: SETTLE }, `+=${DUR.opacity}`);
      beat(3);
    },
  });
  const cardProgress = (i: number) => stagger(s.cards, i, boxes.length, 0.25);
  const gaugeProgress = (i: number) => stagger(s.gauges, i, gauges.length, 0.2);
  const gaugeRise = (i: number) => clamp01(gaugeProgress(i) * 3);
  const diskInk = s.clear >= 0.5 ? DISK_CLEAR : DISK_WALL;
  const tagProgress = clamp01((s.clear - 0.5) / 0.5);
  return (
    <StoryStage
      beats={beats}
      click={clicks}
      stage={
        <g key={playCount}>
          {boxes.map((box, i) => (
            <g
              key={box.id}
              style={{
                opacity: cardProgress(i),
                transform: `translate(0, ${(1 - cardProgress(i)) * 18}px)`,
              }}
            >
              <InkCardRect
                x={CARD.x}
                y={box.y}
                width={CARD.w}
                height={CARD.h}
                hue={box.hue}
                glowOpacity={0.16}
                stroke="var(--od-border)"
                strokeWidth={1}
              />
              <text
                className={styles.role}
                x={CARD.x + 32}
                y={box.y + 38}
                style={{ fill: ink(box.hue, 3) }}
              >
                {box.role}
              </text>
              <text
                className={styles.cost}
                x={CARD.x + CARD.w - 32}
                y={box.y + 48}
                textAnchor="end"
              >
                {box.cost}
              </text>
              <text
                className={styles.costNote}
                x={CARD.x + CARD.w - 32}
                y={box.y + 74}
                textAnchor="end"
              >
                {box.costNote}
              </text>
              <text className={styles.name} x={CARD.x + 32} y={box.y + 78}>
                {box.name}
              </text>
              <text className={styles.spec} x={CARD.x + 32} y={box.y + 110}>
                {`${box.os} · ${box.cores} cores · ${box.ramGb} GB RAM · ${box.disk}`}
              </text>
              <foreignObject x={CARD.x + 28} y={box.y + 126} width={CARD.w - 56} height={40}>
                <div className={styles.services}>
                  {box.services.map((svc) => (
                    <span key={svc} className={styles.service}>
                      {svc}
                    </span>
                  ))}
                </div>
              </foreignObject>
            </g>
          ))}
          {gauges.map((g, i) => (
            <g
              key={g.id}
              style={{
                opacity: gaugeRise(i),
                transform: `translate(0, ${(1 - gaugeRise(i)) * 10}px)`,
              }}
            >
              <text className={styles.gaugeLabel} x={GAUGE.x} y={g.y - 16}>
                {g.label}
              </text>
              <text
                className={styles.gaugeText}
                x={GAUGE.x + GAUGE.w}
                y={g.y - 16}
                textAnchor="end"
              >
                {g.text}
              </text>
              <rect
                x={GAUGE.x}
                y={g.y}
                width={GAUGE.w}
                height={GAUGE.h}
                rx={7}
                fill={TRACK_INK}
                fillOpacity={0.35}
              />
              <rect
                x={GAUGE.x}
                y={g.y}
                width={Math.max(GAUGE.h, GAUGE.w * g.value * gaugeProgress(i))}
                height={GAUGE.h}
                rx={7}
                fill={g.wall ? diskInk : ink("slate", 3)}
                style={{
                  fillOpacity: g.wall ? 0.35 + 0.65 * s.wall : 0.8,
                }}
                filter={g.wall && s.wall > 0.5 ? filterUrl(FILTER_IDS.glow) : undefined}
                className={g.wall ? styles.wall : undefined}
              />
            </g>
          ))}
          <text
            className={styles.tag}
            x={GAUGE.x + GAUGE.w}
            y={gaugeTagY}
            textAnchor="end"
            style={{
              fill: DISK_CLEAR,
              opacity: tagProgress,
              transform: `translate(0, ${(1 - tagProgress) * 6}px)`,
            }}
          >
            roadmap · cloud storage
          </text>
          <line
            x1={FIGURE_RULE.x1}
            x2={FIGURE_RULE.x2}
            y1={FIGURE_RULE.y}
            y2={FIGURE_RULE.y}
            stroke={RULE_INK}
            strokeWidth={STROKE.rule}
            style={{ opacity: s.rule }}
          />
        </g>
      }
      overlay={
        <>
          <h2 className="od-story-head is-wide">Two Mac Minis run production. Disk fills first.</h2>
          <div
            className={styles.loadHost}
            style={{ opacity: s.rule, transform: `translateY(${(1 - s.rule) * 12}px)` }}
          >
            <InkNumber
              ref={apiFigure}
              value={String(CEILING.api.reqPerSec)}
              suffix=" req/s"
              label={`API calls · p95 ${CEILING.api.p95Ms} ms`}
              hue="cyan"
              step={3}
              size={5.2}
            />
            <InkNumber
              ref={datasetFigure}
              value={String(CEILING.dataset.reqPerSec)}
              suffix=" req/s"
              label={`dataset reads · p95 ${CEILING.dataset.p95Ms} ms`}
              hue="slate"
              step={3}
              size={3}
            />
          </div>
        </>
      }
      card={<StoryCard anchor="left" hue="cyan" lead={copy.lead} body={copy.body} />}
    />
  );
}
