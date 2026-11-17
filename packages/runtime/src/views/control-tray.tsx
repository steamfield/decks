import { type ReactElement, useLayoutEffect, useState } from "react";
import { stepTextScale } from "../canvas/text-scale";
import { useDeck, useDeckContext, usePresentation } from "../hooks";
import { openPresenter, toggleFullscreen, toggleOverview } from "../navigation/deck-actions";
import { useGoTo } from "../navigation/go-to-state";
import "./control-tray.css";

function Icon({ path }: { path: string }): ReactElement {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d={path} />
    </svg>
  );
}

export function ControlTray(): ReactElement {
  const deck = useDeck();
  const { source, store } = useDeckContext();
  const { home } = usePresentation();
  const { show } = useGoTo();
  const [fullscreenEnabled, setFullscreenEnabled] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  useLayoutEffect(() => {
    const update = () => {
      setFullscreenEnabled(Boolean(document.fullscreenEnabled));
      setFullscreen(Boolean(document.fullscreenElement));
    };
    update();
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);
  return (
    <div
      role="toolbar"
      aria-label="Deck controls"
      className="rd-tray"
      onPointerLeave={(event) => {
        const focused = document.activeElement;
        if (focused instanceof HTMLButtonElement && event.currentTarget.contains(focused))
          focused.blur();
      }}
    >
      <div className="rd-tray-buttons">
        <button
          type="button"
          aria-label="Previous"
          disabled={deck.slide === 1 && deck.clicks === 0}
          onClick={deck.prev}
        >
          <Icon path="m15 6-6 6 6 6" />
        </button>
        <button
          type="button"
          aria-label="Next"
          disabled={deck.slide === deck.total && deck.clicks === deck.clicksTotal}
          onClick={deck.next}
        >
          <Icon path="m9 6 6 6-6 6" />
        </button>
        <button type="button" aria-label="Go to slide" onClick={show}>
          <Icon path="M4 4h16v16H4z M8 8h8 M8 12h8 M8 16h4" />
          {deck.slide} / {deck.total}
        </button>
        <button type="button" aria-label="Overview" onClick={() => toggleOverview(store, home)}>
          <Icon path="M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z" />
        </button>
        <button type="button" aria-label="Open presenter" onClick={() => openPresenter(source)}>
          <Icon path="M3 4h18v13H3z M8 21h8 M12 17v4 M7 8h10 M7 12h6" />
        </button>
        {fullscreenEnabled && (
          <button
            type="button"
            aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            onClick={toggleFullscreen}
          >
            <Icon
              path={
                fullscreen
                  ? "M3 8h5V3 M21 8h-5V3 M3 16h5v5 M21 16h-5v5"
                  : "M8 3H3v5 M16 3h5v5 M3 16v5h5 M21 16v5h-5"
              }
            />
          </button>
        )}
        <button
          type="button"
          aria-label="Smaller text"
          onClick={() => stepTextScale(source.manifest.name, -1)}
        >
          <Icon path="m3 18 5-12 5 12 M5 14h6 M16 12h6" />
        </button>
        <button
          type="button"
          aria-label="Larger text"
          onClick={() => stepTextScale(source.manifest.name, 1)}
        >
          <Icon path="m3 18 5-12 5 12 M5 14h6 M16 12h6 M19 9v6" />
        </button>
      </div>
    </div>
  );
}
