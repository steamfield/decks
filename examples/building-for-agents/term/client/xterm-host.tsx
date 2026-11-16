import { type ITheme, Terminal } from "@xterm/xterm";
import { useLayoutEffect, useRef } from "react";
import type { TermConnection } from "./connection";
import { createOutputPacer } from "./output-pacer";
import { terminalFace } from "./terminal-face";
import "@xterm/xterm/css/xterm.css";

export function XtermHost({
  connection,
  rows,
  cols,
  scale,
  fontFamily,
  fontSize,
  colors,
  wheelTarget,
}: {
  connection: TermConnection;
  rows: number;
  cols: number;
  scale: number;
  fontFamily: string;
  fontSize: number;
  colors: ITheme;
  wheelTarget?: HTMLElement;
}) {
  const host = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const target = host.current;
    if (!target || scale <= 0) return;
    let term: Terminal | undefined;
    let unsubscribe: (() => void) | undefined;
    let cleanupOutput: (() => void) | undefined;
    let cleanupWheel: (() => void) | undefined;
    let disposed = false;
    void document.fonts.ready.then(() => {
      if (disposed) return;
      try {
        // xterm lays text out on a grid of whole device pixels. At a size whose glyph advance
        // is fractional, glyphs drift off their cells and the last columns are clipped, so
        // take the nearest size whose advance is whole.
        const bounds = target.parentElement?.getBoundingClientRect();
        if (!bounds) throw new Error("no terminal frame to measure");
        const face = terminalFace({
          fontFamily,
          fontSize,
          scale,
          devicePixelRatio: window.devicePixelRatio,
          rows,
          cols,
          width: bounds.width,
          height: bounds.height,
        });
        term = new Terminal({
          rows,
          cols,
          fontFamily,
          fontSize: face.fontSize,
          letterSpacing: 0,
          lineHeight: 1.12,
          theme: colors,
          drawBoldTextInBrightColors: false,
          cursorBlink: false,
          scrollback: 2000,
          overviewRuler: { width: face.scrollbar, showTopBorder: false, showBottomBorder: false },
          logLevel: "off",
        });
        term.attachCustomKeyEventHandler((event) => {
          if (event.key !== "Escape") return true;
          event.preventDefault();
          event.stopPropagation();
          term?.blur();
          return false;
        });
        term.open(target);
        target.style.width = `${face.gridWidth + face.scrollbar}px`;
        target.style.height = `${face.gridHeight}px`;
        target.style.marginLeft = `${face.margin / scale}px`;
        target.style.transform = `scale(${face.residual / scale})`;
        const terminal = term;
        let replays = 0;
        const paced = createOutputPacer((chunk, replay) => {
          if (replay) {
            replays++;
            // Replayed device queries must not send old replies into the current shell.
            terminal.options.disableStdin = true;
          }
          terminal.write(chunk, () => {
            if (disposed) return;
            if (replay) {
              replays--;
              terminal.options.disableStdin = replays > 0;
            }
            terminal.scrollToBottom();
          });
        });
        term.onData((data) => {
          paced.flush();
          connection.input(data);
        });
        cleanupOutput = paced.dispose;
        unsubscribe = connection.subscribeOutput(paced.push);
        // The whole frame owns wheel input, including its label and caption band. Use
        // screen-space line height, since the host counter-scales the deck's transform.
        let remainder = 0;
        const wheel = (event: WheelEvent) => {
          event.preventDefault();
          event.stopPropagation();
          const lineHeight = face.rowHeight * face.residual;
          const pixels =
            event.deltaY *
            (event.deltaMode === 1 ? lineHeight : event.deltaMode === 2 ? rows * lineHeight : 1);
          remainder += pixels / lineHeight;
          const lines = Math.trunc(remainder);
          remainder -= lines;
          if (lines) terminal.scrollLines(lines);
        };
        const frame = wheelTarget ?? target;
        frame.addEventListener("wheel", wheel, { passive: false, capture: true });
        cleanupWheel = () => frame.removeEventListener("wheel", wheel, true);
      } catch (error) {
        connection.unavailable(
          `terminal could not open: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    });
    return () => {
      disposed = true;
      unsubscribe?.();
      cleanupOutput?.();
      cleanupWheel?.();
      term?.dispose();
    };
  }, [connection, rows, cols, scale, fontFamily, fontSize, colors, wheelTarget]);
  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <div
        ref={host}
        role="application"
        aria-label="Live terminal"
        onKeyDown={(event) => event.stopPropagation()}
        onKeyUp={(event) => event.stopPropagation()}
        style={{
          // xterm measures a glyph's width from a run of that glyph. A font with an "ff"
          // ligature (VT323) makes "f" measure half a cell, and xterm pads every f to match.
          fontVariantLigatures: "none",
          width: `${scale * 100}%`,
          height: `${scale * 100}%`,
          transform: `scale(${1 / scale})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}
