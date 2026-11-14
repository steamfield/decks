import { useSlide } from "@steamfield/decks";
import {
  DRAW,
  DUR,
  ink,
  SETTLE,
  STAGE,
  StoryCard,
  StoryStage,
  useStage,
} from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import { useLayoutEffect, useRef, useState } from "react";
import {
  DEMO_ADDRESS,
  DEMO_LAYOUT_WIDTH,
  DEMO_URL,
  IMPLEMENTATIONS,
  INTERFACE,
  LINT_RULE,
  UI,
} from "../data/13-glass-browser";
import { TRANSPORT_INTERFACE } from "../data/code/13-glass-browser";
import { CodePane } from "./CodePane";
import { DIM, OFF, ON, type Pt, polyline } from "./design";
import { EvidenceTag } from "./EvidenceTag";
import styles from "./GlassBrowserStage.module.css";
import { NamePlate } from "./NamePlate";
import { ThreadRail } from "./ThreadRail";

const COPY = [
  {
    lead: "React code calls a Transport interface.",
    body: "One implementation calls Tauri and the other is a mock. A lint rule bans Tauri imports under src/app.",
  },
  {
    lead: "The mock runs the app without Tauri.",
    body: "Vitest, Playwright, the browser dev server and the docs site demo all use it.",
  },
];

const AXIS_X = 455;
const UI_BOX = { x: 300, y: 276, w: 310, h: 84 };
const FACE = { x: 250, y: 440, w: 410, h: 84 };
const IMPL = { y: 596, w: 330, h: 94, xs: [110, 470] };
const FORK_Y = 560;
const implMid = (i: number) => {
  const x = IMPL.xs[i];
  if (x === undefined) throw new Error(`No Glass browser implementation position ${i}`);
  return x + IMPL.w / 2;
};
const impls = IMPLEMENTATIONS.map((impl, i) => {
  const x = IMPL.xs[i];
  if (x === undefined) throw new Error(`No Glass browser implementation position ${i}`);
  return { ...impl, x, mock: impl.id === "mock" };
});
const TO_FACE: Pt[] = [
  [AXIS_X, UI_BOX.y + UI_BOX.h],
  [AXIS_X, FACE.y],
];
const branch = (i: number): Pt[] => [
  [AXIS_X, FACE.y + FACE.h],
  [AXIS_X, FORK_Y],
  [implMid(i), FORK_Y],
  [implMid(i), IMPL.y],
];
const CODE_BOX = { x: 840, y: 276, width: 970, height: 490 };
const BROWSER = { x: 840, y: 196, w: 970, h: 704 };
const mockX = IMPL.xs[1];
if (mockX === undefined) throw new Error("Glass browser requires its mock implementation position");
const TO_FRAME: Pt[] = [
  [mockX + IMPL.w, IMPL.y + IMPL.h / 2],
  [BROWSER.x, IMPL.y + IMPL.h / 2],
];
const DATA = ink("cyan", 2);
const FOCUS: readonly (readonly [number, number])[] = [
  [1, 2],
  [4, 4],
  [6, 10],
  [12, 12],
];
const box = (b: { x: number; y: number; w: number; h: number }) => ({
  left: `${(b.x / STAGE.width) * 100}%`,
  top: `${(b.y / STAGE.height) * 100}%`,
  width: `${(b.w / STAGE.width) * 100}%`,
  height: `${(b.h / STAGE.height) * 100}%`,
});

