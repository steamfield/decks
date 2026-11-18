import { GeoMap, type GeoMapHandle, type GeoMapSpec } from "@opendata-ai/openchart-react";
import { registerSettleProbe, useSlide } from "@steamfield/decks";
import {
  DUR,
  gsap,
  SETTLE,
  StoryCard,
  StoryLink,
  StoryStage,
  slideChartTheme,
  useFrameScale,
  useStage,
} from "@steamfield/decks/kit";
import { motionMode } from "@steamfield/decks/motion";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AISD_CAMPUSES,
  AISD_CAMPUSES_BUCKETED,
  ARTICLE_URL,
  ECO_DIS_DOMAIN,
  ECO_DIS_RANGE_DARK,
  RATING_DOMAIN,
  ratingRange,
} from "../data/09b-campus-map";
import austinZipsTopo from "../data/austin-zips.json";
import styles from "./InkCampusMapStage.module.css";

const STEPS = [null, null, new Set(["F"]), new Set(["A", "B"])];
// GeoMap's default update is 450 ms; the probe and the map share this clock.
const MAP_UPDATE = DUR.scale / 2;
const COPY = [
  { lead: "The east side lights up.", body: "Each dot is a campus, brighter the poorer it is." },
  { lead: "Same dots, now colored by rating.", body: "TEA accountability grades, A through F." },
  {
    lead: "The F campuses trace east Austin.",
    body: "F campuses average 91% economically disadvantaged.",
  },
  { lead: "The A campuses sit on the west side.", body: "A campuses average 16%." },
];

