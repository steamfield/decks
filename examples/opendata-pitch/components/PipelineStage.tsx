import {
  CodeInk,
  clamp01,
  DRAW,
  DUR,
  FILTER_IDS,
  filterUrl,
  InkCardRect,
  InkChip,
  InkLine,
  ink,
  SETTLE,
  STROKE,
  StoryCard,
  StoryStage,
  stagger,
  TRACE,
  useStage,
  xScale,
  yScale,
} from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import {
  CUMULATIVE,
  DATASET_YAML_URL,
  DAYS_TO_FIRST,
  DEPLOY_MINUTES,
  daysSince,
  LAST_FOUR_WEEKS,
  PEAK_WEEK,
  STAGES,
  YAML_LINES,
} from "../data/pipeline-velocity";
import styles from "./PipelineStage.module.css";

const ROW = { y: 300, h: 72, w: 214, x0: 110, x1: 1810 };
const GAP = (ROW.x1 - ROW.x0 - ROW.w * STAGES.length) / (STAGES.length - 1);
const stages = STAGES.map((stage, i) => ({
  ...stage,
  x: ROW.x0 + i * (ROW.w + GAP),
  cx: ROW.x0 + i * (ROW.w + GAP) + ROW.w / 2,
}));
const RULE_Y = ROW.y + ROW.h / 2;
const GATE_INDEX = STAGES.findIndex((s) => s.id === "gate");
const CODE = { x: 1240, y: 440, width: 570, height: 470 };
const ASK = [
  { id: "request", label: "Request", note: "filed by anyone" },
  { id: "agent", label: "Agent", note: "authors the YAML" },
];
const ASK_Y = 560;
const ask = ASK.map((step, i) => ({
  ...step,
  x: ROW.x0 + i * (ROW.w + GAP),
  cx: ROW.x0 + i * (ROW.w + GAP) + ROW.w / 2,
}));
const [request, agent] = ask;
const firstStage = stages[0];
const lastStage = stages[stages.length - 1];
const lastPoint = CUMULATIVE[CUMULATIVE.length - 1];
if (!request || !agent || !firstStage || !lastStage || !lastPoint)
  throw new Error("PipelineStage requires Request, Agent, pipeline stages and cumulative data");
const pipelineStart = firstStage.cx;
const pipelineEnd = lastStage.cx;
const ASK_MID_Y = (ROW.y + ROW.h + ASK_Y) / 2;
const FEED_X = ROW.x0 + 20;
const ASK_LINK = `M ${request.x + ROW.w} ${ASK_Y + ROW.h / 2} H ${agent.x}`;
const ASK_FEED = `M ${agent.cx} ${ASK_Y} V ${ASK_MID_Y} H ${FEED_X} V ${ROW.y + ROW.h}`;
const ASK_TAG = { x: (FEED_X + agent.cx) / 2, y: ASK_MID_Y - 12 };
const WIRE_INK = ink("amber", 3);
const CURVE: { x: [number, number]; y: [number, number] } = { x: [880, 1780], y: [950, 480] };
const X_DOMAIN: [number, number] = [DAYS_TO_FIRST, lastPoint.x];
const SERIES = [{ x: DAYS_TO_FIRST, y: 0 }, ...CUMULATIVE.filter((p) => p.x > DAYS_TO_FIRST)];
const Y_DOMAIN: [number, number] = [0, 1100];
const sx = xScale(X_DOMAIN, CURVE.x);
const sy = yScale(Y_DOMAIN, CURVE.y);
const PEAK_DAY = daysSince(PEAK_WEEK.week) + 7;
const peakPoint = CUMULATIVE.find((p) => p.x === PEAK_DAY) ?? lastPoint;
const peakMark = { x: sx(peakPoint.x), y: sy(peakPoint.y) };
const PEAK_CHIP = { right: peakMark.x - 30, cy: peakMark.y - 46 };
const STAGE_INK = ink("slate", 2);
const LIVE_INK = ink("cyan", 3);
const GATE_HOLD = ink("amber", 3);
const GATE_PASS = ink("emerald", 3);
const RULE_INK = ink("slate", 1);
const DIM_INK = ink("slate", 1);
const COPY = [
  {
    lead: "A dataset is a YAML file in git.",
    body: `Source, schema, transforms, checks, refresh schedule, reviewed like code. Push to main, live in about ${DEPLOY_MINUTES} minutes.`,
  },
  {
    lead: "One gate decides if the new file ships.",
    body: "Every check runs against the staged file. A failure leaves yesterday’s data serving and tells us why.",
  },
  {
    lead: `Agents wrote ${PEAK_WEEK.count} of them in one week.`,
    body: `The first dataset landed ${Math.round(DAYS_TO_FIRST / 7)} weeks in. Claude Code agents wrote most of the ${LAST_FOUR_WEEKS} added in the last four weeks.`,
  },
  {
    lead: "Two steps still need a person.",
    body: "Someone starts the agent and pushes its YAML. Wire those two links and a request lands unattended.",
  },
];
const xLabels = [
  { x: CURVE.x[0], text: "first dataset, 3 weeks in", anchor: "start" },
  { x: CURVE.x[1], text: "Sep 2026", anchor: "end" },
] as const;
const PULSE_R = 10;
const smooth = (t: number) => t * t * (3 - 2 * t);

