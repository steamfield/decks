import "@steamfield/ui/agent-demo/styles.css";
import "@steamfield/ui/window/styles.css";
import { AgentDemo, StaticTranscript, useAgentDemo } from "@steamfield/ui/react/agent-demo";
import { DemoWindow } from "@steamfield/ui/react/window";
import type { DemoScript, Step } from "@steamfield/ui/script";
import type { Timing } from "@steamfield/ui/sequencer";
import { presets } from "@steamfield/ui/sequencer";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { site } from "../../config";
import { agentSession, phoneScript, turns } from "../../data/agent-session";
import { track } from "../../lib/analytics";
import { Events } from "../../lib/events";
import { type Poster, posterSrcset } from "../../lib/player/example";
import type { StageController } from "../../lib/stage/controller";
import { DeckStage } from "./DeckStage";

/** How long the finished deck holds before the session loops. */
export const FINISHED_HOLD_MS = 4000;

// The terminal preset, with each prompt typed in its script's `typingMs` (turn 1's is 0, so it
// is already submitted at first paint) and agent text shown a line at a time, so the lead line
// is whole when the transcript pauses on it.
const timing: Partial<Timing> = {
  ...presets.terminal,
  typeMsPerChar: (step) => (step.typingMs ?? 0) / Math.max(1, step.text.length),
  streamUnit: "line",
};

const PHONE = "(max-width: 767px)";
const subscribePhone = (change: () => void) => {
  const query = matchMedia(PHONE);
  query.addEventListener("change", change);
  return () => query.removeEventListener("change", change);
};

/** The turn a step belongs to: the number of prompts up to and including it, less one. */
const turnOf = (script: DemoScript, index: number) =>
  script.steps.slice(0, index + 1).filter((step) => step.kind === "user").length - 1;

/** Turn 1 flips through the whole draft, a slide at a time; later turns step their beats. */
const dwellFor = (turn: number) => (turn === 0 ? 1500 : 1000);

type Props = {
  /** The deck's page, `/d/agent-hero/index.html`. */
  src: string;
  /** The finished deck, opened from the fine print. */
  href: string;
  posters: { start: Poster; finished: Poster };
  /** The no-JavaScript view, a `<noscript>` from the page. */
  children?: ReactNode;
};

// The stage is about 540px wide beside the transcript, and the column's width on a phone.
const STAGE_SIZES = "(min-width: 1024px) 540px, 100vw";

/**
 * A poster in the stage's frame. `still` is the reduced-motion view, which landing.css shows
 * in place of the live one; it loads lazily, so a display:none still poster costs nothing.
 */
function StagePoster({ poster, label, still }: { poster: Poster; label: string; still: boolean }) {
  return (
    <div
      className={`deck-stage ${still ? "agent-session-still" : "agent-session-live"}`}
      role="img"
      aria-label={label}
    >
      <picture>
        {(["avif", "webp"] as const).map((format) => (
          <source
            key={format}
            type={`image/${format}`}
            srcSet={posterSrcset(poster, format)}
            sizes={STAGE_SIZES}
          />
        ))}
        <img
          src={`${poster.base}-1280.webp`}
          width={poster.width}
          height={poster.height}
          alt=""
          loading={still ? "lazy" : "eager"}
          fetchPriority={still ? "auto" : "high"}
        />
      </picture>
    </div>
  );
}

/**
 * The landing hero: a scripted agent session in a terminal beside the deck it builds. Each turn
 * holds the deck on its starting state while the prompt and tool calls run, pauses the transcript
 * on the agent's lead line, plays the result on the deck, and resumes once the deck has settled.
 */
