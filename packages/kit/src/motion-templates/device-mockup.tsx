import { duration, ease } from "@react-decks/motion";
import { registerSettleProbe } from "@react-decks/runtime";
import { type RefObject, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ink } from "../theme/theme";
import styles from "./device-mockup.module.css";
import type { TemplateProps } from "./motion-template-props";
import { useTemplateMotion } from "./use-template-motion";

export function DeviceMockup({
  src,
  alt,
  device,
  caption,
  at = 0,
  accent = "cyan",
}: TemplateProps<"device-mockup">) {
  if (!Number.isSafeInteger(at) || at < 0) throw new Error(`device-mockup: invalid at ${at}`);
  if (typeof src !== "string" || !src.trim())
    throw new Error(`device-mockup: invalid src ${JSON.stringify(src)}`);
  if (typeof alt !== "string" || !alt.trim())
    throw new Error(`device-mockup: invalid alt ${JSON.stringify(alt)}`);
  if (!["laptop", "phone", "browser"].includes(device))
    throw new Error(`device-mockup: invalid device ${JSON.stringify(device)}`);

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
    if (!ready) console.warn(`device-mockup: could not load ${src}`);
    // Position the timeline before the browser paints the newly loaded image.
    flushSync(() => setImage(ready ? "ready" : "failed"));
  }

  return (
    <figure
      ref={figure}
      className={styles.mockup}
      aria-label={image === "failed" ? alt : undefined}
      style={{ visibility: image === "loading" ? "hidden" : undefined }}
    >
      {image !== "failed" && (
        <div className={styles[device]}>
          <svg
            aria-hidden="true"
            viewBox={
              device === "phone"
                ? "0 0 200 400"
                : device === "browser"
                  ? "0 0 800 500"
                  : "0 0 800 460"
            }
            stroke={ink(accent, 3)}
            strokeWidth="2"
            fill="var(--od-surface-raised)"
          >
            {device === "laptop" && (
              <>
                <rect x="40" y="2" width="720" height="419" rx="14" />
                <path d="M2 422 H798 L777 451 Q771 458 758 458 H42 Q29 458 23 451 Z" />
                <path d="M345 425 H455" />
              </>
            )}
            {device === "phone" && (
              <>
                <rect x="2" y="2" width="196" height="396" rx="26" />
                <path d="M80 15 H120 M81 384 H119" strokeLinecap="round" />
              </>
            )}
            {device === "browser" && (
              <>
                <rect x="2" y="2" width="796" height="496" rx="13" />
                <g fill={ink(accent, 3)} stroke="none">
                  <circle cx="23" cy="21" r="5" />
                  <circle cx="42" cy="21" r="5" />
                  <circle cx="61" cy="21" r="5" />
                </g>
                <path d="M84 21 H261" stroke="var(--od-text-dim)" />
              </>
            )}
          </svg>
          <img
            src={src}
            alt={alt}
            onLoad={(event) => finishImage(event.currentTarget)}
            onError={() => finishImage()}
          />
        </div>
      )}
      {caption && <p className="od-body">{caption}</p>}
      {image !== "loading" && <DeviceEntrance figure={figure} at={at} />}
    </figure>
  );
}

function DeviceEntrance({ figure, at }: { figure: RefObject<HTMLElement | null>; at: number }) {
  useTemplateMotion(at, (tl) => {
    const card = figure.current;
    if (!card) return;
    const screen = card.querySelector("img");
    const caption = card.querySelector("p");
    // The device rises off the baseline. Its display lights up before the caption comes to rest.
    tl.fromTo(
      card,
      { autoAlpha: 0, y: "0.75em" },
      { autoAlpha: 1, y: "0em", duration: duration.slow, ease: ease.snap },
    );
    if (screen)
      tl.fromTo(
        screen,
        { opacity: 0 },
        { opacity: 1, duration: duration.base, ease: ease.snap },
        duration.quick,
      );
    if (caption)
      tl.fromTo(
        caption,
        { opacity: 0, yPercent: 25 },
        { opacity: 1, yPercent: 0, duration: duration.base, ease: ease.snap },
        duration.base,
      );
  });
  return null;
}
