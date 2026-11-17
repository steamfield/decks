import type { Terminal } from "@xterm/xterm";

/** Fit xterm's measured grid at a whole device-pixel advance, without scaling it. */
export function terminalFace(
  terminal: Terminal,
  fontFamily: string,
  width: number,
  height: number,
  devicePixelRatio: number,
) {
  const ruler = document.createElement("canvas").getContext("2d");
  if (!ruler) throw new Error("no 2d canvas to measure the terminal font");
  ruler.font = `1000px ${fontFamily}`;
  const advance = ruler.measureText("W").width / 1000;
  const screen = terminal.element?.querySelector<HTMLElement>(".xterm-screen");
  if (!screen) throw new Error("no xterm screen to measure");
  const scrollbar = 6;
  let cell = Math.floor(((width - scrollbar) * devicePixelRatio) / terminal.cols);
  for (; cell >= 1; cell--) {
    terminal.options.fontSize = cell / (advance * devicePixelRatio);
    // xterm measures the font's bounding box and rounds its rows. Read that result rather
    // than estimating row height from fontSize, which clips fonts with tall bounding boxes.
    const gridWidth = screen.offsetWidth;
    const gridHeight = screen.offsetHeight;
    // xterm rounds its screen to CSS pixels, including half-pixel grids with odd cols at DPR 2.
    const wholeAdvance = Number.isInteger((gridWidth * devicePixelRatio) / terminal.cols);
    if (wholeAdvance && gridWidth + scrollbar <= width && gridHeight <= height) {
      return {
        gridWidth,
        gridHeight,
        rowHeight: gridHeight / terminal.rows,
        scrollbar,
        left: (width - gridWidth - scrollbar) / 2,
        top: (height - gridHeight) / 2,
      };
    }
  }
  throw new Error(
    `terminal grid ${terminal.cols} by ${terminal.rows} cannot fit ${width} by ${height}`,
  );
}