export function GlassBrowserStage() {
  const s = useTween({ frame: OFF, mock: OFF, code: OFF, swap: OFF, demo: OFF });
  const { clicks, isActive, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { frame: ON, duration: DUR.grow, ease: SETTLE });
      tl.to(s, { code: ON, duration: DUR.card, ease: SETTLE }, `-=${DUR.card}`);
      tl.to(s, { mock: ON, duration: DUR.grow, ease: DRAW });
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { swap: ON, duration: DUR.opacity, ease: SETTLE });
      tl.to(s, { demo: ON, duration: DUR.card, ease: SETTLE });
      beat(1);
    },
  });
  const rest = s.frame * (ON - s.demo * (ON - DIM));
  const mockLit = s.mock > 0.5;
  const { renderContext } = useSlide();
  const onDemoBeat = clicks >= 1;
  const live = renderContext === "slide" && isActive && onDemoBeat;
  const [loaded, setLoaded] = useState(false);
  if (!live && loaded) setLoaded(false);

  const view = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: ON, height: OFF });
  useLayoutEffect(() => {
    const el = view.current;
    if (!el) return;
    const measure = () => {
      if (el.clientWidth === 0) return;
      const scale = el.clientWidth / DEMO_LAYOUT_WIDTH;
      setFit({ scale, height: el.clientHeight / scale });
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <StoryStage
      beats={beats}
      click={clicks}
      stage={
        <>
          <g style={{ opacity: rest }}>
            <path className="sf-wire" d={polyline(TO_FACE)} />
            <path className="sf-wire" d={polyline(branch(0))} />
            <rect className="sf-box" x={UI_BOX.x} y={UI_BOX.y} width={UI_BOX.w} height={UI_BOX.h} />
            <text className="sf-name" x={UI_BOX.x + 24} y={UI_BOX.y + 40}>
              {UI.name}
            </text>
            <text className="sf-mono is-small" x={UI_BOX.x + 24} y={UI_BOX.y + 68}>
              {UI.path}
            </text>
            {LINT_RULE.map((line, i) => (
              <text
                key={line}
                className="sf-mono is-small"
                x={AXIS_X + 22}
                y={UI_BOX.y + UI_BOX.h + 30 + i * 24}
              >
                {line}
              </text>
            ))}
            <rect className="sf-boundary" x={FACE.x} y={FACE.y} width={FACE.w} height={FACE.h} />
            <text className="sf-mono" x={FACE.x + 24} y={FACE.y + 38}>
              {INTERFACE.name}
            </text>
            <text className="sf-mono is-small" x={FACE.x + 24} y={FACE.y + 66}>
              {INTERFACE.path}
            </text>
            {impls
              .filter((impl) => !impl.mock)
              .map((impl) => (
                <g key={impl.id}>
                  <rect className="sf-box" x={impl.x} y={IMPL.y} width={IMPL.w} height={IMPL.h} />
                  <text className="sf-name" x={impl.x + 24} y={IMPL.y + 42}>
                    {impl.name}
                  </text>
                  <text className="sf-mono is-small" x={impl.x + 24} y={IMPL.y + 72}>
                    {impl.note}
                  </text>
                </g>
              ))}
          </g>
          <g style={{ opacity: s.frame, color: DATA }}>
            <path
              className="sf-wire"
              d={polyline(branch(1))}
              style={{ stroke: mockLit ? DATA : undefined }}
            />
            <path
              className="sf-wire"
              d={polyline(TO_FRAME)}
              style={{ stroke: DATA, opacity: s.demo }}
            />
            {impls
              .filter((impl) => impl.mock)
              .map((impl) => (
                <g key={impl.id}>
                  <rect
                    className={`sf-box${mockLit ? " is-lit" : ""}`}
                    x={impl.x}
                    y={IMPL.y}
                    width={IMPL.w}
                    height={IMPL.h}
                  />
                  <text className="sf-name" x={impl.x + 24} y={IMPL.y + 42}>
                    {impl.name}
                  </text>
                  <text className="sf-mono is-small" x={impl.x + 24} y={IMPL.y + 72}>
                    {impl.note}
                  </text>
                </g>
              ))}
          </g>
        </>
      }
      overlay={
        <>
          <h2 className="od-story-head">The StatGlass UI also runs in a browser tab.</h2>
          <NamePlate id="statglass" chipOnly />
          <EvidenceTag kind="schematic" x={110} y={226} progress={s.frame} />
          <CodePane
            excerpt={TRANSPORT_INTERFACE}
            focus={FOCUS}
            progress={s.code * (ON - s.swap)}
            {...CODE_BOX}
          />
          <div
            className={`glass-browser ${styles["glass-browser"]}${onDemoBeat ? " is-on" : ""}`}
            style={{ ...box(BROWSER), opacity: s.demo }}
          >
            <div className={`glass-browser-bar ${styles["glass-browser-bar"]}`}>
              <span className={`glass-browser-dots ${styles["glass-browser-dots"]}`}>
                <i />
                <i />
                <i />
              </span>
              <span className={`glass-browser-address ${styles["glass-browser-address"]}`}>
                {DEMO_ADDRESS}
              </span>
            </div>
            <div ref={view} className={`glass-browser-view ${styles["glass-browser-view"]}`}>
              <div className={`glass-browser-wait ${styles["glass-browser-wait"]}`}>
                <span className={`glass-browser-url ${styles["glass-browser-url"]}`}>
                  {DEMO_ADDRESS}
                </span>
                <span className={`glass-browser-line ${styles["glass-browser-line"]}`}>
                  Live demo loads in the slide view
                </span>
              </div>
              {live && (
                <iframe
                  className={`glass-browser-app ${styles["glass-browser-app"]}`}
                  src={DEMO_URL}
                  style={{
                    width: `${DEMO_LAYOUT_WIDTH}px`,
                    height: `${fit.height}px`,
                    transform: `scale(${fit.scale})`,
                    opacity: loaded ? ON : OFF,
                  }}
                  title="StatGlass dashboard, running on its mock transport"
                  referrerPolicy="no-referrer"
                  onLoad={() => setLoaded(true)}
                />
              )}
            </div>
          </div>
          <EvidenceTag
            kind="illustrative"
            x={BROWSER.x + BROWSER.w}
            y={BROWSER.y + BROWSER.h + 12}
            align="right"
            progress={s.demo}
          >
            Illustrative data · the real app, mock transport
          </EvidenceTag>
          <ThreadRail current="statglass" />
        </>
      }
      card={<StoryCard anchor="left" hue="cyan" lead={copy.lead} body={copy.body} />}
    />
  );
}
