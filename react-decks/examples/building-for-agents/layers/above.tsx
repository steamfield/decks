import { motionMode } from "@react-decks/motion";
import { useDeck, useSlide, useSlideScale } from "@react-decks/runtime";
import { type CSSProperties, useId, useLayoutEffect, useRef, useState } from "react";
import { FRAME } from "../components/design";
import { warpMapUrl, warpScale } from "../scene/warp";
import styles from "../styles/above.module.css";

const POWER_KEY = "sf-tube-power";
/** Slightly longer than --sf-tube-power, as in the Slidev tube. */
const POWER_MS = 700;

/** The glass stays in screen pixels; the picture's filter uses canvas coordinates. */
export default function Above() {
  const { view, embedded } = useDeck();
  const { renderContext, isActive } = useSlide();
  const scale = useSlideScale();
  const on = renderContext === "slide" && isActive && view === "play" && !embedded;
  const id = useId();
  const host = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState("");
  const [live, setLive] = useState(false);
  const [power, setPower] = useState(false);

  useLayoutEffect(() => {
    if (!on) return;
    setMap(warpMapUrl());
    const updateMotion = () => setLive(motionMode() === "live");
    updateMotion();
    const observer = new MutationObserver(updateMotion);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-deck-motion"],
    });
    return () => observer.disconnect();
  }, [on]);

  useLayoutEffect(() => {
    if (!on || !map) return;
    const slide = host.current?.closest<HTMLElement>("[data-deck-slide]");
    if (!slide) return;
    slide.style.setProperty("--sf-barrel-filter", `url("#${id}")`);
    return () => {
      slide.style.removeProperty("--sf-barrel-filter");
    };
  }, [on, map, id]);

  useLayoutEffect(() => {
    if (!on) return;
    let seen = true;
    try {
      seen = sessionStorage.getItem(POWER_KEY) === "1";
      sessionStorage.setItem(POWER_KEY, "1");
    } catch (error) {
      // The picture is usable without storage; the optional power-on is skipped.
      console.warn("building-for-agents: tube session storage is unavailable", error);
    }
    if (seen) return;
    setPower(true);
    const timer = setTimeout(() => setPower(false), POWER_MS);
    return () => {
      clearTimeout(timer);
      setPower(false);
    };
  }, [on]);

  // The window in canvas px. It is the frame at 16:9 and larger on one axis otherwise.
  const [size, setSize] = useState<{ width: number; height: number }>(FRAME);
  useLayoutEffect(() => {
    const el = host.current;
    if (!on || !el || scale <= 0) return;
    const measure = () =>
      setSize({
        width: Math.max(FRAME.width, el.offsetWidth / scale),
        height: Math.max(FRAME.height, el.offsetHeight / scale),
      });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [on, scale]);

  if (!on || scale <= 0) return null;
  // The warp covers the window, not only the frame, so a scene that bleeds past the frame is
  // not cut off at the frame's edge.
  const bleedX = (size.width - FRAME.width) / 2;
  const bleedY = (size.height - FRAME.height) / 2;
  const style: CSSProperties & Record<`--${string}`, string> = {
    "--od-fw": `${FRAME.width * scale}px`,
    "--od-fh": `${FRAME.height * scale}px`,
    "--sf-tube-scale": String(scale),
    "--sf-tube-counter-scale": String(1 / scale),
  };
  return (
    <div
      ref={host}
      className={`od-slide is-story sf-tube-host ${styles.host}${live ? ` ${styles.live}` : ""}`}
      style={style}
      aria-hidden="true"
    >
      <svg className="sf-tube-defs" width="0" height="0" aria-hidden="true">
        <defs>
          <filter
            id={id}
            x={-bleedX / FRAME.width}
            y={-bleedY / FRAME.height}
            width={size.width / FRAME.width}
            height={size.height / FRAME.height}
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={map || undefined}
              x={-bleedX}
              y={-bleedY}
              width={size.width}
              height={size.height}
              preserveAspectRatio="none"
              result="map"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={warpScale(size.width)}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      <div className={`sf-tube${power && live ? " is-power" : ""}`}>
        <span className="sf-tube-grain" />
        <span className="sf-tube-hum" />
        <span className="sf-tube-power">
          <span className="sf-tube-power-top" />
          <span className="sf-tube-power-bottom" />
          <span className="sf-tube-power-line" />
          <span className="sf-tube-power-wash" />
        </span>
      </div>
    </div>
  );
}