export function AgentSession({ src, href, posters, children }: Props) {
  const phone = useSyncExternalStore(
    subscribePhone,
    () => matchMedia(PHONE).matches,
    () => false,
  );
  const script = phone ? phoneScript : agentSession;
  const copy = site.agentSession;

  const stage = useRef<StageController | null>(null);
  const flags = useRef({
    /** A beat-strip jump is moving the clock; the steps it skips are not played. */
    seeking: false,
    /** The play the transcript is waiting on, or null. */
    waiting: null as symbol | null,
    userPaused: false,
    turn: -1,
    reached: new Set<number>(),
    completed: false,
  });
  const [userPaused, setUserPaused] = useState(false);
  const [built, setBuilt] = useState(-1);
  const hold = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const scriptRef = useRef(script);
  const controlsRef = useRef<ReturnType<typeof useAgentDemo>["controls"] | null>(null);

  const stopWaiting = () => {
    flags.current.waiting = null;
  };

  const enterTurn = (turn: number) => {
    const target = turns[turn];
    if (!target) throw new Error(`The agent session has no turn ${turn + 1}`);
    flags.current.turn = turn;
    setBuilt(turn - 1);
    stage.current?.show(target.hold.slide, target.hold.beat);
    if (!flags.current.reached.has(turn)) {
      flags.current.reached.add(turn);
      track(Events.agentDemoTurnReached, { turn: turn + 1 });
    }
  };

  const land = (turn: number) => {
    const controls = controlsRef.current;
    const target = turns[turn];
    if (!stage.current || !controls || !target) return;
    const token = Symbol(target.label);
    flags.current.waiting = token;
    controls.pause();
    const resume = () => {
      if (flags.current.waiting !== token) return;
      stopWaiting();
      // A viewer's pause outlasts the deck: only the play button resumes it.
      if (!flags.current.userPaused) controls.play();
    };
    stage.current.play(target.result, { dwellMs: dwellFor(turn) }).then(
      (result) => {
        // A cancelled play was superseded by a jump or a replay, which owns the clock now.
        if (result.cancelled || flags.current.waiting !== token) return;
        setBuilt(turn);
        resume();
      },
      (error: unknown) => {
        // The deck failed; the transcript carries on without it and the error still surfaces.
        resume();
        throw error;
      },
    );
  };

  const onStepStart = (index: number, step: Step) => {
    if (flags.current.seeking) return;
    const turn = turnOf(scriptRef.current, index);
    if (step.kind === "user") enterTurn(turn);
    else if (step.kind === "agent-text") land(turn);
  };

  const restart = () => {
    clearTimeout(hold.current);
    stopWaiting();
    stage.current?.cancel();
    controlsRef.current?.replay();
  };

  const onComplete = () => {
    if (!flags.current.completed) {
      flags.current.completed = true;
      track(Events.agentDemoCompleted);
    }
    clearTimeout(hold.current);
    hold.current = setTimeout(() => {
      if (!flags.current.userPaused) restart();
    }, FINISHED_HOLD_MS);
  };

  const demo = useAgentDemo(script, {
    scriptKey: phone ? "agent-hero-phone" : "agent-hero",
    timing,
    beforeStart: "start",
    onStepStart,
    onComplete,
  });
  useLayoutEffect(() => {
    scriptRef.current = script;
    controlsRef.current = demo.controls;
  });
  useEffect(() => () => clearTimeout(hold.current), []);

  const onController = useCallback((controller: StageController) => {
    stage.current = controller;
    // The clock may have started turn 1 before the stage mounted.
    const target = turns[flags.current.turn];
    if (target) controller.show(target.hold.slide, target.hold.beat);
  }, []);

  const { controls } = demo;
  const pause = () => {
    flags.current.userPaused = true;
    setUserPaused(true);
    clearTimeout(hold.current);
    controls.pause();
  };
  const play = () => {
    flags.current.userPaused = false;
    setUserPaused(false);
    if (demo.complete) restart();
    else if (!flags.current.waiting) controls.play();
  };
  const replay = () => {
    flags.current.userPaused = false;
    setUserPaused(false);
    restart();
  };
  const jump = (turn: number) => {
    const target = demo.timeline.turnStarts[turn];
    if (target === undefined) return;
    clearTimeout(hold.current);
    stopWaiting();
    flags.current.seeking = true;
    try {
      stage.current?.cancel();
      enterTurn(turn);
      controls.seek(target);
    } finally {
      flags.current.seeking = false;
    }
    if (!flags.current.userPaused) controls.play();
  };

  const running = demo.started && !userPaused;
  const bar = demo.ready && !demo.reduced && (
    <div className="agent-session-controls">
      <fieldset className="agent-session-steps">
        <legend className="sr-only">Jump to a step</legend>
        {turns.map((turn, index) => (
          <button
            key={turn.label}
            type="button"
            aria-current={demo.turn === index ? "step" : undefined}
            onClick={() => jump(index)}
          >
            {turn.label}
          </button>
        ))}
      </fieldset>
      <button type="button" className="agent-session-toggle" onClick={running ? pause : play}>
        {running ? "Pause" : "Play"}
      </button>
      <button type="button" className="agent-session-toggle" onClick={replay}>
        Replay
      </button>
    </div>
  );

  const label = copy.stageLabels[built + 1] ?? copy.stageLabels[0] ?? "";
  const finishedLabel = copy.stageLabels.at(-1) ?? "";
  const live = demo.ready && !demo.reduced;

  return (
    <div className="agent-session" ref={demo.ref}>
      <DemoWindow className="agent-session-window js-only" controls={bar}>
        <div className="agent-session-body">
          <div className="agent-session-transcript">
            <AgentDemo
              className="agent-session-live"
              script={script}
              scriptKey={phone ? "agent-hero-phone" : "agent-hero"}
              layout="terminal"
              timing={timing}
              position={{ ms: demo.view.elapsed }}
              labels={{ transcript: "Agent session transcript" }}
            />
            <StaticTranscript
              className="agent-session-still"
              script={script}
              layout="terminal"
              labels={{ transcript: "Agent session transcript" }}
            />
          </div>
          <div className="agent-session-stage">
            {live ? (
              <DeckStage
                src={src}
                poster={posters.start}
                label={label}
                onController={onController}
                initialHash={`/${turns[0]?.hold.slide ?? 1}`}
              />
            ) : (
              <>
                <StagePoster poster={posters.start} label={label} still={false} />
                <StagePoster poster={posters.finished} label={finishedLabel} still />
              </>
            )}
          </div>
        </div>
      </DemoWindow>
      {children}
      <p className="agent-session-fineprint">
        {copy.fineprint}{" "}
        <a href={href} onClick={() => track(Events.exampleOpened, { example: "agent-hero" })}>
          {copy.openDeck} <span aria-hidden="true">→</span>
        </a>
      </p>
    </div>
  );
}
