import { type CSSProperties, useMemo, useState } from "react";
import { brushRibbon } from "../geometry/brush";
import { clamp01 } from "../geometry/scales";
import { STAGE } from "../story/story-stage";
import { FILTER_IDS, filterUrl } from "../theme/filters";
import type { InkStep } from "../theme/theme";
import { ink } from "../theme/theme";
import type { Hue } from "../theme/theme-resolve";
import { tokenizeSql } from "./code-tokens";
import { inkStyle, STROKE } from "./ink-style";

/** Parent timelines drive reveal: first the frame, then the crisp, unfiltered code. */
export function CodeInk({
  lines,
  x,
  y,
  width,
  height,
  label = "",
  hue = "slate",
  step = 2,
  labelColor = "",
  overflow = false,
  scroll = false,
  surface = false,
  reveal = 1,
  fontSize = 1,
  lang,
  href,
  seed = "code-ink",
}: {
  lines: string[];
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  hue?: Hue;
  step?: InkStep;
  labelColor?: string;
  overflow?: boolean;
  scroll?: boolean;
  surface?: boolean;
  reveal?: number;
  fontSize?: number;
  lang?: "sql";
  href?: string;
  seed?: string;
}) {
  const clean = inkStyle() === "clean";
  const [active, setActive] = useState(false);
  const frameProgress = clamp01(reveal / 0.6);
  const textProgress = clamp01((reveal - 0.5) / 0.5);
  const color = ink(hue, step);
  const interactive = (Boolean(href) || scroll) && textProgress > 0.5;
  const lit = active && interactive;
  const dabs = useMemo(
    () =>
      clean
        ? []
        : brushRibbon(
            [
              { x, y },
              { x: x + width, y },
              { x: x + width, y: y + height },
              { x, y: y + height },
              { x, y },
            ],
            {
              seed: `${seed}:frame`,
              width: 3.4,
              taperIn: 0.02,
              taperOut: 0.04,
              startWidth: 0.8,
              endWidth: 0.6,
              wobble: 1.1,
              edge: 0.6,
              samples: 14,
            },
          ),
    [clean, x, y, width, height, seed],
  );
  const boxStyle: CSSProperties = {
    left: `${(x / STAGE.width) * 100}%`,
    top: `${(y / STAGE.height) * 100}%`,
    width: `${(width / STAGE.width) * 100}%`,
    height: `${(height / STAGE.height) * 100}%`,
    fontSize: `calc(${fontSize} * var(--sw))`,
    opacity: textProgress,
    transform: `translateY(calc(${((1 - textProgress) * 10) / 19.2} * var(--sw)))`,
  };
  const Box = href ? "a" : "div";
  const rows = lines.map((line, i) => ({
    id: `line${i}`,
    line,
    tokens: tokenizeSql(line).map((token, j) => ({ ...token, id: `token${j}` })),
  }));
  return (
    <>
      <div className="od-stage-layer" aria-hidden="true">
        <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <g style={{ clipPath: `inset(0 ${(1 - frameProgress) * 100}% 0 0)`, color }}>
            {clean ? (
              <rect
                x={x}
                y={y}
                width={width}
                height={height}
                rx={10}
                fill="none"
                stroke="currentColor"
                strokeWidth={STROKE.rule}
                strokeOpacity={lit ? 1 : 0.7}
              />
            ) : (
              <g filter={filterUrl(FILTER_IDS.rule)}>
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
          </g>
        </svg>
      </div>
      <Box
        className={`od-codeink${overflow ? " is-overflow" : ""}${scroll ? " is-scroll" : ""}${surface ? " is-surface" : ""}${href ? " is-link" : ""}${interactive ? " is-interactive" : ""}${lit ? " is-lit" : ""}`}
        style={boxStyle}
        href={href}
        target={href ? "_blank" : undefined}
        rel={href ? "noopener" : undefined}
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(false)}
      >
        {label && (
          <div className="od-codeink-label" style={{ color: labelColor || color }}>
            {label}
          </div>
        )}
        <pre className="od-codeink-body">
          {rows.map((row) => (
            <span key={row.id} className="od-codeink-line">
              {lang === "sql"
                ? row.tokens.map((token) => (
                    <span
                      key={token.id}
                      style={{
                        color:
                          token.kind === "keyword"
                            ? color
                            : token.kind === "literal"
                              ? ink("amber", 3)
                              : undefined,
                      }}
                    >
                      {token.text}
                    </span>
                  ))
                : row.line}
            </span>
          ))}
        </pre>
      </Box>
    </>
  );
}
