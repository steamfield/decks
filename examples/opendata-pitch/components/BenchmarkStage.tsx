import { useSlide } from "@steamfield/decks";
import {
  DRAW,
  DUR,
  type GrowHandle,
  InkCardRect,
  InkNumber,
  ink,
  SETTLE,
  STROKE,
  StoryCard,
  StoryLink,
  StoryStage,
  stagger,
  useStage,
} from "@steamfield/decks/kit";
import { motionMode, useTween } from "@steamfield/decks/motion";
import { useRef } from "react";
import {
  BENCHMARK_URL,
  MCP_CAP_HITS,
  MCP_CORRECT,
  MCP_MEDIAN_S,
  MCP_OPENDATA_CALLS,
  MCP_SANDBOX_CALLS,
  MCP_TOOL_CALLS,
  MCP_TOTAL_MIN,
  N,
  OUTCOMES,
  type Outcome,
  PHASE0_CORRECT,
  PHASE0_MODEL,
  PHASE0_N,
  PHASE0_PER_CORRECT,
  phase0Dollars,
  WEB_CAP_HITS,
  WEB_CORRECT,
  WEB_MEDIAN_S,
  WEB_OPENDATA_CALLS,
  WEB_SANDBOX_CALLS,
  WEB_SANDBOX_CHATS,
  WEB_TOOL_CALLS,
  WEB_TOTAL_MIN,
} from "../data/benchmark-v5";
import styles from "./BenchmarkStage.module.css";

const GRID = { x: 300, cell: 34, pitch: 42 };
const ROW = { web: 330, mcp: 440 };
const cellX = (i: number) => GRID.x + i * GRID.pitch;
const rowMid = (y: number) => y + GRID.cell / 2;
const DIFFICULTY_ORDER: Record<Outcome["difficulty"], number> = { easy: 0, medium: 1, hard: 2 };
const COLUMNS = [...OUTCOMES].sort(
  (a, b) =>
    DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty] || a.id.localeCompare(b.id),
);
const FILLED = ink("cyan", 3);
const HOLLOW = ink("cyan", 1);
const EFFORT = [
  { name: "tool calls", web: WEB_TOOL_CALLS, mcp: MCP_TOOL_CALLS },
  { name: "sandbox commands", web: WEB_SANDBOX_CALLS, mcp: MCP_SANDBOX_CALLS },
  { name: "OpenData calls", web: WEB_OPENDATA_CALLS, mcp: MCP_OPENDATA_CALLS },
  { name: "chats past ten minutes", web: WEB_CAP_HITS, mcp: MCP_CAP_HITS },
];
const COPY = [
  {
    lead: `${WEB_CORRECT} of ${N}, without OpenData.`,
    body: "Sonnet 5, one fresh chat per question, web search and a sandbox. Single run.",
  },
  {
    lead: `${MCP_CORRECT} of ${N}, with it.`,
    body: "Same model, same questions, same day. Single run per arm.",
  },
  {
    lead: "The clock went the same way.",
    body: `Median ${WEB_MEDIAN_S} seconds per chat without it, ${MCP_MEDIAN_S} with. ${N} chats, totalled on stage.`,
  },
  {
    lead: "Without it, the model rebuilds the pipeline.",
    body: `It spun up a sandbox in ${WEB_SANDBOX_CHATS} of ${N} chats, downloading source files to re-implement the work.`,
  },
  {
    lead: "The same shape in a bare API agent.",
    body: "Same model, same prompt, only the tool list differs. This run billed per token.",
  },
];
const PHASE0_NONE = `no tools at all: ${PHASE0_CORRECT.none} of ${PHASE0_N} correct, $${phase0Dollars(PHASE0_PER_CORRECT.none)} each`;
const REVEAL_STEP = 0.02;
const reveal = (progress: number, i: number) => stagger(progress, i, N, REVEAL_STEP);

