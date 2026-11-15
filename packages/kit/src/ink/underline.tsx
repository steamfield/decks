import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { brushRibbon } from "../geometry/brush";
import { hashSigned } from "../geometry/hash";
import { FILTER_IDS, filterUrl } from "../theme/filters";
import type { InkStep } from "../theme/theme";
import { ink } from "../theme/theme";
import type { Hue } from "../theme/theme-resolve";
import { inkStyle } from "./ink-style";

/** The mark follows the typeset word, including font loading and frame resizing. */
export function Underline({
  children,
  hue = "amber",
  step = 3,
  thickness = 5,
}: {
  children: ReactNode;
  hue?: Hue;
  step?: InkStep;
  thickness?: number;
}) {
  const host = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState({ width: 0, word: "" });
  useLayoutEffect(() => {
    const element = host.current;
    if (!element) return;
    const measure = () => {
      const width = element.offsetWidth;
      const word = (element.textContent ?? "").trim();
      setSize((previous) =>
        previous.width === width && previous.word === word ? previous : { width, word },
      );
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  });
  const { width, word } = size;
  const height = Math.max(thickness * 3, 12);
  const clean = inkStyle() === "clean";
  const mid = height / 2;
  const cleanPath =
    width < 4 ? "" : `M1 ${mid} Q${width / 2} ${mid + thickness * 0.6} ${width - 1} ${mid}`;
  const seed = `underline:${word}`;
  const lift = hashSigned(seed, 1, thickness);
  const dabs =
    clean || width < 4
      ? []
      : brushRibbon(
          [
            { x: 1, y: mid + lift },
            { x: width / 2, y: mid + hashSigned(seed, 2, thickness) },
            { x: width - 1, y: mid - lift },
          ],
          {
            seed,
            width: thickness,
            taperIn: 0.14,
            taperOut: 0.22,
            wobble: thickness * 0.22,
            edge: thickness * 0.16,
            samples: 9,
          },
        );
  return (
    <span ref={host} className="od-underline">
      {children}
      {(dabs.length > 0 || cleanPath) && (
        <svg
          className="od-underline-mark"
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          aria-hidden="true"
          style={{ color: ink(hue, step) }}
        >
          {clean ? (
            <path
              d={cleanPath}
              fill="none"
              stroke="currentColor"
              strokeWidth={thickness * 0.6}
              strokeLinecap="round"
            />
          ) : (
            <g filter={filterUrl(FILTER_IDS.dry)}>
              {dabs.map((dab) => (
                <path
                  key={dab.d}
                  d={dab.d}
                  fill="currentColor"
                  style={{ fillOpacity: dab.fillOpacity }}
                />
              ))}
            </g>
          )}
        </svg>
      )}
    </span>
  );
}
