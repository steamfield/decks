import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { type Poster, posterSrcset } from "../../lib/player/example";
import { parseDeckMessage } from "../../lib/player/protocol";
import { createStageController, type StageController } from "../../lib/stage/controller";

type Props = {
  /** The deck's page, `/d/<name>/index.html`. */
  src: string;
  poster: Poster;
  /** What the agent has built so far; the stage's accessible name. */
  label: string;
  /**
   * The poster under `prefers-reduced-motion: reduce`, chosen by the browser from the
   * picture's sources, so the server's HTML is right for either preference.
   */
  reducedPoster?: Poster;
  /**
   * The name under reduced motion, for HTML rendered before the media is known: with it, the
   * name is whichever of `label` and this one landing.css leaves displayed.
   */
  reducedLabel?: string;
  /** Shows the poster alone and mounts no deck. */
  still?: boolean;
  /**
   * Receives the stage's controller once the frame is mounted, and null when the frame goes
   * away and its controller is disposed; the parent drives the deck.
   */
  onController?: (controller: StageController | null) => void;
  /** Where the deck boots, as `/<slide>?clicks=<beat>`. */
  initialHash?: string;
  /** The poster's `sizes`, matching the slot the stage fills. */
  sizes?: string;
};

const REDUCED = "(prefers-reduced-motion: reduce)";

/** The poster's fallback image: its widest WebP. */
const fallbackSrc = (poster: Poster) => `${poster.base}-${poster.width >= 1920 ? 1920 : 1280}.webp`;

/**
 * The landing session's deck: the slide alone, driven by a script through its controller.
 * The server renders the poster; the deck's frame mounts only in the browser, behind the
 * poster, which stays until the first command after ready has settled.
 */
export function DeckStage({
  src,
  poster,
  label,
  reducedPoster,
  reducedLabel,
  still = false,
  onController,
  initialHash = "",
  sizes = "100vw",
}: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [mounted, setMounted] = useState(false);
  const [liveSrc, setLiveSrc] = useState<string | null>(null);
  const withFrame = mounted && !still;
  const live = withFrame && liveSrc === src;
  const labelId = useId();
  const handOver = useRef(onController);
  useLayoutEffect(() => {
    handOver.current = onController;
  });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const element = frame.current;
    if (!withFrame || !element) return;
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
      setLiveSrc(null);
      handOver.current?.(null);
    };
  }, [src, withFrame]);

  const name =
    reducedLabel === undefined ? { "aria-label": label } : { "aria-labelledby": labelId };

  return (
    <div className="deck-stage" role="img" {...name}>
      {reducedLabel !== undefined && (
        <span id={labelId} className="sr-only">
          <span className="deck-stage-name-motion">{label}</span>
          <span className="deck-stage-name-reduced">{reducedLabel}</span>
        </span>
      )}
      {withFrame && (
        <iframe
          ref={frame}
          src={`${src}?decks-bridge=1#${initialHash}`}
          title={label}
          aria-hidden="true"
          tabIndex={-1}
          inert
          style={{ visibility: live ? "visible" : "hidden" }}
        />
      )}
      {!live && (
        <picture>
          {reducedPoster && (
            <>
              <source
                media={REDUCED}
                type="image/avif"
                srcSet={posterSrcset(reducedPoster, "avif")}
                sizes={sizes}
              />
              <source
                media={REDUCED}
                type="image/webp"
                srcSet={posterSrcset(reducedPoster, "webp")}
                sizes={sizes}
              />
            </>
          )}
          <source type="image/avif" srcSet={posterSrcset(poster, "avif")} sizes={sizes} />
          <source type="image/webp" srcSet={posterSrcset(poster, "webp")} sizes={sizes} />
          <img
            src={fallbackSrc(poster)}
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
