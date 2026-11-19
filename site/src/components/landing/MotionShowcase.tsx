import { type ReactNode, useCallback, useRef, useState } from "react";
import type { Example } from "../../lib/player/example";
import { DeckPlayer } from "./DeckPlayer";

export function MotionShowcase({
  examples,
  children,
}: {
  examples: Example[];
  children: ReactNode;
}) {
  const [reading, setReading] = useState(false);
  const sources = useRef<HTMLDivElement>(null);
  const showSlide = useCallback((slide: number) => {
    // Astro owns the static figures. Only their visibility changes during playback.
    const readingCode = sources.current?.contains(document.activeElement);
    sources.current?.querySelectorAll("figure").forEach((figure, index) => {
      figure.hidden = index + 1 !== slide;
    });
    // A navigation already in flight can finish after the reader tabs into the source.
    if (readingCode)
      sources.current
        ?.querySelector<HTMLElement>("figure:not([hidden]) pre")
        ?.focus({ preventScroll: true });
  }, []);
  return (
    <div className="motion-showcase">
      <DeckPlayer examples={examples} autoplay={!reading} onSlide={showSlide} />
      <div
        ref={sources}
        onFocusCapture={() => setReading(true)}
        onBlurCapture={() => setReading(false)}
      >
        {children}
      </div>
    </div>
  );
}
