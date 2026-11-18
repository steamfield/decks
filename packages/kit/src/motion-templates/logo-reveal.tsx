import { duration, ease } from "@react-decks/motion";
import { registerSettleProbe } from "@react-decks/runtime";
import { type RefObject, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ink } from "../theme/theme";
import styles from "./logo-reveal.module.css";
import type { TemplateProps } from "./motion-template-props";
import { useTemplateMotion } from "./use-template-motion";

export function LogoReveal({
  src,
  alt,
  tagline,
  at = 0,
  accent = "cyan",
}: TemplateProps<"logo-reveal">) {
  if (!Number.isSafeInteger(at) || at < 0) throw new Error(`logo-reveal: invalid at ${at}`);
  if (typeof src !== "string" || !src.trim())
    throw new Error(`logo-reveal: invalid src ${JSON.stringify(src)}`);
  if (typeof alt !== "string" || !alt.trim())
    throw new Error(`logo-reveal: invalid alt ${JSON.stringify(alt)}`);

  const figure = useRef<HTMLElement>(null);
  const [image, setImage] = useState<"loading" | "ready" | "failed">("loading");
  useLayoutEffect(() => {
    if (image !== "loading") return;
    const img = figure.current?.querySelector("img");
    // A cached image can already have dimensions before the browser delivers its load event.
    if (img?.complete && img.naturalWidth > 0 && img.naturalHeight > 0) setImage("ready");
    return registerSettleProbe(() => true);
  }, [image]);

  function finishImage(img?: HTMLImageElement) {
    const ready = img && img.naturalWidth > 0 && img.naturalHeight > 0;
    if (!ready) console.warn(`logo-reveal: could not load ${src}`);
    // Position the timeline before the browser paints the newly loaded image.
    flushSync(() => setImage(ready ? "ready" : "failed"));
  }

  return (
    <figure
      ref={figure}
      className={styles.logo}
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
          <hr style={{ backgroundColor: ink(accent, 3) }} />
        </>
      )}
      {tagline && <p className="od-body">{tagline}</p>}
      {image !== "loading" && <LogoEntrance figure={figure} at={at} />}
    </figure>
  );
}

function LogoEntrance({ figure, at }: { figure: RefObject<HTMLElement | null>; at: number }) {
  useTemplateMotion(at, (tl) => {
    const card = figure.current;
    if (!card) return;
    const logo = card.querySelector("img");
    const rule = card.querySelector("hr");
    const tagline = card.querySelector("p");
    // The mask opens from the centre while the mark settles to its printed size.
    tl.fromTo(card, { autoAlpha: 0 }, { autoAlpha: 1, duration: duration.quick, ease: ease.enter });
    if (logo)
      tl.fromTo(
        logo,
        { clipPath: "inset(0% 50% 0% 50%)", scale: 1.06 },
        { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: duration.slow, ease: ease.enter },
        0,
      );
    // The underline grows from its midpoint and the tagline comes up underneath.
    if (rule)
      tl.fromTo(
        rule,
        { scaleX: 0 },
        { scaleX: 1, duration: duration.base, ease: ease.enter },
        duration.quick,
      );
    if (tagline)
      tl.fromTo(
        tagline,
        { opacity: 0, yPercent: 24 },
        { opacity: 1, yPercent: 0, duration: duration.base, ease: ease.enter },
        duration.base,
      );
  });
  return null;
}
