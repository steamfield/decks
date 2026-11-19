import { duration, ease } from "@react-decks/motion";
import { registerSettleProbe } from "@react-decks/runtime";
import { type RefObject, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ink } from "../theme/theme";
import type { TemplateProps } from "./motion-template-props";
import styles from "./photo-reveal.module.css";
import { useTemplateMotion } from "./use-template-motion";

export function PhotoReveal({
  src,
  alt,
  caption,
  credit,
  at = 0,
  accent = "cyan",
}: TemplateProps<"photo-reveal">) {
  if (!Number.isSafeInteger(at) || at < 0) throw new Error(`photo-reveal: invalid at ${at}`);
  if (typeof src !== "string" || !src.trim())
    throw new Error(`photo-reveal: invalid src ${JSON.stringify(src)}`);
  if (typeof alt !== "string" || !alt.trim())
    throw new Error(`photo-reveal: invalid alt ${JSON.stringify(alt)}`);
  if (typeof caption !== "string" || !caption.trim())
    throw new Error(`photo-reveal: invalid caption ${JSON.stringify(caption)}`);

  const figure = useRef<HTMLElement>(null);
  const [image, setImage] = useState<"loading" | "ready" | "failed">("loading");
  useLayoutEffect(() => {
    if (image !== "loading") return;
    const img = figure.current?.querySelector("img");
    // A cached image can already have dimensions before the browser delivers its load event.
    if (img?.complete && img.naturalWidth > 0 && img.naturalHeight > 0) setImage("ready");
    return registerSettleProbe(() => true, "image load");
  }, [image]);

  function finishImage(img?: HTMLImageElement) {
    const ready = img && img.naturalWidth > 0 && img.naturalHeight > 0;
    if (!ready) console.warn(`photo-reveal: could not load ${src}`);
    // Position the timeline before the browser paints the newly loaded image.
    flushSync(() => setImage(ready ? "ready" : "failed"));
  }

  return (
    <figure
      ref={figure}
      className={styles.photo}
      aria-label={image === "failed" ? alt : undefined}
      style={{ visibility: image === "loading" ? "hidden" : undefined }}
    >
      {image !== "failed" && (
        <>
          <img
            src={src}
            alt={alt}
            onLoad={(event) => finishImage(event.currentTarget)}
            onError={() => finishImage()}
          />
          <div className={styles.scrim} aria-hidden="true" />
        </>
      )}
      <div className={styles.caption}>
        <h2 style={{ borderLeftColor: ink(accent, 3) }}>{caption}</h2>
        {credit && <p className="od-body">{credit}</p>}
      </div>
      {image !== "loading" && <PhotoEntrance figure={figure} at={at} />}
    </figure>
  );
}

function PhotoEntrance({ figure, at }: { figure: RefObject<HTMLElement | null>; at: number }) {
  useTemplateMotion(at, (tl) => {
    const card = figure.current;
    if (!card) return;
    const image = card.querySelector("img");
    const scrim = card.querySelector('[aria-hidden="true"]');
    const credit = card.querySelector("p");
    // The near crop eases back to the full image as shade rises from the bottom edge.
    tl.fromTo(card, { autoAlpha: 0 }, { autoAlpha: 1, duration: duration.base, ease: ease.snap });
    if (image)
      tl.fromTo(
        image,
        { scale: 1.08 },
        { scale: 1, duration: duration.slow + duration.base, ease: ease.snap },
        0,
      );
    if (scrim)
      tl.fromTo(
        scrim,
        { yPercent: 100 },
        { yPercent: 0, duration: duration.slow, ease: ease.slam },
        0,
      );
    // The caption reaches its baseline first, followed by the credit.
    tl.fromTo(
      card.querySelector("h2"),
      { opacity: 0, yPercent: 32 },
      { opacity: 1, yPercent: 0, duration: duration.base, ease: ease.snap },
      duration.quick,
    );
    if (credit)
      tl.fromTo(
        credit,
        { opacity: 0, yPercent: 30 },
        { opacity: 1, yPercent: 0, duration: duration.base, ease: ease.snap },
        duration.base,
      );
  });
  return null;
}
