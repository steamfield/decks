import type { TermPaneSpec } from "@steamfield/decks";
import { LiveTerm as KitLiveTerm, useFrameScale } from "@steamfield/decks/kit";
import { useLayoutEffect, useRef, useState } from "react";
import type { TermLine } from "../data/types";
import { CrtPanel } from "./CrtPanel";
import styles from "./LiveTerm.module.css";
import { TermLines } from "./TermPane";

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

/** The deck's recording and CRT skin around the framework's live pane. */
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
  size = 31,
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
  const terminalBox = useRef<HTMLDivElement>(null);
  const scale = useFrameScale();
  const [recordingSize, setRecordingSize] = useState(size);
  useLayoutEffect(() => {
    const element = terminalBox.current;
    if (!element) return;
    let disposed = false;
    const measure = () => {
      if (disposed) return;
      const content = element.querySelector(".sf-panel-content");
      if (!content) return;
      const bounds = content.getBoundingClientRect();
      if (scale <= 0 || bounds.width <= 0 || bounds.height <= 0) return;
      const padding = getComputedStyle(content);
      const css = getComputedStyle(element);
      const fontSize = Number.parseFloat(css.fontSize);
      const font = css.getPropertyValue("--sf-font-term").trim();
      const ruler = document.createElement("canvas").getContext("2d");
      if (!ruler) throw new Error(`No 2d canvas to measure recording "${pane.id}"`);
      ruler.font = `${fontSize * scale}px ${font}`;
      const dpr = window.devicePixelRatio;
      const advance = ruler.measureText("W").width * dpr;
      const cell = Math.max(1, Math.round(advance));
      const snapped = (fontSize * scale * cell) / advance;
      const rowHeight = Math.floor(snapped * 1.12 * dpr) / dpr;
      const gridWidth = Math.ceil((pane.cols * cell) / dpr);
      const gridHeight = Math.ceil(pane.rows * rowHeight);
      const availableWidth =
        bounds.width -
        (Number.parseFloat(padding.paddingLeft) + Number.parseFloat(padding.paddingRight)) * scale;
      const availableHeight =
        bounds.height -
        (Number.parseFloat(padding.paddingTop) + Number.parseFloat(padding.paddingBottom)) * scale;
      // Keep the recording's original grid fit, including its reserved scrollbar space.
      const residual = Math.min(availableWidth / (gridWidth + 6), availableHeight / gridHeight);
      element.style.setProperty("--live-term-width", `${(gridWidth * residual) / scale}px`);
      element.style.setProperty("--live-term-height", `${(gridHeight * residual) / scale}px`);
      element.style.setProperty(
        "--live-term-margin",
        `${Math.max(0, (availableWidth - (gridWidth + 6) * residual) / 2) / scale}px`,
      );
      element.style.setProperty(
        "--live-term-line-height",
        `${(gridHeight * residual) / (pane.rows * scale)}px`,
      );
      setRecordingSize((size * snapped * residual) / (fontSize * scale));
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
  }, [size, scale, pane.id, pane.rows, pane.cols]);
  const shown =
    recording.kind === "lines"
      ? recording.shownAt[Math.min(click, recording.shownAt.length - 1)]
      : undefined;
  if (recording.kind === "lines" && shown === undefined)
    throw new Error(`LiveTerm recording for ${label} has no shownAt`);
  return (
    <div
      ref={terminalBox}
      className={styles.skin}
      style={{ fontSize: `calc(${size / 19.2} * var(--sw))` }}
    >
      <KitLiveTerm
        pane={pane}
        click={click}
        fallback={
          recording.kind === "poster" ? (
            <img src={recording.src} alt={recording.alt} />
          ) : (
            <TermLines lines={recording.lines} shown={shown} size={recordingSize} follow={false} />
          )
        }
        frame={(content, status) => (
          <CrtPanel
            x={x}
            y={y}
            width={width}
            height={height}
            label={label}
            fig={caption}
            power={status.live || recording.kind === "lines" || click >= recording.from ? 1 : 0}
            tag={
              status.live
                ? `Live${status.queued ? " · queued" : status.busy ? " · busy" : ""}`
                : `${recording.tag}${status.reason ? ` · live unavailable: ${status.reason}` : ""}`
            }
          >
            {content}
          </CrtPanel>
        )}
      />
    </div>
  );
}
