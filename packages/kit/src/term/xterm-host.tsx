import { type ITheme, Terminal } from "@xterm/xterm";
import { useLayoutEffect, useRef } from "react";
import type { TermConnection } from "./connection";
import { createOutputPacer } from "./output-pacer";
import { terminalFace } from "./terminal-face";
import "@xterm/xterm/css/xterm.css";
import styles from "./live-term.module.css";

export function XtermHost({
  connection,
  rows,
  cols,
  scale,
  onReady,
}: {
  connection: TermConnection;
  rows: number;
  cols: number;
  scale: number;
  onReady: (ready: boolean) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const target = host.current;
    if (!target || scale <= 0) return;
    let term: Terminal | undefined;
    let unsubscribe: (() => void) | undefined;
    let cleanupOutput: (() => void) | undefined;
    let cleanupWheel: (() => void) | undefined;
    let cleanupFit: (() => void) | undefined;
    let disposed = false;
    const css = getComputedStyle(target.parentElement ?? target);
    const fontFamily = css.fontFamily;
    const fontSize = Number.parseFloat(css.fontSize);
    const foreground = css.color;
    const color = (name: string) =>
      css.getPropertyValue(`--deck-term-${name}`).trim() || foreground;
    const colors: ITheme = {
      foreground,
      background: css.backgroundColor,
      cursor: color("cursor"),
      selectionBackground: color("selection"),
      black: color("black"),
      red: color("red"),
      green: color("green"),
      yellow: color("yellow"),
      blue: color("blue"),
      magenta: color("magenta"),
      cyan: color("cyan"),
      white: color("white"),
      brightBlack: color("bright-black"),
      brightRed: color("bright-red"),
      brightGreen: color("bright-green"),
      brightYellow: color("bright-yellow"),
      brightBlue: color("bright-blue"),
      brightMagenta: color("bright-magenta"),
      brightCyan: color("bright-cyan"),
      brightWhite: color("bright-white"),
    };
    void Promise.all([document.fonts.load(`${fontSize}px ${fontFamily}`), document.fonts.ready])
      .then(() => {
        if (disposed) return;
        try {
          // xterm lays text out on a grid of whole device pixels. At a size whose glyph advance
          // is fractional, glyphs drift off their cells and the last columns are clipped, so
          // fit with whole advances and centre the unused space.
          const frame = target.parentElement;
          if (!frame) throw new Error("no terminal frame to measure");
          term = new Terminal({
            rows,
            cols,
            fontFamily,
            fontSize: fontSize * scale,
            letterSpacing: 0,
            lineHeight: 1.12,
            theme: colors,
            allowTransparency: true,
            drawBoldTextInBrightColors: false,
            cursorBlink: false,
            scrollback: 2000,
            overviewRuler: { width: 6, showTopBorder: false, showBottomBorder: false },
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
          const terminal = term;
          const fit = () => {
            const bounds = frame.getBoundingClientRect();
            const face = terminalFace(
              terminal,
              fontFamily,
              bounds.width,
              bounds.height,
              window.devicePixelRatio,
            );
            target.style.width = `${face.gridWidth + face.scrollbar}px`;
            target.style.height = `${face.gridHeight}px`;
            target.style.marginLeft = `${face.left / scale}px`;
            target.style.marginTop = `${face.top / scale}px`;
            target.style.transform = `scale(${1 / scale})`;
            return face;
          };
          let face = fit();
          const refit = () => {
            if (disposed) return;
            try {
              face = fit();
            } catch (error) {
              connection.unavailable(
                `terminal could not fit: ${error instanceof Error ? error.message : String(error)}`,
              );
            }
          };
          const observer = new ResizeObserver(refit);
          observer.observe(frame);
          let resolution = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
          const changedDpr = () => {
            if (disposed) return;
            resolution.removeEventListener("change", changedDpr);
            refit();
            resolution = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
            resolution.addEventListener("change", changedDpr);
          };
          resolution.addEventListener("change", changedDpr);
          cleanupFit = () => {
            observer.disconnect();
            resolution.removeEventListener("change", changedDpr);
          };
          const rendered = terminal.onRender(() => {
            // An empty replay writes only RIS; wait for visible shell text, not that reset.
            if (disposed || !target.querySelector(".xterm-rows")?.textContent?.trim()) return;
            onReady(true);
            rendered.dispose();
          });
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
          // Wheel distances are screen pixels because the host counter-scales the slide.
          let remainder = 0;
          const wheel = (event: WheelEvent) => {
            event.preventDefault();
            event.stopPropagation();
            const lineHeight = face.rowHeight;
            const pixels =
              event.deltaY *
              (event.deltaMode === 1 ? lineHeight : event.deltaMode === 2 ? rows * lineHeight : 1);
            remainder += pixels / lineHeight;
            const lines = Math.trunc(remainder);
            remainder -= lines;
            if (lines) terminal.scrollLines(lines);
          };
          frame.addEventListener("wheel", wheel, { passive: false, capture: true });
          cleanupWheel = () => frame.removeEventListener("wheel", wheel, true);
        } catch (error) {
          connection.unavailable(
            `terminal could not open: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      })
      .catch((error: unknown) => {
        if (!disposed)
          connection.unavailable(
            `terminal font could not load: ${error instanceof Error ? error.message : String(error)}`,
          );
      });
    return () => {
      disposed = true;
      onReady(false);
      unsubscribe?.();
      cleanupOutput?.();
      cleanupWheel?.();
      cleanupFit?.();
      term?.dispose();
    };
  }, [connection, rows, cols, scale, onReady]);
  return (
    <div className={styles.viewport}>
      <div
        ref={host}
        className={styles.host}
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
        }}
      />
    </div>
  );
}
