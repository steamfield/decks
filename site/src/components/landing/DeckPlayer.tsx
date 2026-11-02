// The hero player: a cassette deck whose window plays a real example deck. The
// deck loads in a same-origin iframe on the first PLAY, step or cassette pick, and
// the faceplate drives it through the embed contract in src/lib/player/protocol.ts.
//
// Server-rendered, it shows the poster, the start beat's text and a rack of links
// to each static deck build, so it reads without JavaScript. Hydration turns the
// rack into a radio group and shows the transport.
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
import { posterSrcset, stateAt, type Tape } from "../../lib/player/tape";
import { Cassette, CassetteLabel, Reel, tapeStyle } from "./Cassette";

type Phase = "poster" | "booting" | "ready" | "failed";
type Swap = "idle" | "eject" | "insert";

/** How long a deck may take to answer before the player gives up and links to it. */
export const BOOT_TIMEOUT_MS = 15_000;
const EJECT_MS = 220;
const INSERT_MS = 260;

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

function Meter({
  label,
  value,
  max,
  level,
}: {
  label: string;
  value: number;
  max: number;
  /** 0..1, how much of the bar is lit. */
  level: number;
}) {
  const segments = 12;
  const lit = Math.round(level * segments);
  return (
    <div className="flex items-center gap-2">
      <span className="hw-label w-10 shrink-0" aria-hidden="true">
        {label}
      </span>
      <meter className="sr-only" min={0} max={max} value={value} aria-label={`${label} meter`}>
        {label} {value} of {max}
      </meter>
      <div aria-hidden="true" className="grid flex-1 grid-cols-12 gap-0.5">
        {Array.from({ length: segments }, (_, index) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed segment positions
            key={index}
            className={`h-2.5 rounded-[1px] ${index < lit ? "bg-live" : "bg-live-off"}`}
          />
        ))}
      </div>
    </div>
  );
}

