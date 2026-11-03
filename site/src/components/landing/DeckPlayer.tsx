// The hero player: a real example deck in a frame, with a title bar above it (the
// prompt that drafted it and the run's figures) and a caption bar under it (step
// pips, the counter, the controls, and the current step's caption as page text,
// because the slide's own card is too small to read at landing-page width).
//
// Before any interaction the frame shows the deck's poster, or a short muted loop
// captured from the real deck by `make demo` when there is one and motion is
// allowed. The first control press, arrow key or gallery pick swaps in the live
// deck, a same-origin iframe driven through the embed contract
// (src/lib/player/protocol.ts), at the step the loop was showing.
//
// Server-rendered, it shows the poster, the start step's caption and a link to
// the deck's static build, so it reads without JavaScript.
import {
  type KeyboardEvent,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { track } from "../../lib/analytics";
import { Events } from "../../lib/events";
import { draftLine, type Example, markAt, posterSrcset, stateAt } from "../../lib/player/example";
import { announcement, counterText, dwellMs, mirrorCopy, stepsOf } from "../../lib/player/format";
import {
  atEnd,
  type Command,
  command,
  type DeckMeta,
  type DeckState,
  parseDeckMessage,
} from "../../lib/player/protocol";

type Phase = "poster" | "loop" | "booting" | "ready" | "failed";
type Position = { slide: number; beat: number };

/** How long a deck may take to answer before the player gives up and links to it. */
export const BOOT_TIMEOUT_MS = 15_000;
/** The window event the example gallery sends (src/scripts/site.ts): `detail` is a deck name. */
export const PICK_EVENT = "decks:pick";
/** Most pips the caption bar draws; a slide with more steps shows the counter alone. */
const MAX_PIPS = 12;

declare global {
  interface Window {
    /** A gallery pick made before the player hydrated. */
    __decksPick?: string;
  }
}

const motionAllowed = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: no-preference)").matches === true;

/** The state the player shows for a recorded position, before the live deck answers. */
function recordedState(example: Example, at: Position): DeckState {
  const recorded = stateAt(example, at.slide, at.beat);
  return {
    slide: at.slide,
    slides: example.slides,
    beat: at.beat,
    beats: recorded?.beats ?? 0,
    lead: recorded?.lead ?? "",
    body: recorded?.body ?? "",
    settled: true,
    direction: null,
  };
}

const startOf = (example: Example): Position => ({
  slide: example.startSlide,
  beat: example.startBeat,
});

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
      <path d={ICONS[name]} fill="currentColor" />
    </svg>
  );
}

const ICONS = {
  slideBack: "M4 4h2v12H4zM16 4v12L8 10z",
  back: "M14 4v12L5 10z",
  play: "M6 4v12l10-6z",
  pause: "M5 4h3.5v12H5zM11.5 4H15v12h-3.5z",
  next: "M6 4v12l9-6z",
  slideNext: "M4 4v12l8-6zM14 4h2v12h-2z",
  fullscreen: "M3 3h5v2H5v3H3zM12 3h5v5h-2V5h-3zM3 12h2v3h3v2H3zM15 12h2v5h-5v-2h3z",
} as const;

function Control({
  label,
  icon,
  onClick,
  pressed,
  primary = false,
}: {
  label: string;
  icon: keyof typeof ICONS;
  onClick: () => void;
  pressed?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      className="control"
      data-primary={primary || undefined}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onClick={onClick}
    >
      <Icon name={icon} />
    </button>
  );
}

