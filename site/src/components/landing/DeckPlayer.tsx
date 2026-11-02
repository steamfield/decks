// The hero: a 90s hi-fi stack. A TV shows the slide, the DX-90 cassette deck
// below it is the controller, and a shelf beside it holds one cassette per
// example deck. The deck loads in a same-origin iframe inside the TV screen on
// the first PLAY, step or cassette pick, and the faceplate drives it through the
// embed contract in src/lib/player/protocol.ts.
//
// Server-rendered, it shows the poster, the start step's text and a shelf of
// links to each static deck build, so it reads without JavaScript. Hydration
// turns the shelf into a radio group and shows the transport keys.
import { type KeyboardEvent, useCallback, useEffect, useId, useRef, useState } from "react";
import { track } from "../../lib/analytics";
import { Events } from "../../lib/events";
import {
  announcement,
  counterText,
  dwellMs,
  meterLevels,
  mirrorCopy,
  stepsOf,
} from "../../lib/player/format";
import {
  atEnd,
  type Command,
  command,
  type DeckMeta,
  type DeckState,
  parseDeckMessage,
} from "../../lib/player/protocol";
import { posterSrcset, stateAt, type Tape, tapePosition } from "../../lib/player/tape";
import { play as playSound, setSfxEnabled, sfxEnabled } from "../../lib/sfx";
import {
  CassetteArt,
  CassetteDefs,
  Led,
  PianoKey,
  RollingCounter,
  Screw,
  Vfd,
  VfdFlag,
  VuMeter,
} from "./hifi";
import { JCard, Spine } from "./rack";

type Phase = "poster" | "booting" | "ready" | "failed";
/** The tape-load sequence: door opens, old tape rises out, new tape slides in, door closes. */
type Swap = "idle" | "open" | "out" | "in" | "close";

/** How long a deck may take to answer before the player gives up and links to it. */
export const BOOT_TIMEOUT_MS = 15_000;
/** Milliseconds from the pick to each stage of the tape-load sequence. */
export const SWAP_TIMING = { out: 180, in: 460, close: 820, done: 1040 } as const;

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** The state the player shows before the deck boots: the poster's beat, as `make demo` recorded it. */
function posterState(tape: Tape): DeckState {
  const recorded = stateAt(tape, tape.startSlide, 0);
  return {
    slide: tape.startSlide,
    slides: tape.slides,
    beat: 0,
    beats: recorded?.beats ?? 0,
    lead: recorded?.lead ?? "",
    body: recorded?.body ?? "",
    settled: true,
    direction: null,
  };
}

