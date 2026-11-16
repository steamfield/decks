import {
  clamp01,
  DRAW,
  DUR,
  SETTLE,
  StoryCard,
  StoryStage,
  useStage,
  xScale,
} from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import {
  AGENT,
  BRIEF_WORDS,
  CLI,
  COMMAND,
  FILES,
  HANDOFF_PROMPT,
  MANIFEST_FILE,
  PROJECT,
  RECORDED,
  RUNS,
  FIRST_FAIL as recordedFirstFail,
  FIRST_GREEN as recordedFirstGreen,
  STEPS,
  TIMELINE_END,
} from "../data/04-stacks-loop";
import { CrtFrame } from "./CrtFrame";
import {
  along,
  DATA,
  DIM,
  GREEN,
  LOOP,
  NEUTRAL,
  OFF,
  ON,
  PINK,
  PLUMB,
  type Pt,
  polyline,
  QUIET,
  WAIT,
} from "./design";
import { EvidenceTag } from "./EvidenceTag";
import { NamePlate } from "./NamePlate";
import { ThreadRail } from "./ThreadRail";

const { FIRST_FAIL, FIRST_GREEN } = (() => {
  if (!recordedFirstFail || !recordedFirstGreen)
    throw new Error("Stacks loop requires both recorded verify runs");
  return { FIRST_FAIL: recordedFirstFail, FIRST_GREEN: recordedFirstGreen };
})();

const COPY = [
  {
    lead: "One command writes the brief.",
    body: `It writes starter files, agent instructions and a ${BRIEF_WORDS.toLocaleString("en-US")}-word BRIEF.md.`,
  },
  {
    lead: "The agent’s prompt is two sentences.",
    body: "It names the brief and says the work is done when stacks verify passes.",
  },
  {
    lead: "The first verify run failed.",
    body: `${AGENT} ran it ${FIRST_FAIL.at} seconds in and ${FIRST_FAIL.failed.length} of ${STEPS.length} steps failed.`,
  },
  {
    lead: "The next verify run passed.",
    body: `The agent fixed the failures and all ${STEPS.length} steps passed at ${FIRST_GREEN.at} seconds.`,
  },
  {
    lead: "Stacks refuses to verify edited checks.",
    body: "Stacks keeps a hash of the steps outside the project and refuses to run if one was edited.",
  },
];

const { boundary, command, file, agent, gate, step, prompt, digest, crt, axis } = LOOP;
const files = FILES.map((name, i) => ({
  name,
  y: file.y + i * file.gap,
  manifest: name === MANIFEST_FILE,
}));
const midY = agent.y + agent.h / 2;
const gateMidX = gate.x + gate.w / 2;
const TO_AGENT: Pt[] = [
  [file.x + file.w, midY],
  [agent.x, midY],
];
const TO_GATE: Pt[] = [
  [agent.x + agent.w, midY],
  [gate.x, midY],
];
const BACK: Pt[] = [
  [gateMidX, gate.y],
  [gateMidX, boundary.y + 22],
  [agent.x + agent.w / 2, boundary.y + 22],
  [agent.x + agent.w / 2, agent.y],
];
const TO_DIGEST: Pt[] = [
  [gate.x + gate.w - 34, gate.y + gate.h],
  [gate.x + gate.w - 34, digest.y],
];
const squares = STEPS.map((name, i) => ({
  name,
  x: gate.x + 22 + (i % step.cols) * (step.size + step.gap),
  y: gate.y + step.top + Math.floor(i / step.cols) * (step.size + step.gap),
  failed: FIRST_FAIL.failed.includes(name),
}));
const tx = xScale([0, TIMELINE_END], [axis.x0, axis.x1]);
const ticks = [
  { at: 0, name: "stacks new", tone: "start" as const },
  ...RUNS.map((run) => ({ at: run.at, name: run.outcome, tone: run.outcome })),
];

const toneInk = { start: QUIET, failed: PINK, green: GREEN };