export function InkCampusMapStage() {
  const chartScale = useFrameScale();
  const { clicks, isActive, playCount, copy, beats } = useStage({
    copy: COPY,
    beats: (_tl, beat) => {
      beat(0);
      beat(1);
      beat(2);
      beat(3);
    },
  });
  const { renderContext } = useSlide();
  const camera = useRef<HTMLDivElement>(null);
  const map = useRef<GeoMapHandle>(null);
  const [mapPx, setMapPx] = useState(0);
  const [mode, setMode] = useState<"live" | "instant" | null>(null);
  useLayoutEffect(() => {
    setMode(motionMode());
  });
  useLayoutEffect(() => {
    const el = camera.current;
    if (!el || chartScale === 0) return;
    const read = () => setMapPx(el.getBoundingClientRect().width);
    read();
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, [chartScale]);
  const animated = isActive && renderContext === "slide" && mode === "live";
  const entry = useRef({ visit: playCount, click: clicks });
  const entryClick = entry.current.visit === playCount ? entry.current.click : clicks;
  useLayoutEffect(() => {
    if (entry.current.visit !== playCount) entry.current = { visit: playCount, click: clicks };
  }, [playCount, clicks]);
  const spec = useMemo<GeoMapSpec>(
    () => ({
      type: "map",
      geo: {
        features: austinZipsTopo,
        idField: "id",
        projection: "mercator",
        focus: { points: true, padding: mapPx * 0.0817 },
      },
      data: [],
      encoding: {
        key: { field: "id", type: "nominal" },
        color: { field: "id", type: "nominal", legend: null },
      },
      points: {
        data: clicks === 0 ? AISD_CAMPUSES_BUCKETED : AISD_CAMPUSES,
        longitude: { field: "lon", type: "quantitative" },
        latitude: { field: "lat", type: "quantitative" },
        // GeoMap's default radii are screen pixels; scale them with the frame too.
        size: {
          field: "enrollment",
          type: "quantitative",
          scale: { range: [3 * chartScale, 20 * chartScale] },
        },
        color:
          clicks === 0
            ? {
                field: "ecoDisBucket",
                type: "nominal",
                title: "Economically disadvantaged",
                scale: { domain: ECO_DIS_DOMAIN, range: ECO_DIS_RANGE_DARK },
              }
            : {
                field: "rating",
                type: "nominal",
                title: "TEA rating",
                scale: { domain: RATING_DOMAIN, range: ratingRange(STEPS[clicks] ?? null) },
              },
        key: { field: "campusNumber", type: "nominal" },
        opacity: 0.75,
        tooltip: [
          { field: "campus", type: "nominal", title: "Campus" },
          { field: "rating", type: "nominal", title: "TEA rating" },
          { field: "ecoDis", type: "quantitative", title: "Econ. disadvantaged", format: ".0%" },
          { field: "enrollment", type: "quantitative", title: "Enrollment", format: ",.0f" },
        ],
      },
      legend: { show: false },
      watermark: false,
      animation: animated
        ? { enter: entryClick === 0, update: { duration: MAP_UPDATE * 1000 } }
        : false,
      theme: { ...slideChartTheme, spacing: { padding: 0 } },
    }),
    [clicks, mapPx, animated, chartScale, entryClick],
  );
  const busy = useRef(false);
  useEffect(() => {
    if (mapPx === 0) return;
    const instance = map.current?.instance;
    const focus = instance?.layout.focus;
    // Resizing should refit the cluster without the adapter's camera flight.
    if (instance && focus) instance.fitBounds(focus.target, { duration: 0 });
  }, [mapPx]);
  useEffect(() => registerSettleProbe(() => busy.current, "map camera tween"), []);
  useEffect(() => {
    if (!animated || mapPx === 0 || !spec.animation) return;
    // GeoMap exposes no completion event. Its update starts on the next frame.
    busy.current = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let frame = requestAnimationFrame(() => {
      timer = setTimeout(() => {
        frame = requestAnimationFrame(() => {
          busy.current = false;
        });
      }, MAP_UPDATE * 1000);
    });
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      busy.current = false;
    };
  }, [spec, animated, mapPx]);
  const legendMode = clicks === 0 ? "eco-dis" : "rating";
  const legend = useMemo(() => {
    const range = clicks === 0 ? ECO_DIS_RANGE_DARK : ratingRange(STEPS[clicks] ?? null);
    return (clicks === 0 ? ECO_DIS_DOMAIN : RATING_DOMAIN).map((label, i) => ({
      label,
      color: range[i],
    }));
  }, [clicks]);
  const [content, setContent] = useState<{
    mode: string;
    legend: typeof legend;
    old: typeof legend | null;
  }>({ mode: legendMode, legend, old: null });
  if (content.legend !== legend)
    setContent({
      mode: legendMode,
      legend,
      old: content.mode !== legendMode ? content.legend : content.old,
    });
  const incoming = useRef<HTMLUListElement>(null);
  const outgoing = useRef<HTMLUListElement>(null);
  useLayoutEffect(() => {
    if (!content.old) return;
    if (!animated) {
      setContent({ mode: legendMode, legend, old: null });
      return;
    }
    const tl = gsap.timeline({
      onComplete: () => setContent({ mode: legendMode, legend, old: null }),
    });
    tl.fromTo(
      incoming.current,
      { opacity: 0 },
      { opacity: 1, duration: DUR.card, ease: SETTLE },
      0,
    );
    tl.to(outgoing.current, { opacity: 0, duration: DUR.opacity }, 0);
    return () => {
      tl.kill();
    };
  }, [content.old, legendMode, animated, legend]);
  return (
    <StoryStage
      className={`${styles.stage}${animated ? ` ${styles.live}` : ""}`}
      beats={beats}
      click={clicks}
      overlay={
        <>
          <div className={styles.map}>
            <div ref={camera} className={styles.camera}>
              {mapPx > 0 && mode !== null && <GeoMap ref={map} spec={spec} darkMode="force" />}
            </div>
          </div>
          <div className={styles.head}>
            <h2 className="od-story-head">Austin's ratings follow its poverty map.</h2>
            <div className={styles.legendSwap}>
              {content.old && (
                <ul
                  ref={outgoing}
                  className={styles.legend}
                  aria-hidden="true"
                  style={{ position: "absolute", top: 0, left: 0, right: 0 }}
                >
                  {content.old.map((item) => (
                    <li key={item.label}>
                      <span className={styles.dot} style={{ background: item.color }} />
                      {item.label}
                    </li>
                  ))}
                </ul>
              )}
              <ul key={legendMode} ref={incoming} className={styles.legend}>
                {legend.map((item) => (
                  <li key={item.label}>
                    <span className={styles.dot} style={{ background: item.color }} />
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <StoryLink href={ARTICLE_URL} />
        </>
      }
      card={<StoryCard anchor="left" hue="cyan" lead={copy.lead} body={copy.body} />}
    />
  );
}
