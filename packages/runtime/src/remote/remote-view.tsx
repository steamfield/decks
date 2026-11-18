import type { RemoteClientMessage } from "@react-decks/core";
import { useEffect, useState } from "react";
import { defaultKeybindingsHandlerIgnore, tinykeys } from "tinykeys";
import type { RemoteState } from "./remote-connection";
import "./remote-view.css";

function revealNote(element: HTMLDivElement | null) {
  element?.scrollIntoView?.({ block: "start" });
}

function digits(value: number) {
  return String(value).padStart(2, "0");
}

function localTime(date: Date) {
  return `${digits(date.getHours())}:${digits(date.getMinutes())}`;
}

function readTime() {
  return { local: new Date(), tick: performance.now() };
}

function Clock({ position }: { position: NonNullable<RemoteState["position"]> }) {
  const [now, setNow] = useState(readTime);
  useEffect(() => {
    const interval = window.setInterval(() => setNow(readTime()), 1000);
    return () => window.clearInterval(interval);
  }, []);
  const seconds =
    position.elapsed === null
      ? 0
      : Math.floor((position.elapsed + Math.max(0, now.tick - position.received)) / 1000);
  return (
    <>
      <span role="timer" aria-label="Elapsed time">
        {digits(Math.floor(seconds / 60))}:{digits(seconds % 60)}
      </span>
      <time role="timer" aria-label="Local time">
        {localTime(now.local)}
      </time>
    </>
  );
}

export function RemoteView({
  state,
  send,
}: {
  state: RemoteState;
  send: (intent: RemoteClientMessage) => void;
}) {
  const { deck, position, disconnectedSince, expired } = state;
  const slide = position && deck?.slides[position.slide - 1];
  const offline = disconnectedSince !== undefined;
  const ready = Boolean(slide) && !offline;
  useEffect(() => {
    if (!ready) return;
    const navigate = (type: "next" | "prev") => (event: KeyboardEvent) => {
      event.preventDefault();
      send({ type });
    };
    const next = navigate("next");
    const prev = navigate("prev");
    return tinykeys(
      window,
      {
        ArrowRight: next,
        ArrowDown: next,
        PageDown: next,
        Space: next,
        ArrowLeft: prev,
        ArrowUp: prev,
        PageUp: prev,
      },
      {
        ignore: (event) =>
          defaultKeybindingsHandlerIgnore(event) ||
          (event.code === "Space" &&
            event.target instanceof Element &&
            event.target.closest("button") !== null),
      },
    );
  }, [ready, send]);

  const banner =
    disconnectedSince &&
    `Disconnected since ${localTime(disconnectedSince)}:${digits(disconnectedSince.getSeconds())}`;
  if (!slide || !position || !deck) {
    const message = expired
      ? "This link has expired. Scan the new code from the laptop."
      : (banner ?? "Waiting for the deck");
    return (
      <main className="rd-remote-page">
        <p role="status">{message}</p>
      </main>
    );
  }
  const next = deck.slides[position.slide];
  const active = slide.notes.findLastIndex((segment) => segment.click <= position.click);
  return (
    <main className="rd-remote-page">
      <header>
        {banner && (
          <p role="status" className="rd-remote-banner">
            {banner}
          </p>
        )}
        <div className="rd-remote-position">
          <span>
            {position.slide} / {deck.slides.length}
          </span>
          {slide.clicks > 0 && (
            <span>
              click {position.click} of {slide.clicks}
            </span>
          )}
        </div>
        <h1>{slide.title}</h1>
        <p>{next ? `Next: ${next.title}` : "End of deck"}</p>
      </header>
      <section key={slide.id} aria-label="Notes" className="rd-remote-notes">
        {slide.notes.some((segment) => segment.html.trim()) ? (
          slide.notes.map((segment, index) => (
            <div
              key={segment.click}
              ref={index === active ? revealNote : undefined}
              aria-current={index === active ? "true" : undefined}
              // biome-ignore lint/security/noDangerouslySetInnerHtml: The deck build compiles its author's note HTML, as in PresenterView.
              dangerouslySetInnerHTML={{ __html: segment.html }}
            />
          ))
        ) : (
          <p>No notes for this slide</p>
        )}
      </section>
      <footer className="rd-remote-controls">
        <div className="rd-remote-clock">
          <Clock position={position} />
          <button type="button" disabled={offline} onClick={() => send({ type: "reset-timer" })}>
            Reset timer
          </button>
        </div>
        <select
          aria-label="Go to slide"
          disabled={offline}
          value=""
          onChange={(event) => send({ type: "go", slide: Number(event.currentTarget.value) })}
        >
          <option value="" disabled>
            Go to slide
          </option>
          {deck.slides.map((item, index) => (
            <option key={item.id} value={index + 1}>
              {item.title}
            </option>
          ))}
        </select>
        <div className="rd-remote-buttons">
          <button type="button" disabled={offline} onClick={() => send({ type: "prev" })}>
            Previous
          </button>
          <button type="button" disabled={offline} onClick={() => send({ type: "next" })}>
            Next
          </button>
        </div>
      </footer>
    </main>
  );
}
