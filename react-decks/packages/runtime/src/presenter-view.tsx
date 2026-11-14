import { navigate } from "@react-decks/core";
import { type CSSProperties, type ReactElement, useCallback, useEffect, useState } from "react";
import { useDeckContext, useDeckSelector, usePresentation } from "./hooks";
import { SlideFrame } from "./slide-frame";
import { SlideHost } from "./slide-host";
import type { NoteHtml } from "./source";
import "./presenter-view.css";

export function PresenterView(): ReactElement {
  const { source } = useDeckContext();
  const nav = useDeckSelector((state) => state.nav);
  const aspect = useDeckSelector((state) => state.audienceAspect);
  const [notes, setNotes] = useState<
    Readonly<Record<string, readonly NoteHtml[]>> | "failed" | null
  >(null);
  const revealNote = useCallback((element: HTMLDivElement | null) => {
    element?.scrollIntoView?.({ block: "nearest" });
  }, []);
  const meta = source.manifest.slides[nav.slide - 1];
  const next = navigate(nav, { type: "next" }, source.manifest);
  const end = next.slide === nav.slide && next.click === nav.click;
  const ratio = aspect ?? source.manifest.canvas.width / source.manifest.canvas.height;
  // The boxes fit their region in both directions, which needs the ratio in CSS as a number.
  const box: CSSProperties & { "--rd-aspect": number } = {
    aspectRatio: ratio,
    "--rd-aspect": ratio,
  };
  const segments = notes && notes !== "failed" && meta ? (notes[meta.id] ?? []) : [];
  let active = -1;
  for (let index = 0; index < segments.length; index++) {
    const segment = segments[index];
    if (segment && segment.click <= nav.click) active = index;
  }
  const hasNotes = segments.some((segment) => segment.html.trim() !== "");
  useEffect(() => {
    let cancelled = false;
    const load = source.loadNotes;
    if (load) {
      load().then(
        (result) => {
          if (!cancelled) setNotes(result);
        },
        () => {
          if (!cancelled) setNotes("failed");
        },
      );
    }
    return () => {
      cancelled = true;
    };
  }, [source]);
  return (
    <div className="rd-presenter-view">
      <section aria-label="Current slide" className="rd-presenter-current">
        <div className="rd-presenter-box" style={box}>
          <SlideFrame main>
            <SlideHost key={nav.slide} no={nav.slide} clicks={nav.click} context="presenter" />
          </SlideFrame>
        </div>
      </section>
      <section aria-label="Next" className="rd-presenter-next">
        <div className="rd-presenter-box" style={box}>
          {end ? (
            <p>End of deck</p>
          ) : (
            <SlideFrame>
              <SlideHost key={next.slide} no={next.slide} clicks={next.click} context="preview" />
            </SlideFrame>
          )}
        </div>
      </section>
      <section key={meta?.id} aria-label="Notes" className="rd-presenter-notes">
        {notes === "failed" ? (
          <p>Notes failed to load</p>
        ) : source.loadNotes && notes === null ? null : !hasNotes ? (
          <p>No notes for this slide</p>
        ) : (
          segments.map((segment, index) => (
            <div
              key={segment.click}
              ref={index === active ? revealNote : undefined}
              aria-current={index === active ? "true" : undefined}
              // biome-ignore lint/security/noDangerouslySetInnerHtml: Note HTML is compiled at build time from the deck author's own markdown.
              dangerouslySetInnerHTML={{ __html: segment.html }}
            />
          ))
        )}
      </section>
      <footer role="contentinfo" aria-label="Presentation status" className="rd-presenter-status">
        <span>{`${nav.slide} / ${source.manifest.slides.length}`}</span>
        {meta && meta.clicks > 0 && <span>{`click ${nav.click} of ${meta.clicks}`}</span>}
        <PresenterClock />
      </footer>
    </div>
  );
}

/** Owns the one-second tick, so only the clock and timer render each second. */
function PresenterClock(): ReactElement {
  const { started, reset } = usePresentation();
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  const elapsed = started === null ? 0 : Math.max(0, Math.floor((now - started) / 1000));
  const date = new Date(now);
  const clock = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  const minutes = Math.floor(elapsed / 60);
  const seconds = String(elapsed % 60).padStart(2, "0");
  const timer =
    elapsed >= 3600
      ? `${Math.floor(elapsed / 3600)}:${String(minutes % 60).padStart(2, "0")}:${seconds}`
      : `${String(minutes).padStart(2, "0")}:${seconds}`;
  return (
    <>
      <time role="timer" aria-label="Local time">
        {clock}
      </time>
      <span role="timer" aria-label="Elapsed time">
        {timer}
      </span>
      <button type="button" onClick={reset}>
        Reset timer
      </button>
    </>
  );
}
