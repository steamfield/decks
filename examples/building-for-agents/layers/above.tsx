import { useDeck, useSlide, useSlideScale } from "@steamfield/decks";
import { motionMode } from "@steamfield/decks/motion";
import { type CSSProperties, useId, useLayoutEffect, useRef, useState } from "react";
import { FRAME } from "../components/design";
import { warpMapUrl, warpScale } from "../scene/warp";
import styles from "../styles/above.module.css";

const POWER_KEY = "sf-tube-power";
/** Slightly longer than --sf-tube-power, as in the Slidev tube. */
const POWER_MS = 700;
/** The barrel filter's pixel budget: a 16:10 laptop window at 2x is about 9.6 MP, a phone 25-55. */
const MAX_WARP_PIXELS = 4096 * 4096;

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

  // Where the 16:9 picture sits in the window, in canvas px. The picture fills a 16:9 window
  // with no credit; otherwise the window is larger on one axis and the picture is centred
  // above the credit's band.
  const [box, setBox] = useState({
    width: FRAME.width as number,
    height: FRAME.height as number,
    left: 0,
    top: 0,
    windowWidth: FRAME.width as number,
    windowHeight: FRAME.height as number,
  });
  useLayoutEffect(() => {
    const el = host.current;
    if (!on || !el || scale <= 0) return;
    const measure = () => {
      const windowWidth = el.offsetWidth / scale;
      const windowHeight = el.offsetHeight / scale;
      const band = Number.parseFloat(getComputedStyle(el).getPropertyValue("--deck-credit-space"));
      const room = windowHeight - (Number.isFinite(band) ? band : 0);
      const width = Math.min(windowWidth, (room * FRAME.width) / FRAME.height);
      const height = (width * FRAME.height) / FRAME.width;
      setBox({
        width,
        height,
        left: (windowWidth - width) / 2,
        top: (room - height) / 2,
        windowWidth,
        windowHeight,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [on, scale]);

  // WebKit filters the frame in canvas units at the device pixel ratio. A phone (3x, and in
  // portrait a window three frames tall) needs a buffer iOS will not allocate, and the frame
  // then draws nothing, or the cover's WebGL takes the tab down. Past the budget the picture
  // goes without the warp.
  const warp = box.windowWidth * box.windowHeight * window.devicePixelRatio ** 2 <= MAX_WARP_PIXELS;
  useLayoutEffect(() => {
    if (!on || !map || !warp) return;
    const slide = host.current?.closest<HTMLElement>("[data-deck-slide]");
    if (!slide) return;
    slide.style.setProperty("--sf-barrel-filter", `url("#${id}")`);
    return () => {
      slide.style.removeProperty("--sf-barrel-filter");
    };
  }, [on, map, id, warp]);

  if (!on || scale <= 0) return null;
  const style: CSSProperties & Record<`--${string}`, string> = {
    "--od-fw": `${box.width * scale}px`,
    "--od-fh": `${box.height * scale}px`,
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
          {/* The warp covers the window, not only the picture, so a scene that bleeds past the
              picture is not cut off at its edge. The filter's box is the picture's. */}
          <filter
            id={id}
            x={-box.left / box.width}
            y={-box.top / box.height}
            width={box.windowWidth / box.width}
            height={box.windowHeight / box.height}
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={map || undefined}
              x={-box.left}
              y={-box.top}
              width={box.windowWidth}
              height={box.windowHeight}
              preserveAspectRatio="none"
              result="map"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={warpScale(box.windowWidth)}
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
