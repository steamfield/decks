import { useId } from "react";
import { MARK_PATH, MARK_SIZE, SUNSET_STOPS } from "../data/brand";
import styles from "./SfMark.module.css";

/**
 * The Steamfield mark, filled with the sunset gradient as the site draws it: one gradient
 * across the whole mark, never per band.
 */
export function SfMark({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg className={className} viewBox={`0 0 ${MARK_SIZE} ${MARK_SIZE}`} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop className={`sf-sun-1 ${styles["sf-sun-1"]}`} offset={SUNSET_STOPS[0]} />
          <stop className={`sf-sun-2 ${styles["sf-sun-2"]}`} offset={SUNSET_STOPS[1]} />
          <stop className={`sf-sun-3 ${styles["sf-sun-3"]}`} offset={SUNSET_STOPS[2]} />
          <stop className={`sf-sun-4 ${styles["sf-sun-4"]}`} offset={SUNSET_STOPS[3]} />
        </linearGradient>
      </defs>
      <path d={MARK_PATH} fill={`url(#${id})`} />
    </svg>
  );
}
