import { duration, ease } from "@react-decks/motion";
import { registerSettleProbe } from "@react-decks/runtime";
import { useLayoutEffect, useRef, useState } from "react";
import { ink } from "../theme/theme";
import type { TemplateProps } from "./motion-template-props";
import styles from "./spotlight.module.css";
import { useTemplateMotion } from "./use-template-motion";

export function Spotlight({
  src,
  alt,
  x,
  y,
  label,
  at = 0,
  accent = "cyan",
}: TemplateProps<"spotlight">) {
  if (!Number.isSafeInteger(at) || at < 0)
    throw new Error(`spotlight: at must be a non-negative whole number, got ${at}`);
  for (const [field, value] of Object.entries({ src, alt, label }))
    if (!value.trim())
      throw new Error(`spotlight: ${field} must contain text, got ${JSON.stringify(value)}`);
  for (const [field, value] of Object.entries({ x, y }))
    if (!Number.isFinite(value) || value < 0 || value > 1)
      throw new Error(`spotlight: ${field} must be between 0 and 1, got ${value}`);

  const photo = useRef<HTMLImageElement>(null);
  const light = useRef<HTMLImageElement>(null);
  const ring = useRef<SVGCircleElement>(null);
  const leader = useRef<HTMLSpanElement>(null);
  const caption = useRef<HTMLParagraphElement>(null);
  const [imageState, setImageState] = useState<"loading" | "ready" | "failed">("loading");
  const reported = useRef(false);
  useLayoutEffect(() => {
    const image = photo.current;
    if (!image) return;
    let waiting = true;
    const unregister = registerSettleProbe(() => waiting);
    function finish() {
      waiting = false;
      if (image?.naturalWidth) setImageState("ready");
      else {
        setImageState("failed");
        if (!reported.current) console.warn(`spotlight: could not load ${src}`);
        reported.current = true;
      }
    }
    image.addEventListener("load", finish);
    image.addEventListener("error", finish);
    if (image.complete) finish();
    return () => {
      unregister();
      image.removeEventListener("load", finish);
      image.removeEventListener("error", finish);
    };
  }, [src]);
  const layout = (
    <div
      className={styles.figure}
      style={{ "--x": `${x * 100}%`, "--y": `${y * 100}%`, color: ink(accent, 3) }}
    >
      <div className={styles.image}>
        <img ref={photo} src={src} alt={alt} />
        <div hidden={imageState !== "ready"}>
          <img ref={light} className={styles.light} src={src} alt="" />
          <svg className={styles.ring} viewBox="0 0 100 100" aria-hidden="true">
            <circle
              ref={ring}
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
            />
          </svg>
          <span ref={leader} className={styles.leader} aria-hidden="true" />
        </div>
      </div>
      <p hidden={imageState === "loading"} ref={caption} className={styles.caption}>
        <strong>{label}</strong>
      </p>
    </div>
  );

  useTemplateMotion(at, (tl) => {
    // The dim image establishes the field before the ring traces the point.
    const timing = { duration: duration.slow, ease: ease.enter };
    tl.fromTo(photo.current, { autoAlpha: 0 }, { autoAlpha: 1, ...timing });
    tl.fromTo(
      ring.current,
      { drawSVG: "0%", autoAlpha: 0 },
      { drawSVG: "100%", autoAlpha: 1, ...timing },
      `<${duration.quick}`,
    );
    // Detail returns inside the ring as the leader draws towards the caption.
    tl.fromTo(light.current, { autoAlpha: 0 }, { autoAlpha: 1, ...timing }, `<${duration.quick}`);
    tl.fromTo(
      leader.current,
      { scaleX: 0 },
      { scaleX: 1, duration: duration.base, ease: ease.enter },
      `<${duration.quick}`,
    );
    tl.fromTo(
      caption.current,
      { autoAlpha: 0, x: 16 },
      { autoAlpha: 1, x: 0, duration: duration.base, ease: ease.enter },
      `<${duration.quick}`,
    );
  });
  return layout;
}
