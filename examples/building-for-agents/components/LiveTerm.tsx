import { useDeck, useSlide } from "@steamfield/decks";
import { ink, useFrameScale } from "@steamfield/decks/kit";
import { motionMode } from "@steamfield/decks/motion";
import {
  type ComponentType,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { TermLine } from "../data/types";
import { terminalFace } from "../term/client/terminal-face";
import { useLiveTerm } from "../term/client/use-live-term";
import type { XtermHost } from "../term/client/xterm-host";
import type { TermPaneSpec } from "../term/protocol";
import { CrtPanel } from "./CrtPanel";
import styles from "./LiveTerm.module.css";
import { TermPane } from "./TermPane";

/** What a pane shows whenever it is not live. */
export type TermRecording =
  | {
      kind: "lines";
      lines: readonly TermLine[];
      /** `shownAt[click]` is how many lines are visible at that click. */
      shownAt: readonly number[];
      /** The evidence tag, for example "Recorded 2026-11-16 · stacks 0.12.0". */
      tag: string;
    }
  | {
      kind: "poster";
      /** A still of a full-screen program, served from the deck's public directory. */
      src: string;
      alt: string;
      /** The first click at which the still is visible. */
      from: number;
      tag: string;
    };

function subscribeMotion(notify: () => void) {
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-deck-motion"],
  });
  return () => observer.disconnect();
}

/**
 * One terminal pane on a demo slide. It shows `recording` stepped by `click`; when the deck is
 * presented from a dev server started with DECKS_LIVE_TERM=1, the same pane runs `pane` in a
 * real shell instead.
 */
