import { type ITheme, Terminal } from "@xterm/xterm";
import { useLayoutEffect, useRef } from "react";
import type { TermConnection } from "./connection";
import "@xterm/xterm/css/xterm.css";

export function XtermHost({
  connection,
  rows,
  cols,
  scale,
  fontFamily,
  fontSize,
  colors,
}: {
  connection: TermConnection;
  rows: number;
  cols: number;
  scale: number;
  fontFamily: string;
  fontSize: number;
  colors: ITheme;
}) {
  const host = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const target = host.current;
    if (!target || scale <= 0) return;
    let term: Terminal | undefined;
    let unsubscribe: (() => void) | undefined;
    let disposed = false;
    void document.fonts.ready.then(() => {
      if (disposed) return;
      try {
        // xterm lays text out on a grid of whole device pixels. At a size whose glyph advance
        // is fractional, glyphs drift off their cells and the last columns are clipped, so
        // take the nearest size whose advance is whole.
        const ruler = document.createElement("canvas").getContext("2d");
        if (!ruler) throw new Error("no 2d canvas to measure the terminal font");
        ruler.font = `${fontSize * scale}px ${fontFamily}`;
        const advance = ruler.measureText("W").width * window.devicePixelRatio;
        term = new Terminal({
          rows,
          cols,
          fontFamily,
          fontSize: (fontSize * scale * Math.max(1, Math.round(advance))) / advance,
          letterSpacing: 0,
          lineHeight: 1.12,
          theme: colors,
          cursorBlink: false,
          scrollback: 2000,
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
        term.onData((data) => connection.input(data));
        unsubscribe = connection.subscribeOutput((chunk) => term?.write(chunk));
      } catch (error) {
        connection.unavailable(
          `terminal could not open: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    });
    return () => {
      disposed = true;
      unsubscribe?.();
      term?.dispose();
    };
  }, [connection, rows, cols, scale, fontFamily, fontSize, colors]);
  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <div
        ref={host}
        role="application"
        aria-label="Live terminal"
        onKeyDown={(event) => event.stopPropagation()}
        onKeyUp={(event) => event.stopPropagation()}
        style={{
          width: `${scale * 100}%`,
          height: `${scale * 100}%`,
          transform: `scale(${1 / scale})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}
