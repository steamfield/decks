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
  const box = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const target = host.current;
    const outer = box.current;
    if (!target || !outer || scale <= 0) return;
    let term: Terminal | undefined;
    let unsubscribe: (() => void) | undefined;
    let disposed = false;
    const observer = new ResizeObserver(() => fit());
    const metrics = document.createElement("canvas").getContext("2d");
    const fit = () => {
      if (!term || !metrics || disposed || !target.clientWidth || !target.clientHeight) return;
      const dpr = window.devicePixelRatio;
      const cellWidth = (target.clientWidth * dpr) / cols;
      const cellHeight = Math.floor((target.clientHeight * dpr) / rows);
      metrics.font = `${fontSize * scale}px ${fontFamily}`;
      const base = metrics.measureText("W");
      const baseHeight = base.fontBoundingBoxAscent + base.fontBoundingBoxDescent;
      const fitHeight = cellHeight / (baseHeight * dpr);
      // Letter spacing rounds to whole device pixels. Put its remainder in the font size.
      const spacing = Math.max(0, Math.ceil(cellWidth - base.width * dpr * fitHeight));
      const fitted = (cellWidth - spacing) / (base.width * dpr);
      const nextSize = Math.max(1, fontSize * scale * fitted);
      metrics.font = `${nextSize}px ${fontFamily}`;
      const next = metrics.measureText("W");
      const charHeight = Math.ceil(
        (next.fontBoundingBoxAscent + next.fontBoundingBoxDescent) * dpr,
      );
      term.options.fontSize = nextSize;
      term.options.letterSpacing = spacing;
      term.options.lineHeight = Math.max(1, (cellHeight + 0.001) / charHeight);
      term.refresh(0, rows - 1);
    };
    let density = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    const refit = () => {
      fit();
      density.removeEventListener("change", refit);
      density = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      density.addEventListener("change", refit);
    };
    density.addEventListener("change", refit);
    window.addEventListener("resize", refit);
    void document.fonts.ready.then(() => {
      if (disposed) return;
      try {
        term = new Terminal({
          rows,
          cols,
          fontFamily,
          fontSize: fontSize * scale,
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
        fit();
        observer.observe(outer);
      } catch (error) {
        connection.unavailable(
          `terminal could not open: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    });
    return () => {
      disposed = true;
      observer.disconnect();
      density.removeEventListener("change", refit);
      window.removeEventListener("resize", refit);
      unsubscribe?.();
      term?.dispose();
    };
  }, [connection, rows, cols, scale, fontFamily, fontSize, colors]);
  return (
    <div ref={box} style={{ width: "100%", height: "100%", overflow: "hidden" }}>
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