export function DeckPlayer({
  tapes,
  initial = 0,
  changesHref,
}: {
  tapes: Tape[];
  initial?: number;
  /** Where the tides caption's "See the edits" link goes. */
  changesHref?: string;
}) {
  const id = useId();
  const [hydrated, setHydrated] = useState(false);
  const [index, setIndex] = useState(initial);
  const [swap, setSwap] = useState<Swap>("idle");
  const [phase, setPhase] = useState<Phase>("poster");
  const [deck, setDeck] = useState<DeckState | null>(null);
  const [meta, setMeta] = useState<DeckMeta | null>(null);
  const [playing, setPlaying] = useState(false);
  const [bootCount, setBootCount] = useState(0);
  const [spoken, setSpoken] = useState("");
  const [sound, setSound] = useState(false);
  const [peek, setPeek] = useState<number | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const pending = useRef<Command | null>(null);
  const positioned = useRef(false);
  const bootTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const swapTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const tape = tapes[index] ?? tapes[0];
  useEffect(() => {
    setHydrated(true);
    setSound(sfxEnabled());
  }, []);

  const send = useCallback((message: Command) => {
    frame.current?.contentWindow?.postMessage(message, window.location.origin);
  }, []);

  const boot = useCallback((then: Command | null) => {
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
    if (!tape) return;
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
        // The deck opens wherever its URL points; the poster shows the start slide.
        if (state.slide !== tape.startSlide || state.beat !== 0) {
          if (state.settled) send(command.go(tape.startSlide, 0));
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
        const titles = meta?.slideTitles ?? tape.slideTitles;
        setSpoken(announcement(state, titles[state.slide - 1] ?? ""));
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [tape, send, meta]);

  // PLAY: hold each settled beat for its reading time, then advance; stop at the end.
  useEffect(() => {
    if (!playing || phase !== "ready" || !deck?.settled) return;
    if (atEnd(deck)) {
      setPlaying(false);
      return;
    }
    const titles = meta?.slideTitles ?? tape?.slideTitles ?? [];
    const timer = setTimeout(() => send(command.next()), dwellMs(mirrorCopy(deck, titles)));
    return () => clearTimeout(timer);
  }, [playing, phase, deck, meta, tape, send]);

  useEffect(
    () => () => {
      clearTimeout(bootTimer.current);
      for (const timer of swapTimers.current) clearTimeout(timer);
    },
    [],
  );

  if (!tape) return null;

  const play = () => {
    playSound("key");
    if (playing) return;
    track(Events.playerPlayed, { tape: tape.name });
    setPlaying(true);
    if (phase === "ready" && deck && atEnd(deck)) send(command.go(tape.startSlide, 0));
    else if (phase === "poster" || phase === "failed") boot(null);
  };
  const pause = () => {
    playSound("key");
    setPlaying(false);
  };
  const step = (message: Command) => {
    playSound("key");
    track(Events.beatStepped, { cmd: message.cmd });
    setPlaying(false);
    if (phase === "ready") send(message);
    else if (phase === "poster" || phase === "failed") boot(message);
  };

  const pick = (next: number) => {
    if (next === index && swap === "idle") return;
    const target = tapes[next];
    if (!target) return;
    track(Events.tapeSelected, { tape: target.name });
    for (const timer of swapTimers.current) clearTimeout(timer);
    clearTimeout(bootTimer.current);
    setPlaying(false);
    const insert = () => {
      setIndex(next);
      setPhase("poster");
      setDeck(null);
      setMeta(null);
      setSpoken(`${target.title} loaded.`);
    };
    if (prefersReducedMotion()) {
      insert();
      setSwap("idle");
      // A quick run of picks boots only the last one.
      swapTimers.current = [setTimeout(() => boot(null), 300)];
      return;
    }
    playSound("door");
    setSwap("open");
    const at = (ms: number, run: () => void) => setTimeout(run, ms);
    swapTimers.current = [
      at(SWAP_TIMING.out, () => setSwap("out")),
      at(SWAP_TIMING.in, () => {
        insert();
        setSwap("in");
      }),
      at(SWAP_TIMING.close, () => {
        playSound("door");
        setSwap("close");
      }),
      at(SWAP_TIMING.done, () => {
        setSwap("idle");
        playSound("hiss");
        boot(null);
      }),
    ];
  };

  const toggleSound = () => {
    setSfxEnabled(!sound);
    setSound(!sound);
  };

  const onFaceplateKey = (event: KeyboardEvent) => {
    const moves: Record<string, Command> = {
      ArrowRight: event.shiftKey ? command.nextSlide() : command.next(),
      ArrowLeft: event.shiftKey ? command.prevSlide() : command.prev(),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    step(move);
  };

  const shown = deck ?? posterState(tape);
  const titles = meta?.slideTitles.length ? meta.slideTitles : tape.slideTitles;
  const mirror = mirrorCopy(shown, titles);
  const levels = meterLevels(shown);
  const steps = stepsOf(shown);
  const moving = phase === "ready" && deck !== null && !deck.settled;
  const spin = moving
    ? deck?.direction === "backward"
      ? "backward"
      : "forward"
    : playing && phase === "ready"
      ? "forward"
      : "still";
  const ended = phase === "ready" && deck !== null && atEnd(deck);
  // The VFD prints slide and step as numbers: a 14-segment S and B read as 5 and 8.
  const display =
    phase === "booting"
      ? "LOAD"
      : phase === "failed"
        ? "NO TAPE"
        : `${String(shown.slide).padStart(2, "0")} ${shown.beat + 1}/${steps}`;
  const displaySpoken =
    phase === "booting"
      ? "Loading"
      : phase === "failed"
        ? "No tape"
        : `${counterText(shown)}: slide ${shown.slide} of ${shown.slides}, step ${shown.beat + 1} of ${steps}`;
  const position = tapePosition(tape, shown.slide, shown.beat);
  const progress = position.total > 1 ? position.index / (position.total - 1) : 0;
  const slideTitle = titles[shown.slide - 1]?.trim() || `Slide ${shown.slide}`;
  const osd =
    phase === "booting"
      ? "Loading"
      : phase === "failed"
        ? "No signal"
        : playing
          ? "Play ▶"
          : phase === "ready"
            ? "Pause"
            : "Stop";
  // index.html by name: the Astro dev server serves no directory index from public/.
  const frameSrc = `${tape.href}index.html#/${tape.startSlide}`;
  const doorOpen = swap === "open" || swap === "out" || swap === "in";
  const card = tapes[peek ?? index] ?? tape;

  return (
    <div className="hifi flex flex-col gap-8">
      <CassetteDefs />
      <div className="grid items-end gap-10 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="stand">
          <div className="tv">
            <div className="tv-cabinet">
              <Screw className="tv-screw-l" turn={35} />
              <Screw className="tv-screw-r" turn={-15} />
              <div className="tv-screen">
                <div className="tv-osd" aria-hidden="true">
                  <span>{osd}</span>
                  <span>
                    S{shown.slide} {shown.beat + 1}/{steps}
                  </span>
                </div>
                <div className="tv-picture">
                  {phase !== "poster" && (
                    <iframe
                      key={`${tape.name}-${bootCount}`}
                      ref={frame}
                      src={frameSrc}
                      title={`${tape.title}, controlled by the player above`}
                      tabIndex={-1}
                      inert
                      allow="screen-wake-lock"
                      className="absolute inset-0 size-full border-0"
                    />
                  )}
                  {phase !== "ready" &&
                    (tape.poster ? (
                      <picture>
                        <source
                          type="image/avif"
                          srcSet={posterSrcset(tape.poster, "avif")}
                          sizes="(min-width: 1280px) 760px, 92vw"
                        />
                        <source
                          type="image/webp"
                          srcSet={posterSrcset(tape.poster, "webp")}
                          sizes="(min-width: 1280px) 760px, 92vw"
                        />
                        <img
                          src={`${tape.poster.base}-1280.webp`}
                          width={tape.poster.width}
                          height={tape.poster.height}
                          alt={`${tape.title}, slide ${tape.startSlide}: ${mirror.lead}`}
                          fetchPriority={index === initial ? "high" : "auto"}
                          className="absolute inset-0 size-full object-cover"
                        />
                      </picture>
                    ) : (
                      <span className="tv-nosignal">No poster yet. Run make demo.</span>
                    ))}
                  {phase === "failed" && (
                    <p className="tv-message">
                      The deck didn't load.{" "}
                      <a href={tape.href} target="_blank" rel="noopener">
                        Open it in a new tab
                      </a>
                    </p>
                  )}
                </div>
                <p className="tv-osd tv-osd-title">{slideTitle}</p>
                <span aria-hidden="true" className="tv-glass" />
              </div>
              <div className="tv-chin">
                <span aria-hidden="true" className="tv-grille" />
                <span className="tv-badge">
                  <span className="brand">Decks</span>
                  <span className="legend">Vision 21</span>
                </span>
                <span className="legend flex items-center gap-1.5">
                  <Led on={phase === "ready" || phase === "booting"} color="green" />
                  Power
                </span>
              </div>
            </div>
          </div>

          <fieldset onKeyDown={onFaceplateKey} className="deck faceplate min-w-0" data-swap={swap}>
            <legend className="sr-only">Deck player</legend>
            <Screw className="deck-screw tl" turn={10} />
            <Screw className="deck-screw tr" turn={70} />
            <Screw className="deck-screw bl" turn={-40} />
            <Screw className="deck-screw br" turn={25} />
            <div className="deck-top">
              <span className="deck-brand">
                <span className="brand">Decks</span>
                <span className="model">DX-90</span>
              </span>
              <span className="legend hidden sm:inline">Stereo cassette deck</span>
              <span className="legend ml-auto flex items-center gap-1.5">
                <Led on={ended} color="amber" />
                Auto stop
              </span>
            </div>
            <div className="deck-main">
              <div className="well">
                <span className="legend well-legend">Tape: {tape.name}</span>
                <div className="well-inner">
                  <div className="cassette-holder" data-stage={swap}>
                    <CassetteArt
                      theme={tape.theme}
                      title={tape.title}
                      steps={position.total}
                      progress={progress}
                      spin={spin}
                      className="block w-full"
                    />
                  </div>
                </div>
                <span aria-hidden="true" className="door" data-open={doorOpen || undefined}>
                  <span className="door-glass" />
                  <span className="door-print">⏏ Push open</span>
                </span>
              </div>
              <div className="deck-readouts">
                <Vfd main={display} spoken={displaySpoken}>
                  <span className="vfd-label">Slide</span>
                  <span className="vfd-label">Step</span>
                  <span className="grow" />
                  <VfdFlag on={playing}>Play</VfdFlag>
                  <VfdFlag on={!playing && phase === "ready"}>Pause</VfdFlag>
                  <VfdFlag on={phase === "booting"}>Load</VfdFlag>
                  <VfdFlag on={ended}>End</VfdFlag>
                </Vfd>
                <div className="counter-row">
                  <span className="legend">Counter</span>
                  <RollingCounter value={position.index + 1} />
                  <button
                    type="button"
                    className="mini-key js-only"
                    onClick={() => step(command.go(1, 0))}
                    aria-label="Reset: go to the first slide"
                  >
                    <span aria-hidden="true">Reset</span>
                  </button>
                </div>
                <div className="vu-pair">
                  <VuMeter
                    label="Step"
                    level={levels.beat}
                    kick={moving}
                    peak={levels.beat >= 1 && steps > 1}
                  />
                  <VuMeter label="Deck" level={levels.deck} kick={moving} peak={ended} />
                </div>
                <meter
                  className="sr-only"
                  min={0}
                  max={steps}
                  value={shown.beat + 1}
                  aria-label="Step meter"
                >
                  Step {shown.beat + 1} of {steps}
                </meter>
                <meter
                  className="sr-only"
                  min={0}
                  max={Math.max(shown.slides, shown.slide)}
                  value={shown.slide}
                  aria-label="Deck meter"
                >
                  Slide {shown.slide} of {shown.slides}
                </meter>
              </div>
            </div>
            <div className="deck-keys">
              <div className="js-only contents">
                <PianoKey
                  glyph="◀◀"
                  legend="Slide"
                  name="Slide back"
                  onClick={() => step(command.prevSlide())}
                />
                <PianoKey
                  glyph="◀"
                  legend="Step"
                  name="Step back"
                  onClick={() => step(command.prev())}
                />
                <PianoKey
                  glyph="▶"
                  legend="Play"
                  onClick={play}
                  latched={playing}
                  led={{ on: playing, color: "green" }}
                />
                <PianoKey
                  glyph="❚❚"
                  legend="Pause"
                  onClick={pause}
                  latched={!playing && phase === "ready"}
                  led={{ on: !playing && phase === "ready", color: "amber" }}
                />
                <PianoKey
                  glyph="▶"
                  legend="Step"
                  name="Step forward"
                  onClick={() => step(command.next())}
                />
                <PianoKey
                  glyph="▶▶"
                  legend="Slide"
                  name="Slide forward"
                  onClick={() => step(command.nextSlide())}
                />
              </div>
              <div className="key-slot">
                <span className="legend">Full deck</span>
                <a href={tape.href} target="_blank" rel="noopener" className="key key-eject">
                  <span aria-hidden="true">⏏</span>
                  <span className="sr-only">Eject: open the example deck in a new tab</span>
                </a>
              </div>
            </div>
            <div className="deck-bottom">
              <label className="toggle js-only">
                <input type="checkbox" checked={sound} onChange={toggleSound} className="sr-only" />
                <span aria-hidden="true" className="toggle-track">
                  <span className="toggle-knob" />
                </span>
                <span className="legend">Sound</span>
              </label>
              <span className="legend ml-auto">Arrow keys step when a key has focus</span>
            </div>
          </fieldset>
          <div aria-hidden="true" className="stand-top" />
        </div>

        <section aria-labelledby={`${id}-rack`} className="shelf-wrap">
          <h2 id={`${id}-rack`} className="shelf-title">
            Example decks
          </h2>
          {hydrated ? (
            <fieldset className="shelf min-w-0" onMouseLeave={() => setPeek(null)}>
              <legend className="sr-only">Load an example deck</legend>
              {tapes.map((item, position) => (
                <label
                  key={item.name}
                  className="shelf-slot"
                  onMouseEnter={() => setPeek(position)}
                  onFocus={() => setPeek(position)}
                  onBlur={() => setPeek(null)}
                >
                  <input
                    type="radio"
                    name={`${id}-tape`}
                    value={item.name}
                    checked={position === index}
                    onChange={() => pick(position)}
                    aria-label={`${item.title}, ${item.slides} slides`}
                    className="sr-only"
                  />
                  <Spine tape={item} loaded={position === index && swap === "idle"} />
                </label>
              ))}
            </fieldset>
          ) : (
            <ul className="shelf">
              {tapes.map((item) => (
                <li key={item.name} className="shelf-slot">
                  <a href={item.href} className="block">
                    <Spine tape={item} loaded={false} />
                    <span className="sr-only">Open {item.title}</span>
                  </a>
                  {item.poster && (
                    <img
                      src={`${item.poster.base}-640.webp`}
                      width={640}
                      height={360}
                      loading="lazy"
                      alt={`${item.title}, slide ${item.startSlide}`}
                      className="no-js-only mt-2 aspect-video w-full rounded-xs"
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
          {hydrated && <JCard tape={card} />}
        </section>
      </div>

      <div className="now-playing">
        <p className="legend-ink">Now playing: {tape.title}</p>
        <p className="text-ink text-xl font-semibold tracking-tight text-balance sm:text-2xl">
          {mirror.lead}
        </p>
        {mirror.body && <p className="text-ink-2 text-base leading-relaxed">{mirror.body}</p>}
        <p className="sr-only" aria-live="polite" id={`${id}-live`}>
          {spoken}
        </p>
        {tape.name === "tides" && (
          <p className="text-muted mt-2 text-sm">
            Claude Code drafted this deck in one 8-minute run with the repository's agent setup, and
            it was fact-checked and edited by hand afterward.{" "}
            {changesHref && <a href={changesHref}>See the changes</a>}
          </p>
        )}
      </div>
    </div>
  );
}