export function DeckPlayer({ examples, initial = 0 }: { examples: Example[]; initial?: number }) {
  const id = useId();
  const [hydrated, setHydrated] = useState(false);
  const [index, setIndex] = useState(initial);
  const [phase, setPhase] = useState<Phase>("poster");
  const [deck, setDeck] = useState<DeckState | null>(null);
  const [meta, setMeta] = useState<DeckMeta | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loopAt, setLoopAt] = useState<Position | null>(null);
  const [loopPaused, setLoopPaused] = useState(false);
  /** The loop has drawn a frame: the poster under it can go. */
  const [loopShowing, setLoopShowing] = useState(false);
  const [bootCount, setBootCount] = useState(0);
  const [spoken, setSpoken] = useState("");
  const [canFullscreen, setCanFullscreen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const pending = useRef<Command | null>(null);
  const target = useRef<Position>({ slide: 1, beat: 0 });
  const positioned = useRef(false);
  const bootTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const example = examples[index] ?? examples[0];

  useEffect(() => {
    setHydrated(true);
    setCanFullscreen(document.fullscreenEnabled === true);
    const first = examples[initial];
    if (first?.loop && motionAllowed()) setPhase("loop");
    const onChange = () => setFullscreen(document.fullscreenElement === wrapper.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [examples, initial]);

  const send = useCallback((message: Command) => {
    frame.current?.contentWindow?.postMessage(message, window.location.origin);
  }, []);

  const boot = useCallback((at: Position, then: Command | null) => {
    target.current = at;
    pending.current = then;
    positioned.current = false;
    setDeck(null);
    setMeta(null);
    setPhase("booting");
    setBootCount((count) => count + 1);
    clearTimeout(bootTimer.current);
    bootTimer.current = setTimeout(() => {
      setPhase((current) => (current === "booting" ? "failed" : current));
      setPlaying(false);
    }, BOOT_TIMEOUT_MS);
  }, []);

  // Messages from the deck. Only the current iframe, only this origin.
  useEffect(() => {
    if (!example) return;
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!frame.current || event.source !== frame.current.contentWindow) return;
      const message = parseDeckMessage(event.data);
      if (!message) return;
      if (message.type === "decks:meta") {
        setMeta({ title: message.title, slides: message.slides, slideTitles: message.slideTitles });
        return;
      }
      if (message.type !== "decks:state") return;
      const { type: _type, ...state } = message;
      if (!positioned.current) {
        // The deck opens wherever its URL points; the picture shows the target step.
        const { slide, beat } = target.current;
        if (state.slide !== slide || state.beat !== beat) {
          if (state.settled) send(command.go(slide, beat));
          return;
        }
        if (!state.settled) return;
        positioned.current = true;
        clearTimeout(bootTimer.current);
        setPhase("ready");
        const queued = pending.current;
        pending.current = null;
        if (queued) send(queued);
      }
      setDeck(state);
      if (state.settled) {
        const titles = meta?.slideTitles ?? example.slideTitles;
        setSpoken(announcement(state, titles[state.slide - 1] ?? ""));
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [example, send, meta]);

  // Play: hold each settled step for its reading time, then advance; stop at the end.
  useEffect(() => {
    if (!playing || phase !== "ready" || !deck?.settled) return;
    if (atEnd(deck)) {
      setPlaying(false);
      return;
    }
    const titles = meta?.slideTitles ?? example?.slideTitles ?? [];
    const timer = setTimeout(() => send(command.next()), dwellMs(mirrorCopy(deck, titles)));
    return () => clearTimeout(timer);
  }, [playing, phase, deck, meta, example, send]);

  useEffect(() => () => clearTimeout(bootTimer.current), []);

  /** Load a deck the gallery picked: the live deck at its start step. */
  const pick = useCallback(
    (name: string) => {
      const next = examples.findIndex((item) => item.name === name);
      const picked = examples[next];
      if (!picked) return;
      track(Events.exampleSelected, { example: picked.name });
      setIndex(next);
      setPlaying(false);
      setLoopAt(null);
      setSpoken(`${picked.title} loaded.`);
      boot(startOf(picked), null);
    },
    [examples, boot],
  );

  useEffect(() => {
    const onPick = (event: Event) => {
      const name = (event as CustomEvent<string>).detail;
      window.__decksPick = undefined;
      if (typeof name === "string") pick(name);
    };
    window.addEventListener(PICK_EVENT, onPick);
    if (window.__decksPick) {
      pick(window.__decksPick);
      window.__decksPick = undefined;
    }
    return () => window.removeEventListener(PICK_EVENT, onPick);
  }, [pick]);

  if (!example) return null;

  /** Where the live deck should open: the loop's step when it was showing, else the start. */
  const here = (): Position => (phase === "loop" && loopAt ? loopAt : startOf(example));
  const idle = phase === "poster" || phase === "loop" || phase === "failed";

  const play = () => {
    if (phase === "loop" && !loopPaused) {
      video.current?.pause();
      setLoopPaused(true);
      return;
    }
    if (playing) {
      setPlaying(false);
      return;
    }
    track(Events.playerPlayed, { example: example.name });
    setPlaying(true);
    if (phase === "ready" && deck && atEnd(deck)) send(command.go(example.startSlide, 0));
    else if (idle) boot(here(), null);
  };
  const step = (message: Command) => {
    track(Events.beatStepped, { cmd: message.cmd });
    setPlaying(false);
    if (phase === "ready") send(message);
    else if (idle) boot(here(), message);
  };
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void wrapper.current?.requestFullscreen();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const moves: Record<string, Command> = {
      ArrowRight: event.shiftKey ? command.nextSlide() : command.next(),
      ArrowLeft: event.shiftKey ? command.prevSlide() : command.prev(),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    step(move);
  };

  const onLoopTime = (event: SyntheticEvent<HTMLVideoElement>) => {
    if (!example.loop) return;
    const mark = markAt(example.loop, event.currentTarget.currentTime);
    if (mark && (mark.slide !== loopAt?.slide || mark.beat !== loopAt?.beat)) {
      setLoopAt({ slide: mark.slide, beat: mark.beat });
    }
  };

  const shown =
    deck ??
    (phase === "loop" && loopAt
      ? recordedState(example, loopAt)
      : recordedState(example, phase === "booting" ? target.current : startOf(example)));
  const titles = meta?.slideTitles.length ? meta.slideTitles : example.slideTitles;
  const caption = mirrorCopy(shown, titles);
  const steps = stepsOf(shown);
  const looping = phase === "loop" && !loopPaused;
  const running = looping || (playing && (phase === "ready" || phase === "booting"));
  // index.html by name: the Astro dev server serves no directory index from public/.
  // Slidev reads ?clicks= inside the hash, so the deck lands on the step directly.
  const at = target.current;
  const frameSrc = `${example.href}index.html#/${at.slide}${at.beat ? `?clicks=${at.beat}` : ""}`;
  const deckLink = `${example.href}#/${shown.slide}${shown.beat ? `?clicks=${shown.beat}` : ""}`;
  const poster = example.poster;
  const sizes = "(min-width: 768px) 900px, 100vw";

  return (
    <div className="player-stack">
      {/* The player takes focus (tabIndex 0) so the arrow keys step the deck while the iframe inside stays inert. It is a div, not a fieldset, because it is also the full-screen element. */}
      {/* biome-ignore lint/a11y/useSemanticElements: see above */}
      <div
        ref={wrapper}
        role="group"
        aria-label={`Deck player: ${example.title}. Arrow keys step, Shift moves a slide.`}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: see above
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="player"
        data-player
        data-phase={phase}
        data-fullscreen={fullscreen || undefined}
      >
        <div className="player-titlebar">
          {example.run ? (
            <>
              <p className="titlebar-prompt">
                <span aria-hidden="true" className="titlebar-caret">
                  ❯
                </span>{" "}
                claude -p "{example.run.prompt}"
              </p>
              <p className="titlebar-stats">
                Claude Code · {example.run.minutes} min · {example.run.turns} turns ·{" "}
                {example.run.cost}
              </p>
            </>
          ) : (
            <>
              <p className="titlebar-title">{example.title}</p>
              <p className="titlebar-stats">{example.provenance.label}</p>
            </>
          )}
        </div>

        <div className="player-frame">
          <div className="player-canvas">
            {(phase === "booting" || phase === "ready") && (
              <iframe
                key={`${example.name}-${bootCount}`}
                ref={frame}
                src={frameSrc}
                title={`${example.title}, controlled by the player`}
                tabIndex={-1}
                inert
                allow="screen-wake-lock"
              />
            )}
            {phase === "loop" && example.loop && (
              <video
                ref={video}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                width={example.loop.width}
                height={example.loop.height}
                onTimeUpdate={onLoopTime}
                onPlaying={() => setLoopShowing(true)}
                aria-label={`${example.title}: a recording of three steps forward and back`}
              >
                <source src={`${example.loop.base}.webm`} type="video/webm" />
                <source src={`${example.loop.base}.mp4`} type="video/mp4" />
              </video>
            )}
            {/* The poster stays over the loop until the video plays, so it needs no poster image of its own. */}
            {phase !== "ready" &&
              !(phase === "loop" && loopShowing) &&
              (poster ? (
                <picture>
                  <source type="image/avif" srcSet={posterSrcset(poster, "avif")} sizes={sizes} />
                  <source type="image/webp" srcSet={posterSrcset(poster, "webp")} sizes={sizes} />
                  <img
                    src={`${poster.base}-1280.webp`}
                    width={poster.width}
                    height={poster.height}
                    alt={`${example.title}, slide ${example.startSlide}: ${caption.lead}`}
                    fetchPriority={index === initial ? "high" : "auto"}
                  />
                </picture>
              ) : (
                <p className="player-message">No poster yet. Run make demo.</p>
              ))}
            {phase === "failed" && (
              <p className="player-message">
                The deck didn't load.{" "}
                <a href={example.href} target="_blank" rel="noopener">
                  Open it in a new tab
                </a>
              </p>
            )}
          </div>
        </div>

        <div className="player-caption">
          <div className="caption-text">
            <p className="caption-lead">{caption.lead}</p>
            {caption.body && <p className="caption-body">{caption.body}</p>}
          </div>
          <div className="caption-side">
            <span className="controls js-only">
              <Control
                label="Slide back"
                icon="slideBack"
                onClick={() => step(command.prevSlide())}
              />
              <Control label="Step back" icon="back" onClick={() => step(command.prev())} />
              <Control
                label={running ? "Pause" : "Play"}
                icon={running ? "pause" : "play"}
                onClick={play}
                primary
              />
              <Control label="Step forward" icon="next" onClick={() => step(command.next())} />
              <Control
                label="Slide forward"
                icon="slideNext"
                onClick={() => step(command.nextSlide())}
              />
              {hydrated && canFullscreen && (
                <Control
                  label={fullscreen ? "Exit full screen" : "Full screen"}
                  icon="fullscreen"
                  onClick={toggleFullscreen}
                  pressed={fullscreen}
                />
              )}
            </span>
            <span className="caption-meta">
              {steps <= MAX_PIPS && (
                <span aria-hidden="true" className="pips">
                  {Array.from({ length: steps }, (_, pip) => (
                    <span
                      // biome-ignore lint/suspicious/noArrayIndexKey: pips are positions, not items.
                      key={pip}
                      className="pip"
                      data-state={
                        pip < shown.beat ? "past" : pip === shown.beat ? "now" : undefined
                      }
                    />
                  ))}
                </span>
              )}
              <span className="counter">
                <span aria-hidden="true">{counterText(shown)}</span>
                <span className="sr-only">
                  Slide {shown.slide} of {shown.slides}, step {shown.beat + 1} of {steps}
                </span>
              </span>
              <a className="open-deck" href={deckLink} target="_blank" rel="noopener">
                Open the deck<span className="phone-only"> (best in landscape)</span>
              </a>
            </span>
          </div>
          <p className="sr-only" aria-live="polite" id={`${id}-live`}>
            {spoken}
          </p>
        </div>
      </div>

      {example.run && (
        <div className="player-notes">
          <p>{draftLine(example.run, example.edits)}</p>
          {example.edits && example.edits.pairs.length > 0 && (
            <dl className="edit-pairs">
              {example.edits.pairs.map((pair) => (
                <div key={pair.before} className="edit-pair">
                  <dt>Draft</dt>
                  <dd>
                    <del>{pair.before}</del>
                  </dd>
                  <dt>Edited</dt>
                  <dd>
                    <ins>{pair.after}</ins>
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </div>
  );
}