export function LiveTerm({
  pane,
  click,
  recording,
  x,
  y,
  width,
  height,
  label = "",
  caption,
  size,
}: {
  pane: TermPaneSpec;
  click: number;
  recording: TermRecording;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  caption: string;
  size?: number;
}) {
  const { renderContext, isActive } = useSlide();
  const { view, embedded } = useDeck();
  const scale = useFrameScale();
  const motion = useSyncExternalStore(
    subscribeMotion,
    () => motionMode() === "live",
    () => false,
  );
  const eligible = renderContext === "slide" && isActive && view === "play" && !embedded && motion;
  const terminalBox = useRef<HTMLDivElement>(null);
  const live = useLiveTerm(import.meta.hot, pane, eligible, click);
  const [Host, setHost] = useState<ComponentType<Parameters<typeof XtermHost>[0]>>();
  useEffect(() => {
    if (!import.meta.hot || !live.live) return;
    const element = terminalBox.current;
    if (!element) return;
    const font = getComputedStyle(element).getPropertyValue("--sf-font-term").trim();
    let cancelled = false;
    void Promise.all([
      import("../term/client/xterm-host"),
      document.fonts.load(`${size ?? 31}px ${font}`),
      document.fonts.ready,
    ])
      .then(([{ XtermHost }]) => {
        if (!cancelled) setHost(() => XtermHost);
      })
      .catch(
        (error: unknown) =>
          !cancelled &&
          live.connection?.unavailable(
            `terminal could not load: ${error instanceof Error ? error.message : String(error)}`,
          ),
      );
    return () => {
      cancelled = true;
    };
  }, [live.live, live.connection, size]);
  const [face, setFace] = useState<{
    key: string;
    font: string;
    size: number;
    layout: ReturnType<typeof terminalFace>;
    colors: Parameters<typeof XtermHost>[0]["colors"];
  }>();
  useLayoutEffect(() => {
    const element = terminalBox.current;
    if (!element) return;
    // Resolve TermPane's frame-relative type before handing screen pixels to xterm.
    element.style.fontSize = `calc(${(size ?? 31) / 19.2} * var(--sw))`;
    let disposed = false;
    const measure = () => {
      if (disposed) return;
      const css = getComputedStyle(element);
      const fontSize = Number.parseFloat(css.fontSize);
      const token = (name: string) => css.getPropertyValue(name).trim();
      const content = element.querySelector(".sf-panel-content");
      if (!content) return;
      const bounds = content.getBoundingClientRect();
      if (scale <= 0 || bounds.width <= 0 || bounds.height <= 0) return;
      const padding = getComputedStyle(content);
      const font = token("--sf-font-term");
      const layout = terminalFace({
        fontFamily: font,
        fontSize,
        scale,
        devicePixelRatio: window.devicePixelRatio,
        rows: pane.rows,
        cols: pane.cols,
        width:
          bounds.width -
          (Number.parseFloat(padding.paddingLeft) + Number.parseFloat(padding.paddingRight)) *
            scale,
        height:
          bounds.height -
          (Number.parseFloat(padding.paddingTop) + Number.parseFloat(padding.paddingBottom)) *
            scale,
      });
      element.style.setProperty(
        "--live-term-width",
        `${(layout.gridWidth * layout.residual) / scale}px`,
      );
      element.style.setProperty(
        "--live-term-height",
        `${(layout.gridHeight * layout.residual) / scale}px`,
      );
      element.style.setProperty("--live-term-margin", `${layout.margin / scale}px`);
      element.style.setProperty(
        "--live-term-line-height",
        `${(layout.rowHeight * layout.residual) / scale}px`,
      );
      const key = `${font}:${fontSize}:${scale}:${bounds.width}:${bounds.height}:${window.devicePixelRatio}:${layout.fontSize}`;
      setFace((current) =>
        current?.key === key
          ? current
          : {
              key,
              font,
              size: fontSize,
              layout,
              colors: {
                background: token("--od-screen-black"),
                foreground: token("--od-text"),
                cursor: token("--od-phosphor"),
                black: token("--od-text-faint"),
                red: ink("rose", 1),
                green: token("--od-phosphor"),
                yellow: token("--od-amber"),
                blue: ink("violet", 2),
                magenta: token("--od-pink"),
                cyan: token("--od-cyan"),
                white: token("--od-text-secondary"),
                brightBlack: token("--od-text-muted"),
                brightRed: ink("rose", 3),
                brightGreen: ink("emerald", 3),
                brightYellow: ink("amber", 3),
                brightBlue: ink("violet", 3),
                brightMagenta: ink("rose", 4),
                brightCyan: ink("cyan", 3),
                brightWhite: token("--od-text-highlight"),
                scrollbarSliderBackground: token("--od-text-faint"),
                scrollbarSliderHoverBackground: token("--od-text-muted"),
                scrollbarSliderActiveBackground: token("--od-cyan"),
              },
            },
      );
    };
    measure();
    void document.fonts.ready.then(measure);
    const observer = new ResizeObserver(measure);
    if (element.parentElement) observer.observe(element.parentElement);
    window.addEventListener("resize", measure);
    return () => {
      disposed = true;
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [size, scale, pane.rows, pane.cols]);
  const showingLive = live.live && Host && face && live.connection;
  const queued = live.queued.length > 0;
  const tag = showingLive
    ? `Live${queued ? " · queued" : live.busy ? " · busy" : ""}`
    : `${recording.tag}${queued ? " · live queued" : ""}${live.reason ? ` · live unavailable: ${live.reason}` : ""}`;
  const box = { x, y, width, height, label, tag, fig: caption };
  let content: ReactNode;
  if (showingLive && Host && face && live.connection) {
    content = (
      <CrtPanel {...box}>
        <div className={styles.terminal}>
          <Host
            connection={live.connection}
            rows={pane.rows}
            cols={pane.cols}
            scale={scale}
            fontFamily={face.font}
            fontSize={face.size}
            colors={face.colors}
            wheelTarget={terminalBox.current ?? undefined}
          />
        </div>
      </CrtPanel>
    );
  } else if (recording.kind === "poster") {
    content = (
      <CrtPanel {...box} power={click >= recording.from ? 1 : 0}>
        <img src={recording.src} alt={recording.alt} />
      </CrtPanel>
    );
  } else {
    const shown = recording.shownAt[Math.min(click, recording.shownAt.length - 1)];
    if (shown === undefined) throw new Error(`LiveTerm recording for ${box.label} has no shownAt`);
    content = (
      <TermPane
        {...box}
        lines={recording.lines}
        shown={shown}
        size={
          face
            ? ((size ?? 31) * face.layout.fontSize * face.layout.residual) / (face.size * scale)
            : size
        }
        follow={false}
      />
    );
  }
  return (
    <div ref={terminalBox} className={styles.skin}>
      {content}
    </div>
  );
}
