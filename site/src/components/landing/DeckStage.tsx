import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { type Poster, posterSrcset } from "../../lib/player/example";
import { parseDeckMessage } from "../../lib/player/protocol";
import { createStageController, type StageController } from "../../lib/stage/controller";

type Props = {
  /** The deck's page, `/d/<name>/index.html`. */
  src: string;
  poster: Poster;
  /** What the agent has built so far; the stage's accessible name. */
  label: string;
  /** Receives the stage's controller once the frame is mounted; the parent drives the deck. */
  onController?: (controller: StageController) => void;
  /** Where the deck boots, as `/<slide>?clicks=<beat>`. */
  initialHash?: string;
};

/**
 * The landing session's deck: the slide alone, driven by a script through its controller.
 * The poster covers the frame until the first command after ready has settled.
 */
export function DeckStage({ src, poster, label, onController, initialHash = "" }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [liveSrc, setLiveSrc] = useState<string | null>(null);
  const live = liveSrc === src;
  const handOver = useRef(onController);
  useLayoutEffect(() => {
    handOver.current = onController;
  });

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const controller = createStageController(element);
    // A state carrying a requestId and settled is a command that finished: a superseded move
    // never reports settled, and the inert frame takes no viewer moves, which carry none.
    const onMessage = (event: MessageEvent<unknown>) => {
      if (event.source !== element.contentWindow || event.origin !== window.location.origin) return;
      const message = parseDeckMessage(event.data);
      if (message?.type === "decks:state" && message.settled && message.requestId !== undefined)
        setLiveSrc(src);
    };
    window.addEventListener("message", onMessage);
    handOver.current?.(controller);
    return () => {
      window.removeEventListener("message", onMessage);
      controller.dispose();
    };
  }, [src]);

  return (
    <div className="deck-stage" role="img" aria-label={label}>
      <iframe
        ref={frame}
        src={`${src}?decks-bridge=1#${initialHash}`}
        title={label}
        aria-hidden="true"
        tabIndex={-1}
        inert
        style={{ visibility: live ? "visible" : "hidden" }}
      />
      {!live && (
        <picture>
          <source type="image/avif" srcSet={posterSrcset(poster, "avif")} sizes="100vw" />
          <source type="image/webp" srcSet={posterSrcset(poster, "webp")} sizes="100vw" />
          <img
            src={`${poster.base}-${poster.width >= 1920 ? 1920 : 1280}.webp`}
            width={poster.width}
            height={poster.height}
            alt=""
            fetchPriority="high"
          />
        </picture>
      )}
    </div>
  );
}
