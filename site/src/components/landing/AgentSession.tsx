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
import type { Poster } from "../../lib/player/example";
import type { StageController } from "../../lib/stage/controller";
import { DeckStage } from "./DeckStage";

/** How long the finished deck holds before the session loops. */
export const FINISHED_HOLD_MS = 4000;

/** The playing transcript's accessible name. */
export const LIVE_TRANSCRIPT = "Agent session transcript";
/** The whole transcript's name, shown under reduced motion. */
export const STILL_TRANSCRIPT = "Agent session transcript, every turn";

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
  /** The finished deck, opened from the link under the session. */
  href: string;
  posters: { start: Poster; finished: Poster };
  /** The no-JavaScript view, a `<noscript>` from the page. */
  children?: ReactNode;
};

// The stage is about 540px wide beside the transcript, and the column's width on a phone.
const STAGE_SIZES = "(min-width: 1024px) 540px, 100vw";

/**
 * The landing hero: a scripted agent session in a terminal beside the deck it builds. Each turn
 * holds the deck on its starting state while the prompt and tool calls run, pauses the transcript
 * on the agent's lead line, plays the result on the deck, and resumes once the deck has settled.
 * After the deck's first failure the transcript runs on alone and the stage keeps what it shows.
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
    /** The deck failed once; the session no longer drives or waits for it. */
    failed: false,
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

  /** The deck missed its deadline or reported an error: stop driving it, once, loudly. */
  const failStage = (error: unknown) => {
    if (flags.current.failed) return;
    flags.current.failed = true;
    console.error("The hero's deck stage failed; the session carries on without it.", error);
  };

  /** Shows a turn's hold; a cancelled show was superseded and needs nothing. */
  const showHold = (controller: StageController, turn: number) => {
    const target = turns[turn];
    if (!target || flags.current.failed) return;
    controller.show(target.hold.slide, target.hold.beat).catch(failStage);
  };

  const enterTurn = (turn: number) => {
    if (!turns[turn]) throw new Error(`The agent session has no turn ${turn + 1}`);
    flags.current.turn = turn;
    // A failed stage keeps showing what it last showed, and its name says so.
    if (!flags.current.failed) setBuilt(turn - 1);
    if (stage.current) showHold(stage.current, turn);
    if (!flags.current.reached.has(turn)) {
      flags.current.reached.add(turn);
      track(Events.agentDemoTurnReached, { turn: turn + 1 });
    }
  };

  const land = (turn: number) => {
    const controls = controlsRef.current;
    const target = turns[turn];
    if (!stage.current || !controls || !target || flags.current.failed) return;
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
        // A jump or a replay stops waiting before it cancels the play, so a cancelled play
        // still waited on was superseded by something else (a new script, the stage going away)
        // and the transcript resumes as it would after the result.
        if (!result.cancelled && flags.current.waiting === token) setBuilt(turn);
        resume();
      },
      (error: unknown) => {
        failStage(error);
        resume();
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
  useEffect(
    () => () => {
      clearTimeout(hold.current);
      // A play the stage cancels on unmount must not resume a transcript that is gone.
      flags.current.waiting = null;
    },
    [],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: showHold reads only refs, so the callback stays stable
  const onController = useCallback((controller: StageController | null) => {
    stage.current = controller;
    if (!controller) return;
    if (flags.current.userPaused) controller.pause();
    // The clock may have started turn 1 before the stage mounted.
    showHold(controller, flags.current.turn);
  }, []);

  const { controls } = demo;
  const pause = () => {
    flags.current.userPaused = true;
    setUserPaused(true);
    clearTimeout(hold.current);
    controls.pause();
    stage.current?.pause();
  };
  const play = () => {
    flags.current.userPaused = false;
    setUserPaused(false);
    stage.current?.resume();
    if (demo.complete) restart();
    else if (!flags.current.waiting) controls.play();
  };
  const replay = () => {
    flags.current.userPaused = false;
    setUserPaused(false);
    stage.current?.resume();
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

  const finishedLabel = copy.stageLabels.at(-1) ?? "";
  const label = demo.reduced
    ? finishedLabel
    : (copy.stageLabels[built + 1] ?? copy.stageLabels[0] ?? "");

  return (
    <div className="agent-session" ref={demo.ref}>
      <DemoWindow className="agent-session-window brand-top js-only" controls={bar}>
        <div className="agent-session-body">
          <div className="agent-session-transcript">
            <AgentDemo
              className="agent-session-live"
              script={script}
              scriptKey={phone ? "agent-hero-phone" : "agent-hero"}
              layout="terminal"
              timing={timing}
              position={{ ms: demo.view.elapsed }}
              labels={{ transcript: LIVE_TRANSCRIPT }}
            />
            <StaticTranscript
              className="agent-session-still"
              script={script}
              layout="terminal"
              labels={{ transcript: STILL_TRANSCRIPT }}
            />
          </div>
          <div className="agent-session-stage">
            {/* The server's HTML can't know the motion preference, so until hydration the
                picture and the name follow it through media queries. */}
            <DeckStage
              src={src}
              poster={posters.start}
              reducedPoster={posters.finished}
              label={label}
              reducedLabel={demo.ready ? undefined : finishedLabel}
              still={!demo.ready || demo.reduced}
              onController={onController}
              initialHash={`/${turns[0]?.hold.slide ?? 1}`}
              sizes={STAGE_SIZES}
            />
          </div>
        </div>
      </DemoWindow>
      {children}
      <p className="agent-session-fineprint">
        <a href={href} onClick={() => track(Events.exampleOpened, { example: "agent-hero" })}>
          {copy.openDeck} <span aria-hidden="true">→</span>
        </a>
      </p>
    </div>
  );
}
