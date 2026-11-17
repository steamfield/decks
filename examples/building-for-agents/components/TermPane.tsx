import type { TermLine } from "../data/types";
import { CrtPanel } from "./CrtPanel";
import styles from "./TermPane.module.css";

export function TermPane({
  lines,
  shown,
  highlight = [],
  x,
  y,
  width,
  height,
  label = "",
  fig = "",
  tag = "",
  progress = 1,
  power = 1,
  size = 31,
  follow = true,
}: {
  lines: readonly TermLine[];
  shown?: number;
  highlight?: readonly number[];
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  fig?: string;
  tag?: string;
  progress?: number;
  power?: number;
  size?: number;
  follow?: boolean;
}) {
  return (
    <CrtPanel
      x={x}
      y={y}
      width={width}
      height={height}
      label={label}
      fig={fig}
      tag={tag}
      progress={progress}
      power={power}
    >
      <TermLines lines={lines} shown={shown} highlight={highlight} size={size} follow={follow} />
    </CrtPanel>
  );
}

export function TermLines({
  lines,
  shown,
  highlight = [],
  size = 31,
  follow = true,
}: {
  lines: readonly TermLine[];
  shown?: number;
  highlight?: readonly number[];
  size?: number;
  follow?: boolean;
}) {
  const n = shown === undefined ? lines.length : Math.floor(shown + 1e-6);
  const visible = lines.slice(0, Math.max(0, n)).map((line, index) => ({ ...line, index }));
  return (
    <div
      className={`sf-term-lines ${styles["sf-term-lines"]}${follow ? " is-follow" : ""}`}
      style={{ fontSize: `calc(${size / 19.2} * var(--sw))` }}
    >
      {visible.map((line) => (
        <div
          key={line.index}
          className={`sf-term-line ${styles["sf-term-line"]} is-${line.tone ?? "out"}${highlight.includes(line.index) ? " is-hot" : highlight.length > 0 ? " is-cold" : ""}`}
        >
          <span className={`sf-term-prefix ${styles["sf-term-prefix"]}`}>
            {line.tone === "cmd" ? "$ " : line.tone === "user" ? "> " : ""}
          </span>
          {line.text}
        </div>
      ))}
    </div>
  );
}
