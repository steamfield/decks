import { useSlide } from "@steamfield/decks";
import { DUR, FILTER_IDS, filterUrl, SETTLE, TRACE, useStage } from "@steamfield/decks/kit";
import { gsap, motionMode, useTween } from "@steamfield/decks/motion";
import { useEffect, useId, useRef, useState } from "react";
import { RIDGE, RIDGE_WINDOW } from "../data/01-cover";
import { MARK_PATH, MARK_SIZE, SUNSET_STOPS } from "../data/brand";
import { FIELD, FRAME, noise, OFF, ON } from "./design";

const LIVE_TIMEOUT_MS = 3000;
// PlayView unmounts distant slides; returning still skips the one-time sunrise.
const visits = new Map<string, { visited: boolean; failed: boolean }>();
const floor = FRAME.height - FIELD.horizon;
const ridgePoints = RIDGE.map(
  (h, i) =>
    `${((i / (RIDGE.length - 1)) * FRAME.width).toFixed(1)} ${(FIELD.horizon - h * FIELD.ridgeHeight).toFixed(1)}`,
);
const ridgeLine = `M${ridgePoints.join("L")}`;
const ridgeArea = `M0 ${FIELD.horizon}L${ridgePoints.join("L")}L${FRAME.width} ${FIELD.horizon}Z`;
const stars = Array.from({ length: FIELD.stars }, (_, i) => ({
  x: noise(1, i) * FRAME.width,
  y: noise(2, i) * (FIELD.horizon - FIELD.ridgeHeight),
  r: FIELD.starMin + noise(3, i) * FIELD.starSpan,
  o: noise(4, i) * FIELD.starOpacity,
}));
const fan = Array.from({ length: FIELD.fanCount }, (_, i) => {
  const offset = (i - (FIELD.fanCount - 1) / 2) * FIELD.fanSpacing;
  return `M${FIELD.sunX} ${FIELD.horizon}L${FIELD.sunX + offset} ${FRAME.height}`;
});
const label = `Night drive: the Steamfield mark as a setting sun over a ridgeline drawn from ${RIDGE_WINDOW.days} days of commits across ${RIDGE_WINDOW.repos} product repositories.`;