function TransportButton({
  glyph,
  label,
  name,
  onClick,
  pressed,
}: {
  glyph: string;
  /** Printed under the glyph. */
  label: string;
  /** Accessible name; contains the printed label. */
  name?: string;
  onClick: () => void;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={name}
      aria-pressed={pressed}
      className="press silver flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-sm border border-black/40 px-2 py-1 shadow-[inset_0_1px_0_rgb(255_255_255/0.6)]"
    >
      <span aria-hidden="true" className="text-sm leading-none">
        {glyph}
      </span>
      <span className="text-[10px] font-semibold tracking-[0.12em] uppercase">{label}</span>
    </button>
  );
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
  const frame = useRef<HTMLIFrameElement>(null);
  const pending = useRef<Command | null>(null);
  const positioned = useRef(false);
  const bootTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const swapTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const tape = tapes[index] ?? tapes[0];
  useEffect(() => setHydrated(true), []);

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
    if (playing) return;
    track(Events.playerPlayed, { tape: tape.name });
    setPlaying(true);
    if (phase === "ready" && deck && atEnd(deck)) send(command.go(tape.startSlide, 0));
    else if (phase === "poster" || phase === "failed") boot(null);
  };
  const pause = () => setPlaying(false);
  const step = (message: Command) => {
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
    const instant = prefersReducedMotion();
    const insert = () => {
      setIndex(next);
      setPhase("poster");
      setDeck(null);
      setMeta(null);
      setSpoken(`${target.title} loaded.`);
      setSwap(instant ? "idle" : "insert");
    };
    if (instant) {
      insert();
      // A quick run of picks boots only the last one.
      swapTimers.current = [setTimeout(() => boot(null), 300)];
      return;
    }
    setSwap("eject");
    swapTimers.current = [
      setTimeout(insert, EJECT_MS),
      setTimeout(
        () => {
          setSwap("idle");
          boot(null);
        },
        EJECT_MS + INSERT_MS + 120,
      ),
    ];
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
  const counter = (
    phase === "booting" ? "LOAD" : phase === "failed" ? "NO TAPE" : counterText(shown)
  ).replace("·", ".");
  const reels =
    phase === "ready" && deck && !deck.settled ? (deck.direction ?? "forward") : "still";
  const live = phase === "ready" || phase === "booting";
  const frameSrc = `${tape.href}#/${tape.startSlide}`;

  return (
    <div className="flex flex-col gap-6">
      <fieldset
        onKeyDown={onFaceplateKey}
        style={tapeStyle(tape.theme)}
        className="hw bg-hw-face text-hw-ink min-w-0 rounded-md border border-black p-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.06)] sm:p-4"
      >
        <legend className="sr-only">Deck player</legend>
        <div className="mb-3 flex items-center justify-between gap-4">
          <span className="hw-label">Decks</span>
          <span className="hw-label truncate">Tape: {tape.name}</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="bg-hw-well relative aspect-video overflow-hidden rounded-sm border border-black">
              {phase !== "poster" && (
                <iframe
                  key={`${tape.name}-${bootCount}`}
                  ref={frame}
                  src={frameSrc}
                  title={`${tape.title}: example deck, controlled by the player`}
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
                      sizes="(min-width: 1024px) 860px, 100vw"
                    />
                    <source
                      type="image/webp"
                      srcSet={posterSrcset(tape.poster, "webp")}
                      sizes="(min-width: 1024px) 860px, 100vw"
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
                  <span className="hw-label absolute inset-0 grid place-items-center p-4 text-center">
                    No poster yet. Run make demo.
                  </span>
                ))}
              {phase === "failed" && (
                <p className="bg-hw-well/90 absolute inset-x-0 bottom-0 p-3 text-sm">
                  The deck didn't answer.{" "}
                  <a href={tape.href} className="text-hw-ink">
                    Open the example deck
                  </a>
                </p>
              )}
            </div>
            <div
              data-reels={reels}
              className="bg-hw-raised flex items-center gap-3 rounded-sm border border-black p-2"
            >
              <Reel className="size-10 shrink-0" />
              <div data-swap={swap} className="tape-slot min-w-0 flex-1">
                <CassetteLabel title={tape.title} theme={tape.theme} slides={tape.slides} compact />
              </div>
              <Reel className="size-10 shrink-0" />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="bg-hw-well flex flex-col gap-3 rounded-sm border border-black p-3">
              <div className="flex items-center justify-between">
                <span className="hw-label">Counter</span>
                <span className="hw-label flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className={`size-1.5 rounded-full ${playing ? "bg-live" : "bg-live-off"}`}
                  />
                  {playing ? "Play" : "Stop"}
                </span>
              </div>
              <p
                className="seg text-live text-right text-3xl"
                data-ghost={counter.replace(/[^.]/g, "~")}
              >
                <span className="sr-only">{counterText(shown)}</span>
                <span aria-hidden="true" className="seg-text">
                  {counter}
                </span>
              </p>
              <Meter label="Step" value={shown.beat + 1} max={steps} level={levels.beat} />
              <Meter
                label="Deck"
                value={shown.slide}
                max={Math.max(shown.slides, shown.slide)}
                level={levels.deck}
              />
            </div>
            <div className="js-only grid grid-cols-3 gap-2">
              <TransportButton
                glyph="◀◀"
                label="Slide"
                name="Slide back"
                onClick={() => step(command.prevSlide())}
              />
              <TransportButton glyph="▶" label="Play" pressed={playing} onClick={play} />
              <TransportButton
                glyph="▶▶"
                label="Slide"
                name="Slide forward"
                onClick={() => step(command.nextSlide())}
              />
              <TransportButton
                glyph="◀"
                label="Step"
                name="Step back"
                onClick={() => step(command.prev())}
              />
              <TransportButton
                glyph="❚❚"
                label="Pause"
                pressed={!playing && live}
                onClick={pause}
              />
              <TransportButton
                glyph="▶"
                label="Step"
                name="Step forward"
                onClick={() => step(command.next())}
              />
            </div>
            <a
              href={tape.href}
              target="_blank"
              rel="noopener"
              className="press silver flex min-h-11 items-center justify-center gap-2 rounded-sm border border-black/40 px-3 text-xs font-semibold tracking-[0.12em] uppercase no-underline"
            >
              <span aria-hidden="true">⏏</span> Eject: open the example deck
            </a>
          </div>
        </div>
      </fieldset>

      <div className="flex max-w-3xl flex-col gap-2">
        <p className="text-ink text-xl font-semibold tracking-tight text-balance sm:text-2xl">
          {mirror.lead}
        </p>
        {mirror.body && <p className="text-ink-2 text-base leading-relaxed">{mirror.body}</p>}
        <p className="sr-only" aria-live="polite" id={`${id}-live`}>
          {spoken}
        </p>
        {tape.name === "tides" && (
          <p className="text-muted mt-2 text-sm">
            The example deck was drafted by Claude Code using this repo's agent setup in one
            8-minute run, then fact-checked and edited by hand.{" "}
            {changesHref && <a href={changesHref}>See the changes</a>}
          </p>
        )}
      </div>

      <section aria-labelledby={`${id}-rack`} className="flex flex-col gap-3">
        <h2 id={`${id}-rack`} className="text-ink text-base font-semibold">
          Example decks
        </h2>
        {hydrated ? (
          <fieldset className="hw grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <legend className="sr-only">Load an example deck</legend>
            {tapes.map((item, position) => (
              <div
                key={item.name}
                className="bg-hw-face flex flex-col gap-2 rounded-md border border-black p-2"
              >
                <label className="rack-item text-hw-ink has-[:focus-visible]:outline-live block cursor-pointer rounded-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2">
                  <input
                    type="radio"
                    name={`${id}-tape`}
                    value={item.name}
                    checked={position === index}
                    onChange={() => pick(position)}
                    aria-label={`${item.title}, ${item.slides || "unknown number of"} slides`}
                    className="sr-only"
                  />
                  <RackFace tape={item} loaded={position === index} />
                </label>
                <TrackList tape={item} />
              </div>
            ))}
          </fieldset>
        ) : (
          <ul className="hw grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {tapes.map((item) => (
              <li
                key={item.name}
                className="bg-hw-face flex flex-col gap-2 rounded-md border border-black p-2"
              >
                <a href={item.href} className="text-hw-ink flex flex-col gap-2 text-xs">
                  <RackFace tape={item} loaded={false} />
                  {item.poster && (
                    <img
                      src={`${item.poster.base}-640.webp`}
                      width={640}
                      height={360}
                      loading="lazy"
                      alt=""
                      className="no-js-only aspect-video w-full rounded-xs"
                    />
                  )}
                  <span>Open {item.title}</span>
                </a>
                <TrackList tape={item} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/** One rack slot's cassette, or an empty slot while it's in the deck. Phrasing content only. */
function RackFace({ tape, loaded }: { tape: Tape; loaded: boolean }) {
  if (!loaded) return <Cassette title={tape.title} theme={tape.theme} slides={tape.slides} />;
  return (
    <span className="border-hw-print flex aspect-[16/10] flex-col items-center justify-center gap-1 rounded-sm border border-dashed p-2">
      <span className="hw-label">In the deck</span>
      <span className="text-hw-ink line-clamp-2 text-center text-sm">{tape.title}</span>
    </span>
  );
}

/** The J-card's tracklist: the deck's slide titles, as the deck reported them. */
function TrackList({ tape }: { tape: Tape }) {
  if (tape.slideTitles.length === 0) return null;
  return (
    <ol
      aria-label={`${tape.title}: slides`}
      className="text-hw-ink-2 flex list-inside list-decimal flex-col gap-0.5 text-[11px] leading-snug"
    >
      {tape.slideTitles.map((title, position) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: slide order is the identity
        <li key={position} className="truncate">
          {title || `Slide ${position + 1}`}
        </li>
      ))}
    </ol>
  );
}
