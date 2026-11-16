/** Measure the snapped grid, then fit it uniformly without changing its rows or columns. */
export function terminalFace({
  fontFamily,
  fontSize,
  scale,
  devicePixelRatio,
  cols,
  rows,
  width,
  height,
}: {
  fontFamily: string;
  fontSize: number;
  scale: number;
  devicePixelRatio: number;
  cols: number;
  rows: number;
  width: number;
  height: number;
}) {
  const ruler = document.createElement("canvas").getContext("2d");
  if (!ruler) throw new Error("no 2d canvas to measure the terminal font");
  ruler.font = `${fontSize * scale}px ${fontFamily}`;
  const advance = ruler.measureText("W").width * devicePixelRatio;
  const cell = Math.max(1, Math.round(advance));
  const snapped = (fontSize * scale * cell) / advance;
  const cellWidth = cell / devicePixelRatio;
  const rowHeight = Math.floor(snapped * 1.12 * devicePixelRatio) / devicePixelRatio;
  // xterm rounds its screen box to CSS pixels even when cells use half pixels at DPR 2.
  const gridWidth = Math.ceil(cols * cellWidth);
  const gridHeight = Math.ceil(rows * rowHeight);
  const scrollbar = 6;
  const residual = Math.min(width / (gridWidth + scrollbar), height / gridHeight);
  return {
    fontSize: snapped,
    cellWidth,
    rowHeight: gridHeight / rows,
    gridWidth,
    gridHeight,
    scrollbar,
    residual,
    margin: Math.max(0, (width - (gridWidth + scrollbar) * residual) / 2),
  };
}