export function PipelineStage() {
  const s = useTween({
    frame: 0,
    boxes: 0,
    pulse: 0,
    gate: 0,
    dim: 0,
    hide: 0,
    chart: 0,
    curve: 0,
    peak: 0,
    ask: 0,
  });
  const { clicks, playCount, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { frame: 1, duration: DUR.grow, ease: DRAW });
      tl.to(s, { boxes: 1, duration: DUR.scale, ease: SETTLE }, `-=${DUR.card}`);
    },
    beats: (tl, beat) => {
      beat(0);
      for (let i = 1; i < STAGES.length; i++) {
        tl.to(s, { pulse: i, duration: DUR.card, ease: TRACE }, `+=${DUR.opacity}`);
        if (i === GATE_INDEX)
          tl.to(s, { gate: 1, duration: DUR.color, ease: SETTLE }, `+=${DUR.eraseHold}`);
      }
      tl.to(s, { dim: 1, duration: DUR.color, ease: SETTLE }, `+=${DUR.opacity}`);
      beat(1);
      tl.to(s, { hide: 1, duration: DUR.card, ease: SETTLE }, `+=${DUR.opacity}`);
      tl.to(s, { chart: 1, duration: DUR.grow, ease: SETTLE }, `-=${DUR.opacity}`);
      tl.to(s, { curve: 1, duration: DUR.bloom, ease: DRAW }, `-=${DUR.card}`);
      tl.to(s, { peak: 1, duration: DUR.card, ease: SETTLE }, `-=${DUR.card}`);
      beat(2);
      tl.to(s, { chart: 0, peak: 0, duration: DUR.card, ease: SETTLE }, `+=${DUR.opacity}`);
      tl.to(s, { ask: 1, duration: DUR.gather, ease: "none" }, `-=${DUR.opacity}`);
      beat(3);
    },
  });
  const boxProgress = (i: number) => stagger(s.boxes, i, STAGES.length, 0.12);
  const askProgress = (i: number) => smooth(clamp01((s.ask - (1 - i) * 0.18) / 0.42));
  const askWire = (i: number) => smooth(clamp01((s.ask - 0.4 - i * 0.18) / 0.42));
  const arrived = (i: number) => (i === 0 ? s.pulse > 0 : s.pulse >= i - 0.01);
  const lit = (i: number) => (i === GATE_INDEX ? arrived(i) : arrived(i) && s.dim < 0.5);
  const stageInk = (i: number) => {
    if (i === GATE_INDEX && arrived(i)) return s.gate >= 0.5 ? GATE_PASS : GATE_HOLD;
    if (s.dim >= 0.5) return DIM_INK;
    return arrived(i) ? LIVE_INK : STAGE_INK;
  };
  const i = Math.floor(s.pulse);
  const a = stages[Math.min(i, stages.length - 1)];
  const b = stages[Math.min(i + 1, stages.length - 1)];
  if (!a || !b) throw new Error(`PipelineStage has no stage for pulse ${s.pulse}`);
  const from = a.x + ROW.w - PULSE_R;
  const to = b.x + PULSE_R;
  const pulseX = a === b ? a.cx : from + (to - from) * smooth(s.pulse - i);
  return (
    <StoryStage
      beats={beats}
      click={clicks}
      stage={
        <g key={playCount}>
          <line
            x1={pipelineStart}
            x2={pipelineEnd}
            y1={RULE_Y}
            y2={RULE_Y}
            stroke={RULE_INK}
            strokeWidth={STROKE.rule}
            style={{ opacity: s.boxes }}
          />
          {s.pulse > 0 && (
            <g style={{ opacity: 1 - s.dim }}>
              <line
                x1={pipelineStart}
                x2={pulseX}
                y1={RULE_Y}
                y2={RULE_Y}
                stroke={LIVE_INK}
                strokeWidth={STROKE.rule}
                strokeOpacity={0.7}
              />
              <circle
                cx={pulseX}
                cy={RULE_Y}
                r={10}
                fill={LIVE_INK}
                filter={filterUrl(FILTER_IDS.glow)}
              />
            </g>
          )}
          {stages.map((stage, n) => (
            <g
              key={stage.id}
              className={styles.stage}
              style={{
                color: stageInk(n),
                opacity: boxProgress(n),
                transform: `translate(0, ${(1 - boxProgress(n)) * 22}px)`,
              }}
            >
              <InkCardRect
                x={stage.x}
                y={ROW.y}
                width={ROW.w}
                height={ROW.h}
                radius={10}
                surface="var(--od-canvas)"
                glowCx={stage.glow.cx}
                glowCy={stage.glow.cy}
                lit={lit(n)}
                strokeOpacity={lit(n) ? 0.75 : 0.45}
                dash={n === GATE_INDEX ? "8 8" : undefined}
                glowFilter={lit(n)}
              />
              <text className={styles.name} x={stage.cx} y={ROW.y + 44} textAnchor="middle">
                {stage.label}
              </text>
              <text className={styles.note} x={stage.cx} y={ROW.y + ROW.h + 30} textAnchor="middle">
                {stage.note}
              </text>
            </g>
          ))}
          {s.ask > 0 && (
            <g>
              <path
                d={ASK_LINK}
                fill="none"
                stroke={WIRE_INK}
                strokeWidth={STROKE.faint}
                strokeDasharray="8 8"
                strokeLinecap="round"
                style={{ opacity: askWire(0) }}
              />
              <path
                d={ASK_FEED}
                fill="none"
                stroke={WIRE_INK}
                strokeWidth={STROKE.faint}
                strokeDasharray="8 8"
                strokeLinecap="round"
                style={{ opacity: askWire(1) }}
              />
              <text
                className={styles.tag}
                x={ASK_TAG.x}
                y={ASK_TAG.y}
                textAnchor="middle"
                style={{ fill: WIRE_INK, opacity: askWire(1) }}
              >
                roadmap
              </text>
              {ask.map((step, n) => (
                <g
                  key={step.id}
                  style={{
                    color: WIRE_INK,
                    opacity: askProgress(n),
                    transform: `translate(0, ${14 * (1 - askProgress(n))}px)`,
                  }}
                >
                  <InkCardRect
                    x={step.x}
                    y={ASK_Y}
                    width={ROW.w}
                    height={ROW.h}
                    radius={10}
                    surface="var(--od-canvas)"
                    glowCx={0.5}
                    glowOpacity={0.1}
                    strokeOpacity={0.7}
                    dash="8 8"
                  />
                  <text className={styles.name} x={step.cx} y={ASK_Y + 44} textAnchor="middle">
                    {step.label}
                  </text>
                  <text
                    className={styles.note}
                    x={step.cx}
                    y={ASK_Y + ROW.h + 30}
                    textAnchor="middle"
                  >
                    {step.note}
                  </text>
                </g>
              ))}
            </g>
          )}
          <g style={{ opacity: s.chart, transform: `translate(0, ${(1 - s.chart) * 18}px)` }}>
            <g>
              <line
                x1={CURVE.x[0]}
                x2={CURVE.x[1]}
                y1={CURVE.y[0]}
                y2={CURVE.y[0]}
                stroke={RULE_INK}
                strokeWidth={STROKE.rule}
              />
              {xLabels.map((label) => (
                <text
                  key={label.text}
                  className={styles.axis}
                  x={label.x}
                  y={CURVE.y[0] + 34}
                  textAnchor={label.anchor}
                >
                  {label.text}
                </text>
              ))}
            </g>
            <line
              x1={PEAK_CHIP.right - 6}
              y1={PEAK_CHIP.cy + 16}
              x2={peakMark.x - 4}
              y2={peakMark.y - 6}
              stroke={RULE_INK}
              strokeWidth={STROKE.rule}
              strokeLinecap="round"
              style={{ opacity: s.peak }}
            />
            <InkLine
              series={SERIES}
              xDomain={X_DOMAIN}
              yDomain={Y_DOMAIN}
              xRange={CURVE.x}
              yRange={CURVE.y}
              interp="step"
              hue="cyan"
              step={3}
              reveal={s.curve}
              seed="datasets-added"
            />
          </g>
        </g>
      }
      overlay={
        <>
          <h2 className="od-story-head">Infrastructure as code, written by agents.</h2>
          <div
            className={styles.code}
            style={{
              opacity: 1 - s.hide,
              transform: `translateY(${s.hide * -14}px)`,
              visibility: s.hide >= 1 ? "hidden" : "visible",
            }}
          >
            <CodeInk
              lines={YAML_LINES}
              x={CODE.x}
              y={CODE.y}
              width={CODE.width}
              height={CODE.height}
              label="datasets/tea/staar-accountability/dataset.yaml"
              hue="cyan"
              step={2}
              reveal={s.frame}
              fontSize={0.86}
              href={DATASET_YAML_URL}
              scroll
              seed="dataset-yaml"
            />
          </div>
          <InkChip
            x={PEAK_CHIP.right}
            y={PEAK_CHIP.cy}
            anchor="right"
            text={`${PEAK_WEEK.count} in one week`}
            progress={s.peak}
          />
        </>
      }
      card={<StoryCard anchor="left" hue="cyan" lead={copy.lead} body={copy.body} />}
    />
  );
}
