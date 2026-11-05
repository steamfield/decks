import "../../styles/player.css";
import {
  type CSSProperties,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { track } from "../../lib/analytics";
import { Events } from "../../lib/events";
import {
  draftLine,
  type Example,
  firstStorySlide,
  posterSrcset,
  stateAt,
} from "../../lib/player/example";
import { announcement, dwellMs, mirrorCopy, stepsOf } from "../../lib/player/format";
import { PICK_EVENT } from "../../lib/player/pick";
import {
  atEnd,
  type Command,
  command,
  type DeckMeta,
  type DeckState,
  parseDeckMessage,
} from "../../lib/player/protocol";

type Phase = "poster" | "booting" | "ready" | "failed";
type Position = { slide: number; beat: number };

/** How long a deck may take to answer before the player gives up and links to it. */
export const BOOT_TIMEOUT_MS = 15_000;

const MOTION = "(prefers-reduced-motion: no-preference)";

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

/** A lazy story stage is ready once the card promised by its captured state exists. */
function cardReady(example: Example, state: DeckState): boolean {
  const expected = stateAt(example, state.slide, state.beat);
  return (
    (!expected?.lead.trim() || Boolean(state.lead.trim())) &&
    (!expected?.body.trim() || Boolean(state.body.trim()))
  );
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
  back: "M14 4v12L5 10z",
  play: "M6 4v12l10-6z",
  pause: "M5 4h3.5v12H5zM11.5 4H15v12h-3.5z",
  next: "M6 4v12l9-6z",
  fullscreen: "M3 3h5v2H5v3H3zM12 3h5v5h-2V5h-3zM3 12h2v3h3v2H3zM15 12h2v5h-5v-2h3z",
} as const;

function Control({
  label,
  icon,
  onClick,
  pressed,
  primary = false,
  disabled = false,
}: {
  label: string;
  icon: keyof typeof ICONS;
  onClick: () => void;
  pressed?: boolean;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
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

/** Compute from the desired position so rapid input is coalesced without losing intent. */
function moved(example: Example, from: Position, message: Command): Position {
  const beats = (slide: number) =>
    Math.max(0, ...example.states.filter((s) => s.slide === slide).map((s) => s.beats));
  if (message.cmd === "go")
    return {
      slide: Math.min(example.slides, Math.max(1, message.slide)),
      beat: Math.max(0, message.beat),
    };
  if (message.cmd === "nextSlide")
    return { slide: Math.min(example.slides, from.slide + 1), beat: 0 };
  if (message.cmd === "prevSlide") return { slide: Math.max(1, from.slide - 1), beat: 0 };
  if (message.cmd === "next")
    return from.beat < beats(from.slide)
      ? { slide: from.slide, beat: from.beat + 1 }
      : from.slide < example.slides
        ? { slide: from.slide + 1, beat: 0 }
        : from;
  return from.beat > 0
    ? { slide: from.slide, beat: from.beat - 1 }
    : from.slide > 1
      ? { slide: from.slide - 1, beat: beats(from.slide - 1) }
      : from;
}
const equal = (a: Position, b: Position) => a.slide === b.slide && a.beat === b.beat;

export function DeckPlayer({
  examples,
  initial = 0,
  autoplay = true,
  priority = false,
  gallery = false,
}: {
  examples: Example[];
  initial?: number;
  autoplay?: boolean;
  priority?: boolean;
  gallery?: boolean;
}) {
  const [index, setIndex] = useState(initial);
  const example = examples[index] ?? examples[0];
  const [phase, setPhase] = useState<Phase>("poster");
  const [deck, setDeck] = useState<DeckState | null>(null);
  const [meta, setMeta] = useState<DeckMeta | null>(null);
  const [playing, setPlaying] = useState(false);
  const [, refreshDesired] = useState(0);
  const [bootCount, setBootCount] = useState(0);
  const [spoken, setSpoken] = useState("");
  const [canFullscreen, setCanFullscreen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState("");
  const wrapper = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const target = useRef<Position>(example ? startOf(example) : { slide: 1, beat: 0 });
  const desired = useRef<Position>(target.current);
  const actual = useRef<DeckState | null>(null);
  const positioned = useRef(false);
  const flight = useRef<number | null>(null);
  const serial = useRef(0);
  const completed = useRef(0);
  const openingHold = useRef(false);
  const bootTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const navigationTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const phaseRef = useRef<Phase>(phase);
  phaseRef.current = phase;

  const send = useCallback((message: Command) => {
    const requestId = ++serial.current;
    flight.current = requestId;
    clearTimeout(navigationTimer.current);
    navigationTimer.current = setTimeout(() => {
      phaseRef.current = "failed";
      setPhase("failed");
      setPlaying(false);
      completed.current = Math.max(completed.current, flight.current ?? 0);
      flight.current = null;
      setSpoken("The deck did not finish navigating. Retry or open it in a new tab.");
    }, BOOT_TIMEOUT_MS);
    frame.current?.contentWindow?.postMessage({ ...message, requestId }, window.location.origin);
  }, []);
  const flush = useCallback(() => {
    if (!positioned.current || flight.current !== null || !actual.current?.settled) return;
    if (!equal(actual.current, desired.current))
      send(command.go(desired.current.slide, desired.current.beat));
  }, [send]);
  const boot = useCallback((at: Position) => {
    clearTimeout(navigationTimer.current);
    target.current = at;
    desired.current = at;
    positioned.current = false;
    actual.current = null;
    flight.current = null;
    setDeck(null);
    setMeta(null);
    phaseRef.current = "booting";
    setPhase("booting");
    setBootCount((count) => count + 1);
    clearTimeout(bootTimer.current);
    bootTimer.current = setTimeout(() => {
      phaseRef.current = "failed";
      setPhase("failed");
      setPlaying(false);
      flight.current = null;
    }, BOOT_TIMEOUT_MS);
  }, []);
  const step = useCallback(
    (message: Command) => {
      if (!example) return;
      setPlaying(false);
      openingHold.current = false;
      track(Events.beatStepped, { cmd: message.cmd });
      if (phaseRef.current !== "ready" && phaseRef.current !== "booting") boot(desired.current);
      desired.current = moved(example, desired.current, message);
      refreshDesired((value) => value + 1);
      flush();
    },
    [example, boot, flush],
  );

  useEffect(() => {
    const first = examples[initial] ?? examples[0];
    if (!first) return;
    openingHold.current =
      autoplay && Boolean(window.matchMedia?.(MOTION).matches) && !document.hidden;
    setPlaying(openingHold.current);
    boot(startOf(first));
  }, [examples, initial, boot, autoplay]);

  useEffect(() => {
    setCanFullscreen(document.fullscreenEnabled === true);
    const motion = window.matchMedia?.(MOTION);
    const onMotion = () => {
      if (!motion?.matches) {
        openingHold.current = false;
        setPlaying(false);
      }
    };
    const onFullscreen = () => setFullscreen(document.fullscreenElement === wrapper.current);
    motion?.addEventListener?.("change", onMotion);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      motion?.removeEventListener?.("change", onMotion);
      document.removeEventListener("fullscreenchange", onFullscreen);
    };
  }, []);

  useEffect(() => {
    if (!example) return;
    const onMessage = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        !frame.current ||
        event.source !== frame.current.contentWindow
      )
        return;
      const message = parseDeckMessage(event.data);
      if (!message || phaseRef.current === "failed") return;
      if (message.type === "decks:error") {
        clearTimeout(bootTimer.current);
        clearTimeout(navigationTimer.current);
        phaseRef.current = "failed";
        setPhase("failed");
        setPlaying(false);
        flight.current = null;
        setSpoken(message.message);
        return;
      }
      if (message.type === "decks:navigate") {
        step({ type: "decks:cmd", cmd: message.cmd });
        return;
      }
      if (message.type === "decks:interaction") {
        openingHold.current = false;
        setPlaying(false);
        return;
      }
      if (message.type === "decks:meta") {
        setMeta(message);
        return;
      }
      if (message.type !== "decks:state") return;
      const { type: _type, ...state } = message;
      if (state.requestId !== undefined) {
        if (flight.current !== null && state.requestId !== flight.current) return;
        if (flight.current === null && state.requestId <= completed.current) return;
        if (state.settled) completed.current = Math.max(completed.current, state.requestId);
      }
      actual.current = state;
      if (!positioned.current) {
        if (!state.settled) return;
        if (
          flight.current !== null &&
          state.requestId !== undefined &&
          state.requestId !== flight.current
        )
          return;
        flight.current = null;
        clearTimeout(navigationTimer.current);
        if (!equal(state, target.current)) {
          send(command.go(target.current.slide, target.current.beat));
          return;
        }
        if (!cardReady(example, state)) return;
        positioned.current = true;
      } else if (state.settled) {
        if (
          flight.current !== null &&
          state.requestId !== undefined &&
          state.requestId !== flight.current
        )
          return;
        if (flight.current === null) desired.current = { slide: state.slide, beat: state.beat };
        flight.current = null;
        clearTimeout(navigationTimer.current);
      }
      setDeck(state);
      if (state.settled) {
        if (equal(state, desired.current) && cardReady(example, state)) {
          clearTimeout(bootTimer.current);
          phaseRef.current = "ready";
          setPhase("ready");
        }
        setSpoken(announcement(state, example.slideTitles[state.slide - 1] ?? ""));
        flush();
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [example, step, send, flush]);

  useEffect(() => {
    if (!example || !playing || phase !== "ready" || !deck?.settled || flight.current !== null)
      return;
    if (atEnd(deck)) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(
      () => {
        openingHold.current = false;
        desired.current = moved(example, desired.current, command.next());
        refreshDesired((value) => value + 1);
        flush();
      },
      openingHold.current
        ? 1500
        : dwellMs(mirrorCopy(deck, meta?.slideTitles ?? example.slideTitles)),
    );
    return () => clearTimeout(timer);
  }, [playing, phase, deck, meta, example, flush]);

  useEffect(() => {
    const pause = () => {
      openingHold.current = false;
      setPlaying(false);
    };
    const onVisibility = () => {
      if (document.hidden) pause();
    };
    document.addEventListener("visibilitychange", onVisibility);
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => {
            if (entry && !entry.isIntersecting) pause();
          });
    if (wrapper.current) observer?.observe(wrapper.current);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      observer?.disconnect();
    };
  }, []);
  useEffect(
    () => () => {
      clearTimeout(bootTimer.current);
      clearTimeout(navigationTimer.current);
    },
    [],
  );

  // Keep the current slide visible in a rail that scrolls sideways (long decks, phones).
  const railSlide = deck?.slide ?? target.current.slide;
  useEffect(() => {
    const list = rail.current;
    const current = list?.children[railSlide - 1] as HTMLElement | undefined;
    if (!list || !current) return;
    const left = current.offsetLeft;
    const right = left + current.offsetWidth;
    if (left >= list.scrollLeft && right <= list.scrollLeft + list.clientWidth) return;
    const smooth = Boolean(window.matchMedia?.(MOTION).matches);
    list.scrollTo?.({
      left: left - (list.clientWidth - current.offsetWidth) / 2,
      behavior: smooth ? "smooth" : "auto",
    });
  }, [railSlide]);

  const pick = useCallback(
    (name: string) => {
      const next = examples.findIndex((item) => item.name === name);
      const picked = examples[next];
      if (!picked || picked === example) return;
      completed.current = serial.current;
      setIndex(next);
      openingHold.current = false;
      setPlaying(false);
      boot(startOf(picked));
      setSpoken(`${picked.title} selected.`);
      track(Events.exampleSelected, { example: picked.name });
    },
    [examples, example, boot],
  );
  useEffect(() => {
    if (!gallery) return;
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
  }, [pick, gallery]);

  if (!example) return null;
  const liveFailure = phase === "failed" && positioned.current;
  const loading = phase === "poster" || phase === "booting";
  const showPoster = phase !== "ready" && !liveFailure;
  const shown = deck ?? recordedState(example, target.current);
  const titles = meta?.slideTitles.length ? meta.slideTitles : example.slideTitles;
  const caption = mirrorCopy(shown, titles);
  const steps = stepsOf(shown);
  const inputPosition = desired.current;
  const running = playing;
  const status = loading
    ? "Loading interactive deck…"
    : phase === "ready"
      ? "Live deck"
      : "The deck did not answer";
  const play = () => {
    openingHold.current = false;
    if (playing) {
      setPlaying(false);
      return;
    }
    track(Events.playerPlayed, { example: example.name });
    setPlaying(true);
    if (phase === "ready" && atEnd(shown)) {
      desired.current = { slide: firstStorySlide(example), beat: 0 };
      refreshDesired((value) => value + 1);
      flush();
    } else if (phase === "failed" || phase === "poster") boot(desired.current);
  };
  const retry = () => {
    setPlaying(false);
    boot(desired.current);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const element = event.target as HTMLElement;
    if (element.closest("input, select, textarea, [contenteditable]")) return;
    if (event.altKey || event.metaKey || event.ctrlKey) return;
    const move =
      event.key === "ArrowRight"
        ? event.shiftKey
          ? command.nextSlide()
          : command.next()
        : event.key === "ArrowLeft"
          ? event.shiftKey
            ? command.prevSlide()
            : command.prev()
          : null;
    if (move) {
      event.preventDefault();
      step(move);
    }
  };
  const toggleFullscreen = () => {
    setPlaying(false);
    setFullscreenError("");
    const task = document.fullscreenElement
      ? document.exitFullscreen()
      : wrapper.current?.requestFullscreen();
    void task?.catch(() =>
      setFullscreenError("Full screen is unavailable. Open the deck in a new tab."),
    );
  };
  const at = target.current;
  const frameSrc = `${example.href}index.html?decks-bridge=1#/${at.slide}${at.beat ? `?clicks=${at.beat}` : ""}`;
  const deckLink = `${example.href}#/${shown.slide}${shown.beat ? `?clicks=${shown.beat}` : ""}`;
  const featured = examples.filter((item) => item.featured).slice(0, 2);
  const prominent = featured.length ? featured : examples.slice(0, 2);
  const rest = examples.filter((item) => !prominent.includes(item));
  const choose = (item: Example) => (
    <button
      type="button"
      key={item.name}
      className="example-selector"
      aria-pressed={item === example}
      onClick={() => pick(item.name)}
    >
      {item.featured?.label ?? item.title}
    </button>
  );
  const progress = (slide: number) =>
    slide < shown.slide ? 1 : slide === shown.slide ? (shown.beat + 1) / steps : 0;
  return (
    <div className="player-stack">
      {/* biome-ignore lint/a11y/useSemanticElements: group contains the full-screen deck and controls. */}
      <div
        ref={wrapper}
        role="group"
        aria-label={`Deck player: ${example.title}. Arrow keys step, Shift moves a slide.`}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard navigation applies to this player.
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="player"
        data-player
        data-phase={phase}
        data-fullscreen={fullscreen || undefined}
      >
        <div className="player-toolbar" data-single-example={examples.length === 1 || undefined}>
          {examples.length > 1 && (
            <nav className="player-examples" aria-label="Example decks">
              {prominent.map(choose)}
              {rest.length > 0 && (
                <details className="more-examples">
                  <summary>More</summary>
                  <div className="more-examples-list">{rest.map(choose)}</div>
                </details>
              )}
            </nav>
          )}
          <div className="player-position">
            <span className="player-status" role="status">
              <span aria-hidden="true">
                {loading ? "Loading" : phase === "failed" ? "Not responding" : "Live"}
              </span>
              <span className="sr-only">{status}</span>
            </span>
            <span className="counter">
              <span aria-hidden="true">
                Slide {shown.slide} · Step {shown.beat + 1} of {steps}
              </span>
              <span className="sr-only">
                Slide {shown.slide} of {shown.slides}, step {shown.beat + 1} of {steps}
              </span>
            </span>
          </div>
          <div className="player-controls">
            <div className="player-transport controls js-only">
              <Control
                label="Step back"
                icon="back"
                disabled={equal(inputPosition, moved(example, inputPosition, command.prev()))}
                onClick={() => step(command.prev())}
              />
              <Control
                label={running ? "Pause" : phase === "ready" && atEnd(shown) ? "Replay" : "Play"}
                icon={running ? "pause" : "play"}
                onClick={play}
                primary
              />
              <Control
                label="Step forward"
                icon="next"
                disabled={equal(inputPosition, moved(example, inputPosition, command.next()))}
                onClick={() => step(command.next())}
              />
            </div>
            <div className="player-actions">
              {canFullscreen && (
                <Control
                  label="Full screen"
                  icon="fullscreen"
                  onClick={toggleFullscreen}
                  pressed={fullscreen}
                />
              )}
              <a className="open-deck" href={deckLink} target="_blank" rel="noopener">
                <span className="open-deck-label">Open deck</span> <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </div>
        <div className="player-frame">
          <div className="player-canvas">
            {(phase === "booting" || phase === "ready" || liveFailure) && (
              <iframe
                key={`${example.name}-${bootCount}`}
                ref={frame}
                src={frameSrc}
                title={`${example.title}, interactive deck`}
                allow="screen-wake-lock"
                style={{ visibility: phase === "ready" || liveFailure ? "visible" : "hidden" }}
              />
            )}
            {showPoster &&
              (example.poster ? (
                <picture>
                  <source
                    type="image/avif"
                    srcSet={posterSrcset(example.poster, "avif")}
                    sizes="100vw"
                  />
                  <source
                    type="image/webp"
                    srcSet={posterSrcset(example.poster, "webp")}
                    sizes="100vw"
                  />
                  <img
                    src={`${example.poster.base}-${example.poster.width >= 1920 ? 1920 : 1280}.webp`}
                    width={example.poster.width}
                    height={example.poster.height}
                    alt={`${example.title}, slide ${example.startSlide} of ${example.slides}`}
                    fetchPriority={priority && index === initial ? "high" : "auto"}
                  />
                </picture>
              ) : (
                <p className="player-message">Open the deck in a new tab.</p>
              ))}
            {loading && (
              <div className="player-loading" aria-hidden="true">
                <span className="player-loading-indicator" />
                Loading interactive deck…
              </div>
            )}
            {phase === "failed" && (
              <div className="player-failure">
                <p role="alert">The deck did not answer.</p>
                <button className="player-retry" type="button" onClick={retry}>
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
        {example.slides > 1 && (
          <nav className="player-rail js-only" aria-label="Slides" ref={rail}>
            {Array.from({ length: example.slides }, (_, i) => (
              <button
                type="button"
                // biome-ignore lint/suspicious/noArrayIndexKey: slide numbers are stable identities.
                key={`slide-${i + 1}`}
                className="rail-slide"
                aria-current={shown.slide === i + 1 ? "step" : undefined}
                title={titles[i] || undefined}
                onClick={() => step(command.go(i + 1, 0))}
              >
                <span
                  className="rail-progress"
                  aria-hidden="true"
                  style={{ "--progress": progress(i + 1) } as CSSProperties}
                />
                {titles[i] ? (
                  <>
                    {/* The name reads "Slide 2: Title" and still contains the visible "2 Title". */}
                    <span className="rail-number">
                      <span className="sr-only">Slide </span>
                      {i + 1}
                      <span className="sr-only">:</span>
                    </span>{" "}
                    <span className="rail-title">{titles[i]}</span>
                  </>
                ) : (
                  <span className="rail-title">Slide {i + 1}</span>
                )}
              </button>
            ))}
          </nav>
        )}
        <div className="player-caption">
          <div className="caption-copy-stack">
            <div className="caption-current">
              <p className="caption-lead">{caption.lead}</p>
              {caption.body && <p className="caption-body">{caption.body}</p>}
            </div>
            {example.states.map((state) => (
              <div
                className="caption-measure"
                aria-hidden="true"
                key={`${state.slide}-${state.beat}`}
              >
                <p className="measure-lead">{state.lead || titles[state.slide - 1]}</p>
                {state.body && <p className="measure-body">{state.body}</p>}
              </div>
            ))}
          </div>
          {example.featured?.hint && (
            <p
              className="player-interaction-hint"
              aria-hidden={phase !== "ready"}
              data-visible={phase === "ready"}
            >
              {example.featured.hint}
            </p>
          )}
          {fullscreenError && <p role="status">{fullscreenError}</p>}
          <p className="sr-only" aria-live="polite">
            {spoken}
          </p>
        </div>
      </div>
      {example.run && (
        <div className="player-notes">
          <p>{draftLine(example.run, example.edits)}</p>
        </div>
      )}
    </div>
  );
}