export function BenchmarkStage() {
  const s = useTween({ web: 0, mcp: 0, time: 0, effort: 0, phase0: 0 });
  const webTotal = useRef<GrowHandle>(null);
  const mcpTotal = useRef<GrowHandle>(null);
  const webPerCorrect = useRef<GrowHandle>(null);
  const mcpPerCorrect = useRef<GrowHandle>(null);
  const { isActive, renderContext } = useSlide();
  const live = isActive && renderContext === "slide" && motionMode() === "live";
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { web: 1, duration: DUR.scale, ease: DRAW });
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { mcp: 1, duration: DUR.scale, ease: DRAW }, `+=${DUR.opacity}`);
      beat(1);
      tl.to(s, { time: 1, duration: DUR.card, ease: SETTLE }, `+=${DUR.opacity}`);
      webTotal.current?.addGrow(tl, `-=${DUR.card}`);
      mcpTotal.current?.addGrow(tl, `-=${DUR.grow}`);
      beat(2);
      tl.to(s, { effort: 1, duration: DUR.scale, ease: SETTLE }, `+=${DUR.opacity}`);
      beat(3);
      tl.to(s, { phase0: 1, duration: DUR.card, ease: SETTLE }, `+=${DUR.opacity}`);
      webPerCorrect.current?.addGrow(tl, `-=${DUR.opacity}`);
      mcpPerCorrect.current?.addGrow(tl, `-=${DUR.grow}`);
      beat(4);
    },
  });
  const held = 1 - 0.7 * s.phase0;
  const effortRow = (i: number) => stagger(s.effort, i, EFFORT.length, 0.16) * (1 - s.phase0);
  const transition = live ? undefined : "none";
  return (
    <StoryStage
      beats={beats}
      click={clicks}
      stage={
        <>
          <text className={styles.row} x={GRID.x - 24} y={rowMid(ROW.web)} textAnchor="end">
            Web search only
          </text>
          <text className={styles.row} x={GRID.x - 24} y={rowMid(ROW.mcp)} textAnchor="end">
            With OpenData
          </text>
          {COLUMNS.map((row, i) => (
            <g key={`web-${row.id}`} style={{ opacity: reveal(s.web, i) * held }}>
              <InkCardRect
                x={cellX(i)}
                y={ROW.web}
                width={GRID.cell}
                height={GRID.cell}
                radius={7}
                hue="cyan"
                surface={row.web === "CORRECT" ? FILLED : "none"}
                glowOpacity={row.web === "CORRECT" ? 0.22 : 0}
                stroke={row.web === "CORRECT" ? FILLED : HOLLOW}
                strokeWidth={STROKE.rule}
              />
            </g>
          ))}
          {COLUMNS.map((row, i) => (
            <g key={`mcp-${row.id}`} style={{ opacity: reveal(s.mcp, i) * held }}>
              <InkCardRect
                x={cellX(i)}
                y={ROW.mcp}
                width={GRID.cell}
                height={GRID.cell}
                radius={7}
                hue="cyan"
                surface={row.mcp === "CORRECT" ? FILLED : "none"}
                glowOpacity={row.mcp === "CORRECT" ? 0.22 : 0}
                stroke={row.mcp === "CORRECT" ? FILLED : HOLLOW}
                strokeWidth={STROKE.rule}
              />
            </g>
          ))}
        </>
      }
      overlay={
        <>
          <h2 className="od-story-head">Thirty questions.</h2>
          <div className={styles.figures} style={{ opacity: 1 - s.phase0 }}>
            <p className={styles.figuresHead} style={{ opacity: s.time, transition }}>
              total chat time, {N} questions
            </p>
            <div className={styles.figuresRow}>
              <InkNumber
                ref={webTotal}
                value={String(WEB_TOTAL_MIN)}
                suffix=" min"
                label="web search only"
                hue="slate"
                step={3}
                size={3.4}
              />
              <InkNumber
                ref={mcpTotal}
                value={String(MCP_TOTAL_MIN)}
                suffix=" min"
                label="with OpenData"
                hue="cyan"
                step={3}
                size={3.4}
              />
            </div>
          </div>
          <div className={styles.effort}>
            <div className={`${styles.effortRow} ${styles.head}`} style={{ opacity: effortRow(0) }}>
              <span className={styles.name}>what the time bought</span>
              <span className={styles.value}>web only</span>
              <span className={`${styles.value} ${styles.mcp}`}>with OpenData</span>
            </div>
            {EFFORT.map((row, i) => (
              <div
                key={row.name}
                className={styles.effortRow}
                style={{
                  opacity: effortRow(i),
                  transform: `translateY(${(1 - effortRow(i)) * 10}px)`,
                }}
              >
                <span className={styles.name}>{row.name}</span>
                <span className={styles.value}>{row.web.toLocaleString("en-US")}</span>
                <span className={`${styles.value} ${styles.mcp}`}>
                  {row.mcp.toLocaleString("en-US")}
                </span>
              </div>
            ))}
          </div>
          <div className={styles.phase0}>
            <p className={styles.figuresHead} style={{ opacity: s.phase0, transition }}>
              per correct answer · {PHASE0_MODEL}, API agent
            </p>
            <div className={styles.figuresRow}>
              <InkNumber
                ref={webPerCorrect}
                value={phase0Dollars(PHASE0_PER_CORRECT.web)}
                prefix="$"
                label={`web search and a sandbox · ${PHASE0_CORRECT.web} of ${PHASE0_N}`}
                hue="slate"
                step={3}
                size={3.4}
                count={false}
              />
              <InkNumber
                ref={mcpPerCorrect}
                value={phase0Dollars(PHASE0_PER_CORRECT.mcp)}
                prefix="$"
                label={`with OpenData · ${PHASE0_CORRECT.mcp} of ${PHASE0_N}`}
                hue="cyan"
                step={3}
                size={3.4}
                count={false}
              />
            </div>
            <p className={styles.phase0None} style={{ opacity: s.phase0, transition }}>
              {PHASE0_NONE}
            </p>
          </div>
          <StoryLink href={BENCHMARK_URL} />
        </>
      }
      card={<StoryCard anchor="left" hue="cyan" lead={copy.lead} body={copy.body} />}
    />
  );
}
