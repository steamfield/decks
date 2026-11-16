import { useDeck, useSlide } from "@steamfield/decks";
import { useFrameScale } from "@steamfield/decks/kit";
import { motionMode } from "@steamfield/decks/motion";
import {
  type ComponentType,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { TermLine } from "../data/types";
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
  size?: number;
}) {
  const { renderContext, isActive } = useSlide();
  const { view, embedded } = useDeck();
  const scale = useFrameScale();
  const [motion, setMotion] = useState<boolean>();
  useLayoutEffect(() => {
    const sync = () => setMotion(motionMode() === "live");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-deck-motion"],
    });
    return () => observer.disconnect();
  }, []);
  const audience = renderContext === "slide" && isActive && view === "play" && !embedded;
  const eligible = audience ? motion : false;
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
  const terminalBox = useRef<HTMLDivElement>(null);
  const [face, setFace] = useState<{
    font: string;
    size: number;
    colors: Parameters<typeof XtermHost>[0]["colors"];
  }>();
  useLayoutEffect(() => {
    const element = terminalBox.current;
    if (!element) return;
    // Resolve TermPane's frame-relative type before handing screen pixels to xterm.
    element.style.fontSize = `calc(${(size ?? 31) / 19.2} * var(--sw))`;
    const measure = () => {
      const css = getComputedStyle(element);
      const fontSize = Number.parseFloat(css.fontSize);
      const token = (name: string) => css.getPropertyValue(name).trim();
      setFace((current) =>
        current?.size === fontSize
          ? current
          : {
              font: token("--sf-font-term"),
              size: fontSize,
              colors: {
                background: token("--od-screen-black"),
                foreground: token("--od-phosphor"),
                cursor: token("--od-phosphor"),
                black: token("--od-screen-black"),
                green: token("--od-phosphor"),
                yellow: token("--od-amber"),
                blue: token("--od-violet"),
                magenta: token("--od-pink"),
                cyan: token("--od-cyan"),
                white: token("--od-text"),
                brightBlack: token("--od-text-faint"),
                brightGreen: token("--od-phosphor"),
                brightYellow: token("--od-amber"),
                brightBlue: token("--od-violet"),
                brightMagenta: token("--od-pink"),
                brightCyan: token("--od-cyan"),
                brightWhite: token("--od-text"),
              },
            },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (element.parentElement) observer.observe(element.parentElement);
    return () => observer.disconnect();
  }, [size]);
  const showingLive = live.live && Host && face && live.connection;
  const tag = showingLive
    ? `Live${live.busy ? " · busy" : ""}`
    : `${recording.tag}${live.reason ? ` · live unavailable: ${live.reason}` : ""}`;
  const box = { x, y, width, height, label, tag };
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
    content = <TermPane {...box} lines={recording.lines} shown={shown} size={size} />;
  }
  return (
    <div ref={terminalBox} className={styles.skin}>
      {content}
    </div>
  );
}
