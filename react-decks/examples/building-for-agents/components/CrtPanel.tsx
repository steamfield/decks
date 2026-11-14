import { STAGE } from "@react-decks/kit";
import type { ReactNode } from "react";
import styles from "./CrtPanel.module.css";

export function CrtPanel({
  x,
  y,
  width,
  height,
  label = "",
  fig = "",
  tag = "",
  progress = 1,
  power = 1,
  children,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  fig?: string;
  tag?: string;
  progress?: number;
  power?: number;
  children?: ReactNode;
}) {
  return (
    <div
      className={`sf-panel ${styles["sf-panel"]}`}
      style={{
        left: `${(x / STAGE.width) * 100}%`,
        top: `${(y / STAGE.height) * 100}%`,
        width: `${(width / STAGE.width) * 100}%`,
        height: `${(height / STAGE.height) * 100}%`,
        opacity: progress,
      }}
    >
      <div className={`sf-panel-screen ${styles["sf-panel-screen"]}`}>
        {label && <div className={`sf-panel-label ${styles["sf-panel-label"]}`}>{label}</div>}
        <div
          className={`sf-panel-content ${styles["sf-panel-content"]}`}
          style={{ opacity: power }}
        >
          {children}
        </div>
      </div>
      {(fig || tag) && (
        <div className={`sf-panel-band ${styles["sf-panel-band"]}`}>
          <span className={`sf-panel-fig ${styles["sf-panel-fig"]}`}>{fig}</span>
          <span className="sf-panel-tag" style={{ opacity: power }}>
            {tag}
          </span>
        </div>
      )}
    </div>
  );
}