const packet = (path: Pt[], t: number) => {
  const [x, y] = along(path, t);
  return { cx: x, cy: y, opacity: t > OFF && t < ON ? ON : OFF };
};
const lockAt = (x: number, y: number) => {
  const w = LOOP.lock;
  return {
    body: { x, y: y + w * 0.45, width: w, height: w * 0.7 },
    shackle: `M${x + w * 0.22} ${y + w * 0.45}V${y + w * 0.3}a${w * 0.28} ${w * 0.28} 0 0 1 ${w * 0.56} 0V${y + w * 0.45}`,
  };
};
const manifest = files.find((f) => f.manifest) ?? files[files.length - 1];
if (!manifest) throw new Error("Stacks loop requires a manifest file");
const manifestLock = lockAt(file.x + file.w - 38, manifest.y + 9);
const gateLock = lockAt(gate.x + gate.w - 42, gate.y + gate.h - 38);

export function StacksLoopStage() {
  const s = useTween({
    frame: OFF,
    cmd: OFF,
    files: OFF,
    prompt: OFF,
    toAgent: OFF,
    agent: OFF,
    crt: OFF,
    recordFocus: ON,
    toGate: OFF,
    cursor: OFF,
    checks1: OFF,
    run1: OFF,
    back: OFF,
    checks2: OFF,
    run2: OFF,
    rest: ON,
    agentFocus: DIM,
    gateFocus: DIM,
    lock: OFF,
    digest: OFF,
  });
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { frame: ON, duration: DUR.grow, ease: SETTLE });
      tl.to(s, { cmd: ON, duration: DUR.trace, ease: "none" }, `-=${DUR.card}`);
      tl.to(s, { files: ON, duration: DUR.gather, ease: "none" });
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { rest: DIM, prompt: ON, agentFocus: ON, duration: DUR.card, ease: SETTLE });
      tl.to(s, { toAgent: ON, duration: DUR.gather, ease: DRAW });
      tl.to(s, { agent: ON, duration: DUR.color, ease: SETTLE });
      beat(1);

      tl.to(s, { crt: ON, gateFocus: ON, duration: DUR.card, ease: SETTLE });
      tl.to(s, { toGate: ON, cursor: FIRST_FAIL.at, duration: DUR.gather, ease: DRAW });
      tl.to(s, { checks1: ON, duration: DUR.gather, ease: "none" }, "<");
      tl.to(s, { run1: ON, duration: DUR.morph, ease: SETTLE }, `+=${DUR.eraseHold}`);
      // The return is secondary to the verdict; keep this beat below four seconds.
      tl.to(s, { back: ON, duration: DUR.scale, ease: DRAW });
      beat(2);

      tl.to(s, { agent: OFF, duration: DUR.card, ease: SETTLE });
      tl.to(s, {
        agent: ON,
        toGate: ON + ON,
        cursor: FIRST_GREEN.at,
        duration: DUR.gather,
        ease: DRAW,
      });
      tl.to(s, { checks2: ON, duration: DUR.gather, ease: "none" }, "<");
      tl.to(s, { run2: ON, duration: DUR.morph, ease: SETTLE }, `+=${DUR.eraseHold}`);
      beat(3);

      tl.to(s, { agentFocus: DIM, recordFocus: DIM, duration: DUR.card, ease: SETTLE });
      tl.to(s, { lock: ON, duration: DUR.morph, ease: SETTLE }, `+=${DUR.eraseHold}`);
      tl.to(s, { digest: ON, duration: DUR.card, ease: SETTLE });
      beat(4);
    },
  });
  const typed = COMMAND.slice(0, Math.round(s.cmd * COMMAND.length));
  const fileProgress = (i: number) => clamp01(s.files * files.length - i);
  const rest = s.rest;
  const retry = clamp01(s.checks2 * STEPS.length);
  const failedVerdict = s.run1 * (ON - retry);
  const gateInk = `color-mix(in srgb, ${GREEN} ${s.run2 * 100}%, color-mix(in srgb, ${PINK} ${failedVerdict * 100}%, ${NEUTRAL}))`;
  const docFailures = FIRST_FAIL.failed.filter((name) => name !== "lint").length;
  const tickProgress = (at: number) => (at === 0 ? ON : clamp01((s.cursor - at + 30) / 30));

  return (
    <StoryStage
      beats={beats}
      click={clicks}
      stage={
        <>
          <g style={{ opacity: s.frame }}>
            <rect
              className="sf-boundary"
              x={boundary.x}
              y={boundary.y}
              width={boundary.w}
              height={boundary.h}
            />
            <text className="sf-mono is-small" x={boundary.x + 4} y={boundary.y - 14}>
              {PROJECT}/
            </text>
            <g style={{ opacity: rest }}>
              <path
                className="sf-wire"
                d={polyline([
                  [command.x + command.w, command.y + command.h / 2],
                  [boundary.x, command.y + command.h / 2],
                ])}
              />
              <path className="sf-wire" d={polyline(TO_AGENT)} />
            </g>
            <path className="sf-wire" d={polyline(TO_GATE)} />
            <path
              className="sf-wire"
              d={polyline(BACK)}
              strokeDasharray="4 8"
              style={{ opacity: s.run1 }}
            />
          </g>
          <g style={{ opacity: rest }}>
            <rect
              className="sf-box is-well"
              x={command.x}
              y={command.y}
              width={command.w}
              height={command.h}
              style={{ opacity: s.frame }}
            />
            <text className="sf-term" x={command.x + 20} y={command.y + 42}>
              <tspan fill={NEUTRAL}>$ </tspan>
              {typed}
              {s.cmd < ON && <tspan fill={GREEN}>█</tspan>}
            </text>
          </g>
          {files.map((f, i) => (
            <g
              key={f.name}
              style={{
                opacity: fileProgress(i) * (f.manifest ? Math.max(rest, s.lock) : rest),
                transform: `translate(0, ${(ON - fileProgress(i)) * -16}px)`,
                color: WAIT,
              }}
            >
              <rect
                className={`sf-box${f.manifest && s.lock > 0.5 ? " is-lit" : ""}`}
                x={file.x}
                y={f.y}
                width={file.w}
                height={file.h}
              />
              <text className="sf-mono" x={file.x + 18} y={f.y + 31}>
                {f.name}
              </text>
            </g>
          ))}
          <g style={{ opacity: s.lock, color: WAIT }}>
            <rect {...manifestLock.body} fill="currentColor" rx="2" />
            <path d={manifestLock.shackle} fill="none" stroke="currentColor" strokeWidth="3" />
          </g>
          <g
            style={{
              opacity: s.prompt * (ON - s.crt * (ON - DIM)),
              transform: `translate(0, ${(ON - s.prompt) * 12}px)`,
            }}
          >
            <rect
              className="sf-box is-well"
              x={prompt.x}
              y={prompt.y}
              width={prompt.w}
              height={prompt.h}
            />
            <text className="sf-mono is-small" x={prompt.x + 16} y={prompt.y + 23}>
              <tspan fill={PINK}>{"> "}</tspan>
              {HANDOFF_PROMPT[0]}
            </text>
            <text className="sf-mono is-small" x={prompt.x + 38} y={prompt.y + 45}>
              {HANDOFF_PROMPT[1]}
            </text>
          </g>
          <g style={{ opacity: s.frame * s.agentFocus, color: PINK }}>
            <rect
              className={`sf-box${s.agent > 0.5 ? " is-lit" : ""}`}
              x={agent.x}
              y={agent.y}
              width={agent.w}
              height={agent.h}
            />
            <text
              className="sf-name"
              x={agent.x + agent.w / 2}
              y={agent.y + 52}
              textAnchor="middle"
            >
              {AGENT}
            </text>
            <text
              className="sf-mono is-small"
              x={agent.x + agent.w / 2}
              y={agent.y + 84}
              textAnchor="middle"
            >
              builds the project
            </text>
          </g>
          <g style={{ opacity: s.frame * s.gateFocus, color: gateInk }}>
            <rect
              className={`sf-box${s.run1 > 0.5 ? " is-lit" : ""}`}
              x={gate.x}
              y={gate.y}
              width={gate.w}
              height={gate.h}
            />
            <text className="sf-mono" x={gate.x + 22} y={gate.y + 40}>
              stacks verify
            </text>
            {squares.map((sq, i) => (
              <g key={sq.name}>
                <rect
                  x={sq.x}
                  y={sq.y}
                  width={step.size}
                  height={step.size}
                  rx="2"
                  fill="none"
                  stroke={NEUTRAL}
                />
                <rect
                  x={sq.x}
                  y={sq.y}
                  width={step.size}
                  height={step.size}
                  rx="2"
                  fill={sq.failed ? PINK : GREEN}
                  style={{ opacity: clamp01(s.checks1 * STEPS.length - i) * (ON - retry) }}
                />
                <rect
                  x={sq.x}
                  y={sq.y}
                  width={step.size}
                  height={step.size}
                  rx="2"
                  fill={GREEN}
                  style={{ opacity: clamp01(s.checks2 * STEPS.length - i) }}
                />
              </g>
            ))}
            {[
              { text: `${STEPS.length} steps`, opacity: ON - Math.max(failedVerdict, s.run2) },
              {
                text: `${FIRST_FAIL.failed.length} of ${STEPS.length} failed`,
                opacity: failedVerdict,
              },
              { text: `green · ${STEPS.length} of ${STEPS.length}`, opacity: s.run2 },
            ].map((status) => (
              <text
                key={status.text}
                className="sf-mono is-small"
                x={gate.x + 22}
                y={gate.y + gate.h + 28}
                style={{ fill: gateInk, opacity: status.opacity }}
              >
                {status.text}
              </text>
            ))}
            <text
              className="sf-mono is-small"
              x={gate.x + 22}
              y={gate.y + gate.h + 54}
              style={{ fill: PINK, opacity: failedVerdict }}
            >
              lint + {docFailures} doc checks
            </text>
          </g>
          <g style={{ opacity: s.lock, color: WAIT }}>
            <rect {...gateLock.body} fill="currentColor" rx="2" />
            <path d={gateLock.shackle} fill="none" stroke="currentColor" strokeWidth="3" />
          </g>
          <g style={{ opacity: s.digest, color: PLUMB }}>
            <path
              className="sf-wire"
              d={polyline(TO_DIGEST)}
              style={{ stroke: PLUMB }}
              strokeDasharray="4 8"
            />
            <rect
              className="sf-box is-lit"
              x={digest.x}
              y={digest.y}
              width={digest.w}
              height={digest.h}
            />
            <text
              className="sf-mono is-small"
              x={digest.x + digest.w / 2}
              y={digest.y + 29}
              textAnchor="middle"
              style={{ fill: PLUMB }}
            >
              step hash, outside the project
            </text>
          </g>
          <circle r={LOOP.packet} fill={PINK} {...packet(TO_AGENT, s.toAgent)} />
          <circle r={LOOP.packet} fill={DATA} {...packet(TO_GATE, s.toGate % ON)} />
          <circle r={LOOP.packet} fill={PINK} {...packet(BACK, s.back)} />
          <CrtFrame
            x={crt.x}
            y={crt.y}
            width={crt.w}
            height={crt.h}
            fig="Fig. 2"
            tag={`Recorded ${RECORDED} · stacks ${CLI} · .stacks/state/runs.jsonl`}
            progress={s.frame}
            power={s.crt * s.recordFocus}
          >
            <text className="sf-pixel is-small" x={axis.x0} y={crt.y + 62}>
              Seconds since stacks new
            </text>
            <line
              x1={axis.x0}
              x2={axis.x1}
              y1={axis.y}
              y2={axis.y}
              stroke={NEUTRAL}
              strokeWidth="2"
            />
            <line
              x1={axis.x0}
              x2={tx(s.cursor)}
              y1={axis.y}
              y2={axis.y}
              stroke={DATA}
              strokeWidth="4"
              strokeLinecap="round"
            />
            {ticks.map((tick) => (
              <g key={tick.at} style={{ opacity: tickProgress(tick.at) }}>
                <line
                  x1={tx(tick.at)}
                  x2={tx(tick.at)}
                  y1={axis.y - axis.tick}
                  y2={axis.y + axis.tick}
                  stroke={toneInk[tick.tone]}
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <text
                  className="sf-mono"
                  x={tx(tick.at)}
                  y={axis.y - axis.labelUp}
                  textAnchor="middle"
                  style={{ fill: toneInk[tick.tone] }}
                >
                  {tick.name}
                </text>
                <text
                  className="sf-pixel is-small"
                  x={tx(tick.at)}
                  y={axis.y + axis.labelDown}
                  textAnchor="middle"
                >
                  {tick.at} s
                </text>
              </g>
            ))}
            <circle cx={tx(s.cursor)} cy={axis.y} r="9" fill={DATA} />
          </CrtFrame>
        </>
      }
      overlay={
        <>
          <h2 className="od-story-head">Stacks briefs the agent and checks its work.</h2>
          <NamePlate id="stacks" />
          <EvidenceTag
            kind="schematic"
            x={boundary.x + boundary.w}
            y={boundary.y - 44}
            align="right"
            progress={s.frame}
          />
          <ThreadRail current="stacks" />
        </>
      }
      card={<StoryCard anchor="left" hue="rose" lead={copy.lead} body={copy.body} />}
    />
  );
}