export function NightDriveField({ low = false }: { low?: boolean }) {
  const prefix = useId();
  const canvas = useRef<HTMLCanvasElement>(null);
  const entrance = useRef<gsap.core.Timeline | null>(null);
  const ambient = useRef<gsap.core.Tween | null>(null);
  const { id, renderContext } = useSlide();
  const [mode, setMode] = useState<"still" | "pending" | "live">("still");
  const [motion, setMotion] = useState<"instant" | "live">("instant");
  const s = useTween({ grid: OFF, ridge: OFF, sun: OFF });
  const drift = useTween({ p: OFF });
  const { isActive, playCount } = useStage({
    copy: [{ lead: "" }],
    enter: (tl) => {
      entrance.current = tl;
      tl.to(s, { grid: ON, duration: DUR.scale, ease: SETTLE });
      tl.to(s, { ridge: ON, duration: DUR.trace, ease: TRACE }, "<");
      tl.to(s, { sun: ON, duration: DUR.bloom, ease: TRACE }, `<+=${DUR.opacity}`);
    },
    beats: (_tl, beat) => beat(0),
  });

  useEffect(() => {
    const sync = () => {
      const next = motionMode();
      if (next === "instant") entrance.current?.progress(1).pause();
      setMotion(next);
    };
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-deck-motion"],
    });
    sync();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (renderContext !== "slide" || motion === "instant") {
      drift.p = OFF;
      return;
    }
    const tween = gsap.to(drift, {
      p: ON,
      duration: DUR.bloom,
      ease: "none",
      repeat: -1,
      paused: true,
    });
    ambient.current = tween;
    return () => {
      tween.kill();
      ambient.current = null;
    };
  }, [renderContext, motion, drift]);

  useEffect(() => {
    if (renderContext === "slide" && motion === "live") ambient.current?.paused(!isActive);
  }, [isActive, renderContext, motion]);

  useEffect(() => {
    setMode("still");
    if (!isActive || renderContext !== "slide" || motion === "instant") return;
    const visit = visits.get(id) ?? { visited: false, failed: false };
    visits.set(id, visit);
    if (visit.failed || typeof WebGL2RenderingContext === "undefined") return;
    const el = canvas.current;
    if (!el) return;
    const settled = visit.visited;
    visit.visited = true;
    let cancelled = false;
    let live: { dispose(): void } | undefined;
    const stop = () => {
      cancelled = true;
      clearTimeout(fallback);
      try {
        live?.dispose();
      } finally {
        live = undefined;
        setMode("still");
      }
    };
    setMode("pending");
    const fallback = setTimeout(() => {
      visit.failed = true;
      stop();
    }, LIVE_TIMEOUT_MS);
    void import("../scene/night-drive")
      .then(({ mountNightDrive }) => {
        if (cancelled) return;
        live = mountNightDrive(el, RIDGE, {
          horizon: FIELD.horizon / FRAME.height,
          sunX: FIELD.sunX / FRAME.width,
          crtLine: Math.max(3, Math.round((el.clientWidth * 4) / FRAME.width)),
          settled,
          onFirstFrame: () => {
            if (cancelled) return;
            clearTimeout(fallback);
            setMode("live");
          },
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.warn("NightDriveField: live scene unavailable, showing the still picture.", error);
        visit.failed = true;
        stop();
      });
    return stop;
  }, [id, isActive, renderContext, motion]);

  const sink = FIELD.sunSink + (low ? FIELD.sunSize / 4 : 0);
  const top = FIELD.horizon - FIELD.sunSize + sink + (ON - s.sun) * FIELD.sunRise;
  const sunTransform = `translate(${FIELD.sunX - FIELD.sunSize / 2} ${top}) scale(${FIELD.sunSize / MARK_SIZE})`;
  const cross = Array.from({ length: FIELD.crossCount }, (_, k) => {
    const t = (k + drift.p) / FIELD.crossCount;
    return {
      id: `c${k}`,
      y: FIELD.horizon + floor * t ** FIELD.crossPower,
      o: FIELD.gridFar + (FIELD.gridNear - FIELD.gridFar) * t,
    };
  });

  return (
    <div className={`sf-night${mode === "live" ? " is-live" : ""}`}>
      {/* Disposed WebGL contexts cannot be reused: every activation gets a fresh canvas. */}
      <canvas
        key={`${playCount}-${motion}`}
        ref={canvas}
        className="sf-night-canvas"
        tabIndex={-1}
        aria-hidden="true"
      />
      <svg
        className="sf-night-drive"
        viewBox={FRAME.viewBox}
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label={label}
      >
        <defs>
          <linearGradient id={`${prefix}-sf-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop className="sf-sky-top" offset="0" stopOpacity={OFF} />
            <stop
              className="sf-sky-mid"
              offset={FIELD.skyMidAt}
              stopOpacity={FIELD.skyMidOpacity}
            />
            <stop className="sf-sky-haze" offset="1" stopOpacity={FIELD.skyHazeOpacity} />
          </linearGradient>
          <linearGradient id={`${prefix}-sf-sunset`} x1="0" y1="0" x2="0" y2="1">
            {SUNSET_STOPS.map((offset, i) => (
              <stop key={offset} className={`sf-sun-${i + 1}`} offset={offset} />
            ))}
          </linearGradient>
          <radialGradient id={`${prefix}-sf-halo`}>
            <stop className="sf-sun-halo" offset="0" stopOpacity={FIELD.haloOpacity} />
            <stop className="sf-sun-halo" offset="1" stopOpacity={OFF} />
          </radialGradient>
          <linearGradient id={`${prefix}-sf-floor-fade`} x1="0" y1="0" x2="0" y2="1">
            <stop className="sf-fade-0" offset="0" />
            <stop className="sf-fade-1" offset="1" />
          </linearGradient>
        </defs>
        <g style={{ opacity: mode === "still" ? ON : OFF }}>
          <rect
            x="0"
            y="0"
            width={FRAME.width}
            height={FIELD.horizon}
            fill={`url(#${prefix}-sf-sky)`}
          />
          {stars.map((star) => (
            <circle
              key={star.x}
              className="sf-star"
              cx={star.x}
              cy={star.y}
              r={star.r}
              style={{ opacity: star.o }}
            />
          ))}
          <circle
            cx={FIELD.sunX}
            cy={FIELD.horizon - FIELD.sunSize / 2 + sink}
            r={FIELD.haloRadius}
            fill={`url(#${prefix}-sf-halo)`}
            style={{ opacity: s.sun }}
          />
          <g transform={sunTransform} style={{ opacity: s.sun }}>
            <path d={MARK_PATH} fill={`url(#${prefix}-sf-sunset)`} />
          </g>
          <rect className="sf-ground" x="0" y={FIELD.horizon} width={FRAME.width} height={floor} />
          <path className="sf-ridge-fill" d={ridgeArea} />
          <path
            className="sf-ridge-line"
            d={ridgeLine}
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset={ON - s.ridge}
            filter={filterUrl(FILTER_IDS.glow)}
          />
          <g style={{ opacity: s.grid }}>
            {fan.map((d) => (
              <path
                key={d}
                className="sf-grid-line"
                d={d}
                style={{ opacity: FIELD.gridFar + FIELD.gridFar }}
              />
            ))}
            {cross.map((line) => (
              <line
                key={line.id}
                className="sf-grid-line"
                x1="0"
                x2={FRAME.width}
                y1={line.y}
                y2={line.y}
                style={{ opacity: line.o }}
              />
            ))}
            <line
              className="sf-horizon"
              x1="0"
              x2={FRAME.width}
              y1={FIELD.horizon}
              y2={FIELD.horizon}
              style={{ opacity: FIELD.horizonOpacity }}
            />
          </g>
          <rect
            x="0"
            y={FIELD.horizon + floor * FIELD.fadeFrom}
            width={FRAME.width}
            height={floor * (ON - FIELD.fadeFrom)}
            fill={`url(#${prefix}-sf-floor-fade)`}
          />
        </g>
      </svg>
    </div>
  );
}
